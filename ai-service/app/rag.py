"""
Module 6 - AI Business Assistant (Retrieval-Augmented Generation)
Retrieves relevant document chunks via semantic search, then asks the LLM
to answer the user's business question using only that retrieved context.
"""
from app.vectorstore import semantic_search
from app.config import OPENAI_API_KEY, LLM_MODEL

SYSTEM_PROMPT = """You are AIBIDA, an AI Business Intelligence assistant. Answer the user's
question ONLY using the provided document context. Be precise, cite figures exactly as given,
and if the context does not contain the answer, say so clearly instead of guessing. Where useful,
summarize across multiple documents rather than quoting a single one verbatim."""


def build_context(hits):
    if not hits:
        return "No relevant documents were found in the knowledge base."
    parts = []
    for i, hit in enumerate(hits, start=1):
        doc_name = hit["metadata"].get("original_name", "Unknown document")
        parts.append(f"[Source {i}: {doc_name}]\n{hit['text']}")
    return "\n\n".join(parts)


def answer_question(question: str, top_k: int = 6) -> dict:
    hits = semantic_search(question, top_k=top_k)
    context = build_context(hits)

    if not OPENAI_API_KEY:
        # Deterministic fallback so the endpoint still works without an LLM key configured
        preview = context[:800]
        answer = (
            "No LLM API key is configured, so here is the most relevant retrieved context "
            f"instead of a generated answer:\n\n{preview}"
        )
    else:
        from openai import OpenAI

        client = OpenAI(api_key=OPENAI_API_KEY)
        resp = client.chat.completions.create(
            model=LLM_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {question}"},
            ],
            temperature=0.2,
        )
        answer = resp.choices[0].message.content.strip()

    sources = [
        {"documentId": h["metadata"].get("document_id"), "name": h["metadata"].get("original_name"), "score": round(h["score"], 3)}
        for h in hits
    ]
    return {"answer": answer, "sources": sources}
