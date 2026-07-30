import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import api from "../api/axios";
import Topbar from "../components/Topbar";

const COLORS = ["#14B8A6", "#0F172A", "#F59E0B", "#F87171", "#38BDF8", "#A78BFA", "#34D399", "#FB923C"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function Analytics() {
  const [trend, setTrend] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    api.get("/analytics/monthly-trend").then((res) =>
      setTrend(
        res.data.monthlyTrend.map((t) => ({
          label: `${MONTH_NAMES[t._id.month - 1]} ${t._id.year}`,
          revenue: t.revenue || 0,
          documents: t.documentCount,
        }))
      )
    );
    api.get("/analytics/top-customers").then((res) =>
      setTopCustomers(res.data.topCustomers.map((c) => ({ name: c._id || "Unknown", value: c.totalSpent || 0 })))
    );
    api.get("/analytics/category-breakdown").then((res) =>
      setCategories(res.data.categoryBreakdown.map((c) => ({ name: c._id, value: c.count })))
    );
  }, []);

  return (
    <div>
      <Topbar title="Analytics" subtitle="Revenue trends, top customers, and document breakdown" />

      <div className="p-8 space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-display font-semibold text-ink-900 mb-4">Monthly revenue trend</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#64748B" }} />
              <YAxis tick={{ fontSize: 12, fill: "#64748B" }} />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="#14B8A6" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-display font-semibold text-ink-900 mb-4">Top customers by spend</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topCustomers} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis type="number" tick={{ fontSize: 12, fill: "#64748B" }} />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11, fill: "#64748B" }} />
                <Tooltip />
                <Bar dataKey="value" fill="#0F172A" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-display font-semibold text-ink-900 mb-4">Documents by category</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={categories} dataKey="value" nameKey="name" outerRadius={100} label>
                  {categories.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
