"""
AI Resume Screening System — Flask backend.

Exposes a single endpoint, POST /api/analyze, which takes a resume and a
job description, prompts the Gemini API for a structured comparison, and
returns validated JSON to the frontend.
"""

import json
import io
import os
import re

import google.generativeai as genai
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from pypdf import PdfReader
import docx

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------

load_dotenv()

app = Flask(__name__)

# In production, replace "*" with your deployed frontend origin
# (e.g. "https://your-app.vercel.app") to restrict cross-origin access.
CORS(app, resources={r"/api/*": {"origins": os.environ.get("ALLOWED_ORIGIN", "*")}})

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
MODEL_NAME = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

MAX_INPUT_CHARS = 15000  # guard against wildly oversized pastes
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB
ALLOWED_EXTENSIONS = {"pdf", "docx", "txt"}

# ---------------------------------------------------------------------------
# Prompt construction
# ---------------------------------------------------------------------------

RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "match_score": {
            "type": "integer",
            "description": "Overall match score from 0 to 100",
        },
        "matching_skills": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Skills/requirements present in both the resume and the job description",
        },
        "missing_skills": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Skills/requirements the job description asks for that the resume does not evidence",
        },
        "summary": {
            "type": "string",
            "description": "A short, plain-English summary (2-4 sentences) of the overall fit",
        },
        "suggestions": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Concrete, actionable suggestions to improve the resume's match for this job",
        },
    },
    "required": ["match_score", "matching_skills", "missing_skills", "summary", "suggestions"],
}


def build_prompt(resume_text: str, job_description: str) -> str:
    return f"""You are an expert technical recruiter and resume reviewer.

Compare the RESUME against the JOB DESCRIPTION below and evaluate the fit.

Respond with ONLY a valid JSON object matching this exact schema — no markdown
fences, no commentary, no extra keys:

{{
  "match_score": <integer 0-100, how well the resume matches the job description>,
  "matching_skills": [<strings — skills/requirements found in both>],
  "missing_skills": [<strings — requirements in the JD not evidenced in the resume>],
  "summary": "<2-4 sentence plain-English summary of the fit>",
  "suggestions": [<strings — concrete, actionable ways to improve the resume for this specific job>]
}}

Scoring guidance:
- 80-100: strong match, most core requirements are evidenced
- 50-79: partial match, some clear gaps
- 0-49: weak match, major gaps in core requirements

Be specific and grounded in the actual text below. Do not invent skills that
aren't implied by either document.

RESUME:
\"\"\"
{resume_text}
\"\"\"

JOB DESCRIPTION:
\"\"\"
{job_description}
\"\"\"
"""


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def extract_json(raw_text: str) -> dict:
    """Gemini is asked for pure JSON, but models sometimes wrap it in
    markdown fences or add stray whitespace. This strips that defensively
    before parsing, and raises ValueError if nothing usable is found."""
    text = raw_text.strip()

    # Strip ```json ... ``` or ``` ... ``` fences if present
    fence_match = re.search(r"```(?:json)?\s*(\{.*\})\s*```", text, re.DOTALL)
    if fence_match:
        text = fence_match.group(1)
    else:
        # Fall back to grabbing the first {...} block in the text
        brace_match = re.search(r"\{.*\}", text, re.DOTALL)
        if brace_match:
            text = brace_match.group(0)

    return json.loads(text)


def validate_result(data: dict) -> dict:
    """Ensure the parsed JSON has the fields we need, with safe defaults/
    coercion, so the frontend never receives a malformed shape."""
    if not isinstance(data, dict):
        raise ValueError("Model response was not a JSON object")

    score = data.get("match_score", 0)
    try:
        score = int(round(float(score)))
    except (TypeError, ValueError):
        score = 0
    score = max(0, min(100, score))

    def as_str_list(val):
        if not isinstance(val, list):
            return []
        return [str(item) for item in val if str(item).strip()]

    summary = data.get("summary", "")
    if not isinstance(summary, str):
        summary = str(summary)

    return {
        "match_score": score,
        "matching_skills": as_str_list(data.get("matching_skills")),
        "missing_skills": as_str_list(data.get("missing_skills")),
        "summary": summary.strip(),
        "suggestions": as_str_list(data.get("suggestions")),
    }


