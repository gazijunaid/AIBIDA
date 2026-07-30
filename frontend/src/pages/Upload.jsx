import { useCallback, useState } from "react";
import { UploadCloud, File as FileIcon, X, CheckCircle2 } from "lucide-react";
import api from "../api/axios";
import Topbar from "../components/Topbar";

const CATEGORIES = [
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

export default function Upload() {
  const [files, setFiles] = useState([]);
  const [category, setCategory] = useState("Other");
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const addFiles = (fileList) => {
    setFiles((prev) => [...prev, ...Array.from(fileList)]);
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  }, []);

  const removeFile = (idx) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  const handleUpload = async () => {
    if (!files.length) return;
    setUploading(true);
    setError("");
    setResult(null);
    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("files", f));
      formData.append("category", category);

      const res = await api.post("/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(res.data);
      setFiles([]);
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <Topbar title="Upload documents" subtitle="Invoices, quotations, purchase orders, contracts, reports, spreadsheets, images" />

      <div className="p-8 max-w-3xl">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`rounded-2xl border-2 border-dashed p-12 text-center transition-colors ${
            dragging ? "border-signal-teal bg-signal-teal/5" : "border-slate-300 bg-white"
          }`}
        >
          <UploadCloud size={36} className="mx-auto text-signal-teal mb-3" />
          <p className="text-sm font-medium text-ink-900">Drag & drop files here</p>
          <p className="text-xs text-slate-400 mt-1 mb-4">PDF, DOCX, XLSX, CSV, or images — up to 20 files</p>
          <label className="inline-block px-4 py-2 rounded-lg bg-ink-900 text-white text-sm font-medium cursor-pointer hover:bg-ink-800">
            Browse files
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(e) => addFiles(e.target.files)}
              accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.png,.jpg,.jpeg,.webp"
            />
          </label>
        </div>

        {files.length > 0 && (
          <div className="mt-6 bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
            {files.map((f, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <FileIcon size={16} className="text-slate-400 shrink-0" />
                  <span className="text-sm text-ink-800 truncate">{f.name}</span>
                  <span className="text-xs text-slate-400 shrink-0">{(f.size / 1024).toFixed(0)} KB</span>
                </div>
                <button onClick={() => removeFile(i)} className="text-slate-400 hover:text-signal-coral">
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-4 mt-6">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-signal-teal/50"
          >
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <button
            onClick={handleUpload}
            disabled={!files.length || uploading}
            className="px-5 py-2.5 rounded-lg bg-signal-teal text-ink-950 text-sm font-semibold hover:brightness-95 disabled:opacity-50"
          >
            {uploading ? "Uploading…" : `Upload ${files.length || ""} document(s)`}
          </button>
        </div>

        {error && <p className="text-sm text-signal-coral bg-rose-50 px-3 py-2 rounded-lg mt-4">{error}</p>}

        {result && (
          <div className="mt-6 bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-start gap-3">
            <CheckCircle2 size={18} className="text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-emerald-800">{result.message}</p>
              <p className="text-xs text-emerald-700 mt-1">
                Documents are being processed by AIBIDA's OCR and AI extraction pipeline — check the Documents
                page shortly for extracted data.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
