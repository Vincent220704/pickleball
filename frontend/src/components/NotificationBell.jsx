import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { isLoggedIn } from "../utils/auth";

export default function NotificationBell() {
  const [count, setCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  const loadCount = useCallback(async () => {
    if (!isLoggedIn()) return;
    try {
      const res = await API.get("/notifications");
      setCount(res.data.unread);
    } catch {}
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      const res = await API.get("/notifications");
      setNotifications(res.data.notifications);
    } catch {}
  }, []);

  useEffect(() => {
    loadCount();
    const interval = setInterval(loadCount, 30000);
    return () => clearInterval(interval);
  }, [loadCount]);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleOpen = async () => {
    setOpen(!open);
    if (!open) await loadNotifications();
  };

  const markAsRead = async (id) => {
    try {
      await API.put(`/notifications/read/${id}`);

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, is_read: 1 } : n
        )
      );

      setCount((prev) => Math.max(0, prev - 1));
    } catch {}
  };

  const markAllAsRead = async () => {
    try {
      await API.put("/notifications/read-all");

      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: 1 }))
      );

      setCount(0);
    } catch {}
  };

  if (!isLoggedIn()) return null;

  return (
    <div ref={ref} className="relative">
      {/* 🔔 Bell */}
      <button
        onClick={handleOpen}
        className="relative text-xl px-2 py-1 hover:bg-gray-100 rounded-full transition"
      >
        🔔

        {count > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-[3px]">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {/* 📥 Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg z-50">
          
          {/* Header */}
          <div className="flex justify-between items-center px-4 py-3 border-b">
            <span className="font-semibold">🔔 Thông báo</span>

            {count > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-blue-500 hover:underline"
              >
                Đọc tất cả
              </button>
            )}
          </div>

          {/* List */}
          {notifications.length === 0 ? (
            <div className="p-5 text-center text-gray-500 text-sm">
              Không có thông báo nào
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => {
                  markAsRead(n.id);

                  if (n.type === "payment_success") {
                    navigate("/booking");
                  }

                  setOpen(false);
                }}
                className={`px-4 py-3 border-b cursor-pointer transition 
                  ${n.is_read ? "bg-white" : "bg-blue-50 hover:bg-blue-100"}
                `}
              >
                <div className={`text-sm ${n.is_read ? "font-normal" : "font-semibold"}`}>
                  {n.title}
                </div>

                <div className="text-xs text-gray-600 mt-1">
                  {n.message}
                </div>

                <div className="text-[11px] text-gray-400 mt-1">
                  {new Date(n.created_at).toLocaleString("vi-VN")}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}