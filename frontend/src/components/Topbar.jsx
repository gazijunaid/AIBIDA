import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import api from "../api/axios";

export default function Topbar({ title, subtitle }) {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    api
      .get("/notifications")
      .then((res) => {
        setNotifications(res.data.notifications || []);
        setUnread(res.data.unreadCount || 0);
      })
      .catch(() => {});
  }, []);

  const markAllRead = async () => {
    await api.patch("/notifications/read-all").catch(() => {});
    setUnread(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <header className="flex items-center justify-between px-8 py-6 border-b border-slate-200 bg-white/60 backdrop-blur sticky top-0 z-10">
      <div>
        <h1 className="font-display text-xl font-semibold text-ink-900">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>

      <div className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          className="relative w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center hover:border-signal-teal transition-colors"
        >
          <Bell size={18} className="text-ink-700" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 bg-signal-coral text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {unread}
            </span>
          )}
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-20">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <p className="font-semibold text-sm text-ink-900">Notifications</p>
              <button onClick={markAllRead} className="text-xs text-signal-teal font-medium hover:underline">
                Mark all read
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 && (
                <p className="text-sm text-slate-400 px-4 py-6 text-center">No notifications yet</p>
              )}
              {notifications.map((n) => (
                <div key={n._id} className={`px-4 py-3 border-b border-slate-50 ${n.isRead ? "" : "bg-signal-teal/5"}`}>
                  <p className="text-sm font-medium text-ink-900">{n.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
