import os
import shutil
import tempfile
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

from app.ocr import extract_text
from app.extraction import extract_entities, classify_document
from app.vectorstore import index_document
from app.rag import answer_question
from app.insights import rule_based_recommendations, narrative_summary

app = FastAPI(title="AIBIDA AI Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"success": True, "service": "AIBIDA AI service", "status": "running"}


@app.post("/api/process-document")
async def process_document(
    file: UploadFile = File(...),
    document_id: str = Form(...),
    file_type: str = Form(...),
):
    """
    Module 3 + 4 + 5 pipeline:
    OCR/text extraction -> entity extraction + classification -> chunk & embed into vector DB.
    """
    tmp_dir = tempfile.mkdtemp()
    tmp_path = os.path.join(tmp_dir, file.filename)
    try:
        with open(tmp_path, "wb") as f:
            shutil.copyfileobj(file.file, f)

        ocr_text = extract_text(tmp_path, file_type)
        category = classify_document(ocr_text)
        extracted_data = extract_entities(ocr_text)

        embedding_result = index_document(
            document_id=document_id,
            text=ocr_text,
            metadata={"original_name": file.filename, "category": category},
        )

        return {
            "ocr_text": ocr_text,
            "category": category,
            "extracted_data": extracted_data,
            "embedding": embedding_result,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)


class ChatRequest(BaseModel):
    question: str
    conversation_id: Optional[str] = None
    user_id: Optional[str] = None


@app.post("/api/chat")
def chat(req: ChatRequest):
    """Module 6 - AI Business Assistant (RAG)."""
    try:
        result = answer_question(req.question)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class StatsPayload(BaseModel):
    stats: dict


@app.post("/api/recommendations")
def recommendations(payload: StatsPayload):
    """Module 8 - AI Recommendation Engine. Backend posts current KPI stats; service returns recommendations."""
    try:
        recs = rule_based_recommendations(payload.stats)
        return {"recommendations": recs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/recommendations")
def recommendations_get():
    # Convenience GET for quick testing without a stats payload
    return {"recommendations": []}


class ReportRequest(BaseModel):
    report_type: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    stats: Optional[dict] = None


@app.post("/api/generate-report")
def generate_report(req: ReportRequest):
    """Module 9 - AI Report Generator. Produces a narrative summary; PDF rendering happens in the backend/frontend."""
    try:
        stats = req.stats or {}
        summary = narrative_summary(stats)
        return {
            "reportType": req.report_type,
            "startDate": req.start_date,
            "endDate": req.end_date,
            "summary": summary,
            "stats": stats,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=int(os.getenv("AI_SERVICE_PORT", 8000)), reload=True)
