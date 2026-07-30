const fetch = require("node-fetch");
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

// @desc  Ask the AI Business Assistant a natural-language question (RAG over indexed documents)
// @route POST /api/ai/ask
exports.ask = async (req, res) => {
  try {
    const { question, conversationId } = req.body;
    if (!question) {
      return res.status(400).json({ success: false, message: "question is required" });
    }

    const response = await fetch(`${AI_SERVICE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        conversation_id: conversationId || null,
        user_id: req.user._id.toString(),
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`AI service error (${response.status}): ${text}`);
    }

    const data = await response.json();
    return res.json({ success: true, answer: data.answer, sources: data.sources || [] });
  } catch (err) {
    return res.status(502).json({ success: false, message: `AI service unreachable: ${err.message}` });
  }
};

// @desc  Get AI-generated recommendations (Module 8)
// @route GET /api/ai/recommendations
exports.recommendations = async (req, res) => {
  try {
    const response = await fetch(`${AI_SERVICE_URL}/api/recommendations`);
    if (!response.ok) throw new Error(`AI service responded ${response.status}`);
    const data = await response.json();
    return res.json({ success: true, recommendations: data.recommendations || [] });
  } catch (err) {
    return res.status(502).json({ success: false, message: `AI service unreachable: ${err.message}` });
  }
};

// @desc  Generate a business report (Module 9)
// @route POST /api/ai/reports
exports.generateReport = async (req, res) => {
  try {
    const { reportType, startDate, endDate } = req.body;
    const response = await fetch(`${AI_SERVICE_URL}/api/generate-report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ report_type: reportType, start_date: startDate, end_date: endDate }),
    });
    if (!response.ok) throw new Error(`AI service responded ${response.status}`);
    const data = await response.json();
    return res.json({ success: true, report: data });
  } catch (err) {
    return res.status(502).json({ success: false, message: `AI service unreachable: ${err.message}` });
  }
};
