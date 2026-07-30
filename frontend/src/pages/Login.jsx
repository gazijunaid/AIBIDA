import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-canvas">
      {/* Left: brand panel */}
      <div className="hidden lg:flex w-1/2 bg-ink-900 text-white flex-col justify-between p-12 relative overflow-hidden">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-md bg-signal-teal flex items-center justify-center font-display font-bold text-ink-950">
            A
          </div>
          <span className="font-display font-semibold text-lg">AIBIDA</span>
        </div>

        <div className="relative z-10">
          <h1 className="font-display text-4xl font-semibold leading-tight mb-4">
            Documents in.
            <br />
            Decisions out.
          </h1>
          <p className="text-slate-400 max-w-sm">
            Upload invoices, contracts, and reports. AIBIDA reads them, indexes them, and
            answers your business questions in plain language.
          </p>

          <div className="flex items-center gap-3 mt-10 text-xs font-mono text-slate-500">
            <span className="px-3 py-1.5 rounded-full border border-white/10">OCR</span>
            <span className="text-slate-600">→</span>
            <span className="px-3 py-1.5 rounded-full border border-white/10">Extraction</span>
            <span className="text-slate-600">→</span>
            <span className="px-3 py-1.5 rounded-full border border-white/10">Vector Index</span>
            <span className="text-slate-600">→</span>
            <span className="px-3 py-1.5 rounded-full border border-signal-teal/40 text-signal-teal">
              Insight
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-500">Softwallet Innovative Technologies Pvt. Ltd.</p>
      </div>

      {/* Right: form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-md bg-ink-900 flex items-center justify-center font-display font-bold text-signal-teal">
              A
            </div>
            <span className="font-display font-semibold text-lg text-ink-900">AIBIDA</span>
          </div>

          <h2 className="font-display text-2xl font-semibold text-ink-900 mb-1">Welcome back</h2>
          <p className="text-sm text-slate-500 mb-8">Sign in to your business workspace.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-ink-800">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-1.5 w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-signal-teal/50 focus:border-signal-teal"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-ink-800">Password</label>
                <Link to="/forgot-password" className="text-xs text-signal-teal font-medium hover:underline">
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="mt-1.5 w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-signal-teal/50 focus:border-signal-teal"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-sm text-signal-coral bg-rose-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-ink-900 text-white text-sm font-semibold hover:bg-ink-800 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <Sparkles size={16} className="text-signal-teal" />
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="text-sm text-slate-500 mt-6 text-center">
            Don't have an account?{" "}
            <Link to="/register" className="text-signal-teal font-medium hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
