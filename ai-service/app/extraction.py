"""
Module 4 - AI Data Extraction Engine

Extracts structured business entities (invoice number, GST, totals,
line items, etc.) from raw OCR/text using regex patterns only.

This version works completely offline and does not require an OpenAI API key.
"""

import re

CATEGORY_KEYWORDS = {
    "Invoice": ["invoice", "bill to", "invoice no", "invoice number"],
    "Quotation": ["quotation", "quote no", "estimate"],
    "Purchase Order": ["purchase order", "po number", "po no"],
    "Contract": ["agreement", "contract", "terms and conditions", "party of the first part"],
    "Receipt": ["receipt", "paid", "cash memo"],
    "Business Card": ["mobile", "designation", "www.", "@"],
    "Report": ["executive summary", "report", "quarterly", "analysis"],
}

REGEX_PATTERNS = {
    "invoiceNumber": r"(?:invoice\s*(?:no|number|#)?\s*[:\-]?\s*)([A-Za-z0-9\-\/]+)",
    "purchaseOrderNumber": r"(?:p\.?o\.?\s*(?:no|number|#)?\s*[:\-]?\s*)([A-Za-z0-9\-\/]+)",
    "gstNumber": r"\b(\d{2}[A-Z]{5}\d{4}[A-Z]\dZ[A-Z\d])\b",
    "invoiceDate": r"(?:date\s*[:\-]?\s*)(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})",
    "totalAmount": r"(?:total\s*(?:amount)?\s*[:\-]?\s*(?:rs\.?|inr|\$|usd)?\s*)([\d,]+\.?\d*)",
    "taxAmount": r"(?:gst|tax)\s*(?:amount)?\s*[:\-]?\s*(?:rs\.?|inr|\$)?\s*([\d,]+\.?\d*)",
}

EMAIL_RE = r"[\w\.-]+@[\w\.-]+\.\w+"
PHONE_RE = r"(?:\+?\d{1,3}[-.\s]?)?\(?\d{3,5}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}"


def classify_document(text: str) -> str:
    """
    Classify the document type based on keyword matching.
    """
    lower = text.lower()

    scores = {
        category: sum(keyword in lower for keyword in keywords)
        for category, keywords in CATEGORY_KEYWORDS.items()
    }

    best_category, score = max(scores.items(), key=lambda item: item[1])

    return best_category if score > 0 else "Other"


def _clean_number(raw):
    """
    Convert a number string into a float.
    """
    if not raw:
        return None

    try:
        return float(raw.replace(",", ""))
    except (ValueError, AttributeError):
        return None


def regex_extract(text: str) -> dict:
    """
    Extract structured fields using regex.
    """
    data = {}

    for field, pattern in REGEX_PATTERNS.items():
        match = re.search(pattern, text, re.IGNORECASE)
        data[field] = match.group(1).strip() if match else None

    data["totalAmount"] = _clean_number(data.get("totalAmount"))
    data["taxAmount"] = _clean_number(data.get("taxAmount"))

    emails = re.findall(EMAIL_RE, text)
    phones = re.findall(PHONE_RE, text)

    contacts = list(dict.fromkeys(emails + phones))

    data["contactInformation"] = ", ".join(contacts) if contacts else None

    # Guess company name from first non-empty line
    lines = [line.strip() for line in text.splitlines() if line.strip()]

    data["companyName"] = lines[0][:120] if lines else None

    # Placeholder fields
    data["customerName"] = None
    data["vendorDetails"] = None
    data["products"] = []

    if "paid" in text.lower() and "unpaid" not in text.lower():
        data["paymentStatus"] = "Paid"
    elif "unpaid" in text.lower():
        data["paymentStatus"] = "Unpaid"
    else:
        data["paymentStatus"] = "Unknown"

    return data


def extract_entities(text: str) -> dict:
    """
    Main extraction function.
    Uses regex only (offline mode).
    """
    return regex_extract(text)