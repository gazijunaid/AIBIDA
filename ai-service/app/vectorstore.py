"""
Module 5 - AI Knowledge Base & Vector Database
Chunks document text, generates embeddings with Sentence Transformers,
stores/retrieves them via ChromaDB, and supports semantic search +
duplicate/near-duplicate document detection.
"""
import hashlib
from typing import List, Dict

import chromadb
from sentence_transformers import SentenceTransformer

from app.config import CHROMA_PERSIST_DIR, CHROMA_COLLECTION, EMBEDDING_MODEL

_model = None
_client = None
_collection = None


def get_model():
    global _model
    if _model is None:
        _model = SentenceTransformer(EMBEDDING_MODEL)
    return _model


def get_collection():
    global _client, _collection
    if _collection is None:
        _client = chromadb.PersistentClient(path=CHROMA_PERSIST_DIR)
        _collection = _client.get_or_create_collection(
            name=CHROMA_COLLECTION, metadata={"hnsw:space": "cosine"}
        )
    return _collection


def chunk_text(text: str, chunk_size: int = 800, overlap: int = 120) -> List[str]:
    """Simple sliding-window chunker by characters (works across all doc types)."""
    text = text.strip()
    if not text:
        return []
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += chunk_size - overlap
    return chunks


def content_hash(text: str) -> str:
    return hashlib.sha256(text.strip().lower().encode("utf-8")).hexdigest()


def find_duplicate(text_hash: str) -> str | None:
    """Return the document_id of an exact-duplicate document, if any."""
    collection = get_collection()
    results = collection.get(where={"content_hash": text_hash}, limit=1)
    if results and results.get("ids"):
        metadatas = results.get("metadatas", [])
        if metadatas:
            return metadatas[0].get("document_id")
    return None


def index_document(document_id: str, text: str, metadata: Dict) -> Dict:
    """Chunk, embed, and store a document's text in the vector DB."""
    collection = get_collection()
    model = get_model()

    text_hash = content_hash(text)
    duplicate_of = find_duplicate(text_hash)

    chunks = chunk_text(text)
    if not chunks:
        return {"indexed": False, "chunk_count": 0, "is_duplicate": False, "duplicate_of": None}

    embeddings = model.encode(chunks).tolist()
    ids = [f"{document_id}_chunk_{i}" for i in range(len(chunks))]
    metadatas = [
        {**metadata, "document_id": document_id, "chunk_index": i, "content_hash": text_hash}
        for i in range(len(chunks))
    ]

    collection.add(ids=ids, embeddings=embeddings, documents=chunks, metadatas=metadatas)

    return {
        "indexed": True,
        "chunk_count": len(chunks),
        "collection": CHROMA_COLLECTION,
        "is_duplicate": duplicate_of is not None,
        "duplicate_of": duplicate_of,
    }


def semantic_search(query: str, top_k: int = 5) -> List[Dict]:
    """Retrieve the most relevant chunks for a natural-language query (used by RAG)."""
    collection = get_collection()
    model = get_model()
    query_embedding = model.encode([query]).tolist()

    results = collection.query(query_embeddings=query_embedding, n_results=top_k)

    hits = []
    docs = results.get("documents", [[]])[0]
    metas = results.get("metadatas", [[]])[0]
    distances = results.get("distances", [[]])[0]
    for doc, meta, dist in zip(docs, metas, distances):
        hits.append({"text": doc, "metadata": meta, "score": 1 - dist})
    return hits


def delete_document_vectors(document_id: str):
    collection = get_collection()
    collection.delete(where={"document_id": document_id})
