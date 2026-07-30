const STYLES = {
  Processed: "bg-emerald-50 text-emerald-700",
  Indexed: "bg-emerald-50 text-emerald-700",
  Paid: "bg-emerald-50 text-emerald-700",
  Processing: "bg-amber-50 text-amber-700",
  Uploaded: "bg-sky-50 text-sky-700",
  Pending: "bg-amber-50 text-amber-700",
  Unpaid: "bg-rose-50 text-rose-700",
  Failed: "bg-rose-50 text-rose-700",
  "Partially Paid": "bg-amber-50 text-amber-700",
  Unknown: "bg-slate-100 text-slate-600",
};

export default function StatusPill({ status }) {
  const style = STYLES[status] || "bg-slate-100 text-slate-600";
  return <span className={`status-pill ${style}`}>{status}</span>;
}
