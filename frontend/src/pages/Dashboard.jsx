import { useEffect, useState } from "react";
import { FileText, CheckCircle2, Clock, DollarSign, AlertTriangle } from "lucide-react";
import api from "../api/axios";
import Topbar from "../components/Topbar";
import StatusPill from "../components/StatusPill";

function KpiCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${accent}`}>
          <Icon size={16} />
        </div>
      </div>
      <p className="font-display text-2xl font-semibold text-ink-900">{value}</p>
    </div>
  );
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    api.get("/analytics/dashboard").then((res) => setSummary(res.data.summary));
    api
      .get("/ai/recommendations")
      .then((res) => setRecommendations(res.data.recommendations || []))
      .catch(() => setRecommendations([]));
  }, []);

  return (
    <div>
      <Topbar title="Dashboard" subtitle="Overview of documents, revenue, and AI activity" />

      <div className="p-8 space-y-8">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <KpiCard
            icon={FileText}
            label="Total Documents"
            value={summary?.totalDocuments ?? "—"}
            accent="bg-sky-50 text-sky-600"
          />
          <KpiCard
            icon={CheckCircle2}
            label="Processed"
            value={summary?.processed ?? "—"}
            accent="bg-emerald-50 text-emerald-600"
          />
          <KpiCard
            icon={Clock}
            label="Processing"
            value={summary?.processing ?? "—"}
            accent="bg-amber-50 text-amber-600"
          />
          <KpiCard
            icon={DollarSign}
            label="Total Revenue"
            value={summary ? `₹${Number(summary.totalRevenue).toLocaleString()}` : "—"}
            accent="bg-signal-teal/10 text-signal-teal"
          />
          <KpiCard
            icon={AlertTriangle}
            label="Pending Payments"
            value={summary ? `₹${Number(summary.pendingPayments).toLocaleString()}` : "—"}
            accent="bg-rose-50 text-rose-600"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-display font-semibold text-ink-900 mb-4">Recent uploads</h3>
            <div className="space-y-1">
              {summary?.recentUploads?.length ? (
                summary.recentUploads.map((doc) => (
                  <div
                    key={doc._id}
                    className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink-900 truncate">{doc.originalName}</p>
                      <p className="text-xs text-slate-400">{doc.category}</p>
                    </div>
                    <StatusPill status={doc.status} />
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400 py-6 text-center">No documents uploaded yet</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-display font-semibold text-ink-900 mb-4">AI recommendations</h3>
            <div className="space-y-3">
              {recommendations.length ? (
                recommendations.map((r, i) => (
                  <div key={i} className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <p className="text-xs font-semibold text-signal-teal mb-1">{r.type}</p>
                    <p className="text-sm text-ink-800">{r.message}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400 py-6 text-center">
                  No recommendations yet — upload documents to get started.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
