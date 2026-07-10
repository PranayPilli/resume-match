# 🎯 Resume Match

**AI-powered resume ↔ job description analyzer.** Paste a resume and a job posting (or upload a PDF/DOCX), and get back a match score, overlapping skills, missing skills, and concrete suggestions to close the gap — powered by Google's Gemini API.

**[🔗 Live Demo](https://resume-match-checker.vercel.app)** &nbsp;·&nbsp; **[🎥 Watch Demo Video](https://drive.google.com/file/d/1H8SapA2oMMS_CKeugJzOwQRoicDg2k68/view?usp=drive_link)** &nbsp;·&nbsp; **[⚙️ API Health Check](https://resume-match-w0dt.onrender.com/api/health)**

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js) ![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?logo=typescript) ![Flask](https://img.shields.io/badge/Flask-3.0-black?logo=flask) ![Gemini](https://img.shields.io/badge/Gemini_API-2.5_Flash-4285F4?logo=google) ![License](https://img.shields.io/badge/license-MIT-green)

---

## What it does

1. Paste resume + job description text, or upload a resume as PDF/DOCX
2. A structured prompt asks Gemini to compare both and return fixed-schema JSON
3. The UI renders a color-coded match score, matching/missing skill chips, a plain-English summary, and actionable suggestions

## Features

-  **Resume upload** — drop in a PDF or DOCX, text is extracted server-side automatically
-  **Match scoring** — 0–100 score with color-coded gauge (strong / partial / weak)
-  **Skill gap analysis** — matching skills vs. missing skills, shown side by side
-  **Actionable suggestions** — specific edits to improve the match for that job
-  **Robust error handling** — malformed AI output, oversized input, and missing fields are all caught and returned as clean errors instead of crashing

## Tech stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS | Modern, market-standard full-stack frontend |
| Backend | Python, Flask, Flask-CORS | Simple, explainable REST API — one clear endpoint |
| AI | Google Gemini API (`gemini-2.5-flash`) | Free tier, strong structured-output support |
| File parsing | `pypdf`, `python-docx` | Server-side text extraction from uploaded resumes |
| Deployment | Vercel (frontend) + Render (backend) | Both free tiers, zero cost to run |

## Project structure

```text
resume-match/
├── backend/
│   ├── app.py              # Flask routes, Gemini integration, file parsing
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── app/
    │   ├── components/     # AnalyzerForm.tsx, ResultPanel.tsx
    │   ├── lib/            # api.ts, types.ts, sampleData.ts
    │   ├── layout.tsx
    │   └── page.tsx
    └── package.json
```

## Run it locally

```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env   # add your free Gemini key from aistudio.google.com/apikey
python app.py          # → http://localhost:5000

# Frontend (new terminal)
cd frontend
npm install
cp .env.local.example .env.local
npm run dev             # → http://localhost:3000
```

## API

**POST** `/api/analyze`

```json
{
  "resume": "full resume text...",
  "job_description": "full job posting text..."
}
```

```json
{
  "match_score": 78,
  "matching_skills": [
    "React",
    "TypeScript",
    "REST APIs"
  ],
  "missing_skills": [
    "Docker",
    "CI/CD"
  ],
  "summary": "Strong frontend alignment with some gaps in DevOps tooling.",
  "suggestions": [
    "Add a project that demonstrates CI/CD experience...",
    "..."
  ]
}
```

**POST** `/api/extract-resume` — accepts a `multipart/form-data` file (`pdf`/`docx`/`txt`), returns `{ "text": "..." }`

Errors always return `{ "error": "code", "message": "human-readable explanation" }` with an appropriate 4xx/5xx status.

## Design decisions 

- **Stateless architecture** — No database or authentication is required because each analysis is independent.
- **Structured AI responses** — The backend validates Gemini's output and returns meaningful errors if parsing fails.
- **Future improvements** — Embeddings or semantic search can improve matching accuracy.

## License

MIT