# ---------------------------------------------------------------------------
# File text extraction
# ---------------------------------------------------------------------------

def extract_text_from_pdf(file_bytes: bytes) -> str:
    reader = PdfReader(io.BytesIO(file_bytes))
    pages = [page.extract_text() or "" for page in reader.pages]
    return "\n".join(pages).strip()


def extract_text_from_docx(file_bytes: bytes) -> str:
    document = docx.Document(io.BytesIO(file_bytes))
    paragraphs = [p.text for p in document.paragraphs]
    return "\n".join(paragraphs).strip()


def extract_text_from_txt(file_bytes: bytes) -> str:
    return file_bytes.decode("utf-8", errors="ignore").strip()


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.route("/api/extract-resume", methods=["POST"])
def extract_resume():
    if "file" not in request.files:
        return jsonify({
            "error": "missing_file",
            "message": "No file was uploaded. Attach a PDF, DOCX, or TXT file.",
        }), 400

    file = request.files["file"]
    filename = (file.filename or "").lower()

    if "." not in filename or filename.rsplit(".", 1)[1] not in ALLOWED_EXTENSIONS:
        return jsonify({
            "error": "unsupported_file_type",
            "message": "Only .pdf, .docx, and .txt files are supported.",
        }), 400

    file_bytes = file.read()
    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        return jsonify({
            "error": "file_too_large",
            "message": "File must be under 5 MB.",
        }), 400

    extension = filename.rsplit(".", 1)[1]

    try:
        if extension == "pdf":
            text = extract_text_from_pdf(file_bytes)
        elif extension == "docx":
            text = extract_text_from_docx(file_bytes)
        else:
            text = extract_text_from_txt(file_bytes)
    except Exception as exc:  # noqa: BLE001 - surface a clean error to the client
        return jsonify({
            "error": "extraction_failed",
            "message": f"Could not read that file: {exc}",
        }), 422

    if not text:
        return jsonify({
            "error": "no_text_found",
            "message": "No readable text was found in that file. If it's a scanned "
                       "image-only PDF, try pasting the text manually instead.",
        }), 422

    if len(text) > MAX_INPUT_CHARS:
        text = text[:MAX_INPUT_CHARS]

    return jsonify({"text": text}), 200


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model": MODEL_NAME, "configured": bool(GEMINI_API_KEY)})


@app.route("/api/analyze", methods=["POST"])
def analyze():
    if not GEMINI_API_KEY:
        return jsonify({
            "error": "server_misconfigured",
            "message": "GEMINI_API_KEY is not set on the backend. Add it to your .env file.",
        }), 500

    body = request.get_json(silent=True) or {}
    resume_text = (body.get("resume") or "").strip()
    job_description = (body.get("job_description") or "").strip()

    # --- validation ---
    if not resume_text or not job_description:
        return jsonify({
            "error": "missing_fields",
            "message": "Both 'resume' and 'job_description' are required and cannot be empty.",
        }), 400

    if len(resume_text) > MAX_INPUT_CHARS or len(job_description) > MAX_INPUT_CHARS:
        return jsonify({
            "error": "input_too_large",
            "message": f"Each field must be under {MAX_INPUT_CHARS} characters.",
        }), 400

    prompt = build_prompt(resume_text, job_description)

    # --- call Gemini ---
    try:
        model = genai.GenerativeModel(MODEL_NAME)
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.3,
                response_mime_type="application/json",
            ),
        )
        raw_text = response.text
    except Exception as exc:  # noqa: BLE001 - surface a clean error to the client
        return jsonify({
            "error": "ai_request_failed",
            "message": f"Could not reach the Gemini API: {exc}",
        }), 502

    # --- parse + validate the model's JSON ---
    try:
        parsed = extract_json(raw_text)
        result = validate_result(parsed)
    except (ValueError, json.JSONDecodeError):
        return jsonify({
            "error": "invalid_ai_response",
            "message": "The AI did not return valid JSON. Please try again.",
        }), 502

    return jsonify(result), 200


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
