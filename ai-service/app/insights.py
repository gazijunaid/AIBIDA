"""
Module 8 - AI Recommendation Engine
Module 9 - AI Report Generator
Both operate over aggregated document/extraction data. In this reference implementation
the aggregation itself lives in the Node backend (MongoDB is the source of truth for
extracted business fields); this service focuses on turning that data into narrative
insights and recommendations via the LLM, with a rule-based fallback.
"""
from app.config import OPENAI_API_KEY, LLM_MODEL


def rule_based_recommendations(stats: dict) -> list:
    """stats: dict produced by the backend's analytics aggregation (see analyticsController.js)."""
    recs = []
    if stats.get("pendingPayments", 0) > 0:
        recs.append(
            {
                "type": "Pending Invoice Reminder",
                "message": f"There are {stats.get('pendingInvoiceCount', 0)} unpaid or partially paid invoices "
                f"totaling {stats.get('pendingPayments', 0)}. Consider sending payment reminders.",
                "priority": "High",
            }
        )
    if stats.get("failed", 0) > 0:
        recs.append(
            {
                "type": "Processing Failures",
                "message": f"{stats.get('failed', 0)} document(s) failed AI processing and may need manual review.",
                "priority": "Medium",
            }
        )
    if stats.get("topCustomers"):
        top = stats["topCustomers"][0]
        recs.append(
            {
                "type": "High-Value Customer",
                "message": f"{top.get('_id')} is your top customer by invoiced amount ({top.get('totalSpent')}). "
                "Consider loyalty or retention outreach.",
                "priority": "Low",
            }
        )
    return recs


def narrative_summary(stats: dict) -> str:
    """Use the LLM to turn raw KPI numbers into a short executive narrative (falls back to a templated summary)."""
    if not OPENAI_API_KEY:
        return (
            f"Total documents processed: {stats.get('processed', 0)} of {stats.get('totalDocuments', 0)}. "
            f"Recorded revenue: {stats.get('totalRevenue', 0)}. Pending payments: {stats.get('pendingPayments', 0)}."
        )
    from openai import OpenAI

    client = OpenAI(api_key=OPENAI_API_KEY)
    prompt = (
        "Write a concise 3-4 sentence executive summary of the following business metrics, "
        f"in plain business English:\n{stats}"
    )
    resp = client.chat.completions.create(
        model=LLM_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.4,
    )
    return resp.choices[0].message.content.strip()
