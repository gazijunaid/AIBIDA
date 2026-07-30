import { useEffect, useState } from "react";
import { Search, X, Download, Trash2 } from "lucide-react";
import api from "../api/axios";
import Topbar from "../components/Topbar";
import StatusPill from "../components/StatusPill";

const CATEGORIES = [
  "",
  "Invoice",
  "Quotation",
  "Purchase Order",
  "Contract",
  "Report",
  "Receipt",
  "Business Card",
  "Spreadsheet",
  "Other",
];

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDocs = async () => {
    setLoading(true);
    const res = await api.get("/documents", { params: { q: q || undefined, category: category || undefined } });
    setDocuments(res.data.documents);
    setLoading(false);
  };

  useEffect(() => {
    fetchDocs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchDocs();
  };

  const handleDelete = async (id) => {
    if (!confirm("Move this document to trash?")) return;
    await api.delete(`/documents/${id}`);
    setSelected(null);
    fetchDocs();
  };

  return (
    <div>
      <Topbar title="Documents" subtitle="Search, preview, and manage business documents" />

      <div className="p-8">
        <div className="flex gap-3 mb-6">
          <form onSubmit={handleSearch} className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name or extracted content…"
              className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-signal-teal/50"
            />
          </form>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-signal-teal/50"
          >
            <option value="">All categories</option>
            {CATEGORIES.filter(Boolean).map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-5 py-3 font-medium">Name</th>
                <th className="text-left px-5 py-3 font-medium">Category</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
                <th className="text-left px-5 py-3 font-medium">Uploaded by</th>
                <th className="text-left px-5 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr
                  key={doc._id}
                  onClick={() => setSelected(doc)}
                  className="border-t border-slate-50 hover:bg-slate-50 cursor-pointer"
                >
                  <td className="px-5 py-3 font-medium text-ink-900 truncate max-w-xs">{doc.originalName}</td>
                  <td className="px-5 py-3 text-slate-600">{doc.category}</td>
                  <td className="px-5 py-3">
                    <StatusPill status={doc.status} />
                  </td>
                  <td className="px-5 py-3 text-slate-600">{doc.uploadedBy?.name || "—"}</td>
                  <td className="px-5 py-3 text-slate-400">{new Date(doc.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {!loading && documents.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-400">
                    No documents found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-ink-950/40 flex justify-end z-30" onClick={() => setSelected(null)}>
          <div
            className="w-full max-w-md bg-white h-full overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="min-w-0">
                <h3 className="font-display font-semibold text-ink-900 truncate">{selected.originalName}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <StatusPill status={selected.status} />
                  <span className="text-xs text-slate-400">{selected.category}</span>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-ink-900">
                <X size={20} />
              </button>
            </div>

            <div className="flex gap-2 mb-6">
              <a
                href={`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/documents/${selected._id}/file`}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border border-slate-200 text-sm font-medium hover:bg-slate-50"
              >
                <Download size={14} /> Download
              </a>
              <button
                onClick={() => handleDelete(selected._id)}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border border-rose-200 text-rose-600 text-sm font-medium hover:bg-rose-50"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>

            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Extracted data</h4>
            {selected.extractedData ? (
              <dl className="space-y-2 mb-6">
                {[
                  ["Company", selected.extractedData.companyName],
                  ["Customer", selected.extractedData.customerName],
                  ["Invoice #", selected.extractedData.invoiceNumber],
                  ["Invoice date", selected.extractedData.invoiceDate],
                  ["PO #", selected.extractedData.purchaseOrderNumber],
                  ["GST #", selected.extractedData.gstNumber],
                  ["Total amount", selected.extractedData.totalAmount],
                  ["Tax", selected.extractedData.taxAmount],
                  ["Payment status", selected.extractedData.paymentStatus],
                  ["Contact", selected.extractedData.contactInformation],
                ]
                  .filter(([, v]) => v !== undefined && v !== null && v !== "")
                  .map(([label, value]) => (
                    <div key={label} className="flex justify-between text-sm border-b border-slate-50 pb-2">
                      <dt className="text-slate-500">{label}</dt>
                      <dd className="text-ink-900 font-medium text-right max-w-[60%] truncate">{value}</dd>
                    </div>
                  ))}
              </dl>
            ) : (
              <p className="text-sm text-slate-400 mb-6">Not processed yet</p>
            )}

            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              OCR text preview
            </h4>
            <p className="text-xs text-slate-500 font-mono whitespace-pre-wrap bg-slate-50 rounded-lg p-3 max-h-56 overflow-y-auto">
              {selected.ocrText ? selected.ocrText.slice(0, 1200) : "No text extracted yet."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
