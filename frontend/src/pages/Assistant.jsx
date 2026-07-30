import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, FileText } from "lucide-react";
import api from "../api/axios";
import Topbar from "../components/Topbar";

const SUGGESTIONS = [
  "Show invoices generated this month",
  "Which customer has the highest outstanding payment?",
  "Summarize all purchase orders",
  "Which products generated the highest revenue?",
];

export default function Assistant() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi, I'm your AI Business Assistant. Ask me anything about your uploaded invoices, contracts, purchase orders, or reports.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text) => {
    const question = text ?? input;
    if (!question.trim() || loading) return;
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setInput("");
    setLoading(true);
    try {
      const res = await api.post("/ai/ask", { question });
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.data.answer, sources: res.data.sources },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `I couldn't reach the AI service: ${err.response?.data?.message || err.message}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <Topbar title="AI Assistant" subtitle="Ask questions about your business documents in plain language" />

      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-xl rounded-2xl px-4 py-3 text-sm ${
                m.role === "user"
                  ? "bg-ink-900 text-white rounded-br-sm"
                  : "bg-white border border-slate-200 text-ink-900 rounded-bl-sm"
              }`}
            >
              {m.role === "assistant" && (
                <div className="flex items-center gap-1.5 text-signal-teal text-xs font-semibold mb-1.5">
                  <Sparkles size={12} /> AIBIDA
                </div>
              )}
              <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
              {m.sources?.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
                  {m.sources.map((s, si) => (
                    <div key={si} className="flex items-center gap-1.5 text-xs text-slate-400">
                      <FileText size={11} />
                      {s.name || "Unknown document"}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-3 text-sm text-slate-400">
              Thinking…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {messages.length <= 1 && (
        <div className="px-8 pb-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="text-xs px-3 py-1.5 rounded-full border border-slate-200 bg-white text-slate-600 hover:border-signal-teal hover:text-signal-teal"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="px-8 pb-8">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about revenue, invoices, contracts…"
            className="flex-1 py-2 text-sm focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-9 h-9 rounded-lg bg-signal-teal text-ink-950 flex items-center justify-center hover:brightness-95 disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
