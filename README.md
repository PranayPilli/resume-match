# Resume Match — AI Resume Screening System

Paste a resume and a job description, get back a match score, overlapping
skills, missing skills, a plain-English summary, and concrete suggestions —
powered by the Gemini API.

```
resume-match/
├── README.md
├── backend/
│   ├── app.py              # Flask routes + Gemini integration
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── app/
    │   ├── components/     # AnalyzerForm.tsx, ResultPanel.tsx
    │   ├── lib/             # api.ts, types.ts, sampleData.ts
    │   ├── layout.tsx
    │   ├── page.tsx
    │   └── globals.css
    ├── package.json
    └── tsconfig.json
```

---

## 1. Get a free Gemini API key

1. Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Sign in with a Google account and click **Create API key**
3. Copy the key — no credit card required for the free tier

---

## 2. Run the backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# open .env and paste your key into GEMINI_API_KEY=

python app.py
```

The API now runs at `http://localhost:5000`. Sanity check:

```bash
curl http://localhost:5000/api/health
# {"status":"ok","model":"gemini-2.5-flash","configured":true}
```

---

## 3. Run the frontend

In a **second terminal**:

```bash
cd frontend
npm install

cp .env.local.example .env.local
# defaults to NEXT_PUBLIC_API_URL=http://localhost:5000, which is correct for local dev

npm run dev
```

Open `http://localhost:3000`. Click **Fill sample data** to try it instantly,
or paste your own resume and a job posting, then click **Analyze match**.

---

## 4. API contract

**POST** `/api/analyze`

Request body:
```json
{
  "resume": "full resume text...",
  "job_description": "full job posting text..."
}
```

Success response (`200`):
```json
{
  "match_score": 78,
  "matching_skills": ["React", "TypeScript", "REST APIs"],
  "missing_skills": ["Docker", "CI/CD"],
  "summary": "Strong frontend alignment with some gaps in DevOps tooling.",
  "suggestions": ["Add a project that shows CI/CD experience...", "..."]
}
```

Error responses (`400`/`500`/`502`) always look like:
```json
{ "error": "missing_fields", "message": "Human-readable explanation." }
```

Handled failure modes:
- Missing/empty fields → `400 missing_fields`
- Oversized input (>15,000 chars/field) → `400 input_too_large`
- Missing `GEMINI_API_KEY` → `500 server_misconfigured`
- Gemini API/network failure → `502 ai_request_failed`
- Gemini returns non-JSON or malformed JSON → `502 invalid_ai_response`
  (the backend catches the parse error and returns a clean message instead
  of crashing)

---

## 5. Deploy for free

**Backend → Render**
1. Push this repo to GitHub
2. On [render.com](https://render.com): New → Web Service → connect the repo, root directory `backend`
3. Build command: `pip install -r requirements.txt`
4. Start command: `gunicorn app:app`
5. Add environment variable `GEMINI_API_KEY` with your key
6. Once deployed, copy the Render URL (e.g. `https://resume-match-backend.onrender.com`)

**Frontend → Vercel**
1. On [vercel.com](https://vercel.com): New Project → import the repo, root directory `frontend`
2. Add environment variable `NEXT_PUBLIC_API_URL` = your Render URL from above
3. Deploy

**Lock down CORS (recommended)**
Back on Render, set `ALLOWED_ORIGIN` to your Vercel URL (e.g.
`https://resume-match.vercel.app`) instead of the default `*`, then redeploy.

---

## 6. Design notes / interview talking points

- **No database, no auth** — deliberate. Each analysis is stateless and
  independent, which keeps the project focused on prompt engineering and
  clean API integration rather than general CRUD.
- **Malformed AI output** is caught explicitly: `app.py` strips markdown
  fences if Gemini adds them, extracts the first JSON object it finds, and
  returns a clean `502` instead of crashing if parsing still fails.
- **Improving match accuracy further**: the natural next step is embeddings
  / semantic search over the resume and job description to catch synonyms
  and implied skills the LLM's single pass might miss, rather than relying
  purely on the model's own judgment.
