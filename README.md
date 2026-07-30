# AIBIDA — AI Business Intelligence & Decision Assistant

Reference implementation for the AI Internship Project Assignment (Softwallet Innovative
Technologies Pvt. Ltd.). Upload business documents (invoices, quotations, purchase orders,
contracts, reports, spreadsheets, images) and AIBIDA extracts structured data, indexes it into
a searchable knowledge base, and answers business questions in plain language.

## Architecture

```
frontend/     React + Tailwind + Recharts     — UI, dashboards, chat
backend/      Node.js + Express + MongoDB     — auth, document management, analytics API
ai-service/   Python + FastAPI                — OCR, entity extraction, embeddings/RAG
```

```
Browser → React frontend → Node/Express API → MongoDB Atlas
                                 │
                                 └── (multipart proxy) → Python AI service → Tesseract OCR
                                                                          → LLM entity extraction
                                                                          → Sentence Transformers
                                                                          → ChromaDB (vector store)
                                                                          → RAG chat / recommendations
```

## Module coverage

| Module | Status | Where |
|---|---|---|
| 1. Auth & RBAC | ✅ | `backend/controllers/authController.js`, JWT + email verification + OTP reset + lockout |
| 2. Document Management | ✅ | `backend/controllers/documentController.js` — upload, versioning, search, delete/restore |
| 3. OCR & Processing Engine | ✅ | `ai-service/app/ocr.py` — PDF (native + scanned), image, DOCX, XLSX, CSV |
| 4. AI Data Extraction | ✅ | `ai-service/app/extraction.py` — regex + LLM hybrid entity extraction & classification |
| 5. Knowledge Base / Vector DB | ✅ | `ai-service/app/vectorstore.py` — chunking, embeddings, ChromaDB, duplicate detection |
| 6. AI Business Assistant (RAG) | ✅ | `ai-service/app/rag.py`, frontend `Assistant.jsx` |
| 7. Business Analytics | ✅ | `backend/controllers/analyticsController.js`, frontend `Analytics.jsx` (Recharts) |
| 8. Recommendation Engine | ✅ (starter) | `ai-service/app/insights.py::rule_based_recommendations` |
| 9. Report Generator | ⚙️ starter | `ai-service/app/insights.py::narrative_summary` + `/api/generate-report` — wire to a PDF renderer (e.g. `pdfkit`/`reportlab`) to finish |
| 10. Dashboard & Notifications | ✅ | `Dashboard.jsx`, `Topbar.jsx`, `backend/models/Notification.js` |

Bonus features (multi-language OCR, voice assistant, forecasting, fraud detection, etc.) are not
implemented — the extraction/RAG modules are structured so they can be extended for those next.

## Prerequisites

- Node.js 18+
- Python 3.10+
- MongoDB Atlas connection string (or local MongoDB)
- Tesseract OCR installed on the machine running `ai-service` (`apt install tesseract-ocr` / `brew install tesseract`)
- Poppler installed for PDF-to-image conversion (`apt install poppler-utils` / `brew install poppler`)
- An OpenAI-compatible API key (optional but recommended — extraction and chat fall back to
  regex/context-only responses without one)

## Setup

### 1. AI service (Python)

```bash
cd ai-service
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm   # optional, only needed if you extend extraction.py with spaCy NER
cp .env.example .env                      # add your OPENAI_API_KEY
uvicorn app.main:app --reload --port 8000
```

### 2. Backend (Node/Express)

```bash
cd backend
npm install
cp .env.example .env    # set MONGO_URI, JWT_SECRET, AI_SERVICE_URL, SMTP_* (optional)
npm run dev              # nodemon, http://localhost:5000
```

### 3. Frontend (React)

```bash
cd frontend
npm install
cp .env.example .env    # VITE_API_URL=http://localhost:5000/api
npm run dev              # http://localhost:5173
```

Register a user from the UI (`/register`). If SMTP isn't configured, the backend logs the
verification link/OTP to the console instead of emailing it — copy it from the terminal to verify
the account during local development.

## Notes on production hardening

This is a working reference implementation, not a hardened production build. Before shipping:
- Add request validation (e.g. `zod`/`joi`) on every controller
- Move file storage to S3/Cloud Storage instead of local disk
- Add automated tests (Jest for backend, pytest for `ai-service`)
- Add PDF rendering for Module 9 reports (`reportlab` in `ai-service`, or `pdfkit` in `backend`)
- Add a proper job queue (BullMQ) instead of fire-and-forget async processing for document uploads
- Rate-limit and add request signing between `backend` and `ai-service`


