import os
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
LLM_MODEL = os.getenv("LLM_MODEL", "gpt-4o-mini")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
CHROMA_PERSIST_DIR = os.getenv("CHROMA_PERSIST_DIR", "storage/chroma")
CHROMA_COLLECTION = os.getenv("CHROMA_COLLECTION", "aibida_documents")
TESSERACT_CMD = os.getenv("TESSERACT_CMD", "tesseract")
