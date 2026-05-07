import { useEffect, useState, useCallback } from "react";
import API from "../services/api";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DAYS_VI  = ["CN","T2","T3","T4","T5","T6","T7"];
const formatTime = (t) => t?.slice(0, 5) || "";
const formatDate = (d) => {
  if (!d) return "";
  const date = new Date(d);
  const day = String(date.getDate()).padStart(2, "0");
  const m   = String(date.getMonth() + 1).padStart(2, "0");
  const y   = date.getFullYear();
  return `${day}/${m}/${y}`;
};
const getDayName = (d) => d ? DAYS_VI[new Date(d).getDay()] : "";

// ─── StarRating ───────────────────────────────────────────────────────────────

const STAR_LABELS = ["", "Tệ", "Không tốt", "Bình thường", "Tốt", "Tuyệt vời"];

function StarRating({ value, onChange, readonly = false, size = "lg" }) {
  const [hover, setHover] = useState(0);
  const active = hover || parseInt(value, 10) || 0;
  const sz = size === "lg" ? "text-4xl" : "text-xl";

  return (
    <div className="flex flex-col items-start gap-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) =>
          readonly ? (
            <span
              key={star}
              className={`${sz} leading-none`}
              style={{ color: star <= active ? "#fbbf24" : "#e2e8f0" }}
            >
              ★
            </span>
          ) : (
            <button
              key={star}
              type="button"
              onClick={() => onChange?.(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              className={`${sz} leading-none transition-all duration-100 cursor-pointer hover:scale-110 active:scale-95
                ${star <= active ? "text-amber-400 scale-110" : "text-slate-200 hover:text-amber-200"}`}
            >
              ★
            </button>
          )
        )}
      </div>
      {!readonly && active > 0 && (
        <span className={`text-xs font-semibold transition-all
          ${active >= 4 ? "text-emerald-600" : active === 3 ? "text-amber-600" : "text-rose-500"}`}>
          {STAR_LABELS[active]}
        </span>
      )}
    </div>
  );
}

// ─── BookingCard (chưa review) ────────────────────────────────────────────────

function PendingCard({ b, onSelect }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-slate-300 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-bold text-slate-800 text-sm truncate">{b.court_name}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <span className="flex items-center gap-1 text-xs bg-slate-50 text-slate-600 px-2.5 py-1.5 rounded-lg border border-slate-100 font-medium">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              {getDayName(b.date)}, {formatDate(b.date)}
            </span>
            <span className="flex items-center gap-1 text-xs bg-slate-50 text-slate-600 px-2.5 py-1.5 rounded-lg border border-slate-100 font-medium">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              {formatTime(b.start_time)} – {formatTime(b.end_time)}
            </span>
          </div>
        </div>
        <button
          onClick={() => onSelect(b)}
          className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition-colors shadow-sm shadow-amber-100 active:scale-95"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="0">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          Đánh giá
        </button>
      </div>
    </div>
  );
}

// ─── ReviewedCard (đã review) ─────────────────────────────────────────────────

function ReviewedCard({ b }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <span className="font-bold text-slate-700 text-sm">{b.court_name}</span>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            <span className="flex items-center gap-1 text-xs text-slate-500 px-2 py-1 rounded-lg bg-white border border-slate-100 font-medium">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              {getDayName(b.date)}, {formatDate(b.date)}
            </span>
            <span className="flex items-center gap-1 text-xs text-slate-500 px-2 py-1 rounded-lg bg-white border border-slate-100 font-medium">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              {formatTime(b.start_time)} – {formatTime(b.end_time)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StarRating value={b.rating} readonly size="sm" />
          {b.comment && (
            <button
              onClick={() => setOpen(v => !v)}
              className="text-xs text-slate-400 hover:text-slate-600 bg-white border border-slate-200 px-2 py-1 rounded-lg transition-colors"
            >
              {open ? "Ẩn" : "Xem"}
            </button>
          )}
        </div>
      </div>
      {open && b.comment && (
        <p className="mt-3 text-xs text-slate-600 bg-white border border-slate-100 rounded-lg px-3 py-2 italic">
          "{b.comment}"
        </p>
      )}
    </div>
  );
}

// ─── ReviewModal ──────────────────────────────────────────────────────────────

function ReviewModal({ booking, onClose, onSubmit, loading }) {
  const [rating,  setRating]  = useState(5);
  const [comment, setComment] = useState("");

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", handler); document.body.style.overflow = ""; };
  }, [onClose]);

  const canSubmit = rating > 0 && !loading;

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.45)", backdropFilter: "blur(4px)" }}
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-amber-50/60">
          <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="0">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-slate-900">Đánh giá sân</h3>
            <p className="text-xs text-slate-400 truncate">{booking.court_name}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Info chips */}
        <div className="px-5 pt-4 flex flex-wrap gap-1.5">
          <span className="flex items-center gap-1 text-xs bg-slate-50 text-slate-600 px-2.5 py-1.5 rounded-lg border border-slate-100 font-medium">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            {getDayName(booking.date)}, {formatDate(booking.date)}
          </span>
          <span className="flex items-center gap-1 text-xs bg-slate-50 text-slate-600 px-2.5 py-1.5 rounded-lg border border-slate-100 font-medium">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            {formatTime(booking.start_time)} – {formatTime(booking.end_time)}
          </span>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          {/* Stars */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Chất lượng sân <span className="text-rose-400 normal-case font-normal">(bắt buộc)</span>
            </label>
            <StarRating value={rating} onChange={setRating} size="lg" />
          </div>

          {/* Comment */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Nhận xét <span className="text-slate-400 normal-case font-normal">(không bắt buộc)</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Chia sẻ trải nghiệm của bạn về sân này..."
              rows={3}
              className="w-full px-3 py-2.5 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/15 focus:border-amber-400 hover:border-slate-300 transition-all placeholder:text-slate-300"
            />
            <p className="text-xs text-slate-400 mt-1 text-right">{comment.length}/500</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 bg-slate-50 border-t border-slate-100">
          <button onClick={onClose} className="h-9 px-4 rounded-lg text-sm font-semibold text-slate-500 bg-white border border-slate-200 hover:bg-slate-100 transition-all">
            Huỷ
          </button>
          <button
            onClick={() => onSubmit(rating, comment)}
            disabled={!canSubmit}
            className="flex items-center gap-2 h-9 px-5 rounded-lg text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50 transition-all active:scale-[.98]"
          >
            {loading && (
              <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
            )}
            Gửi đánh giá
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ toasts }) {
  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map(({ id, msg, type }) => (
        <div key={id}
          className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium border pointer-events-auto
            ${type === "error" ? "bg-rose-50 border-rose-200 text-rose-700" : "bg-emerald-50 border-emerald-200 text-emerald-700"}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {type === "error"
              ? <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>
              : <polyline points="20 6 9 17 4 12"/>}
          </svg>
          {msg}
        </div>
      ))}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Review() {
  const [bookings, setBookings] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [toasts,   setToasts]   = useState([]);

  const pushToast = (msg, type = "success") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };

  const loadBookings = useCallback(async () => {
    try {
      const res = await API.get("/reviews/my-bookings");
      setBookings(res.data);
    } catch {
      pushToast("Không thể tải danh sách booking", "error");
    }
  }, []);

  useEffect(() => { loadBookings(); }, [loadBookings]);

  const handleSubmit = async (rating, comment) => {
    if (!selected) return;
    setLoading(true);
    try {
      await API.post("/reviews", {
        booking_id: selected.booking_id,
        rating,
        comment: comment || undefined,
      });
      pushToast("Đánh giá thành công!");
      setSelected(null);
      loadBookings();
    } catch (err) {
      pushToast(err.response?.data?.message || "Đánh giá thất bại", "error");
    } finally {
      setLoading(false);
    }
  };

  const pending  = bookings.filter(b => !b.review_id);
  const reviewed = bookings.filter(b =>  b.review_id);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Đánh giá sân</h2>
        <p className="text-sm text-slate-400 mt-0.5">Chia sẻ trải nghiệm để giúp cộng đồng</p>
      </div>

      {/* Stats */}
      {bookings.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white rounded-xl border border-slate-100 border-l-4 border-l-amber-400 p-4 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center mb-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div className="text-2xl font-bold text-slate-800 tabular-nums">{pending.length}</div>
            <div className="text-xs text-slate-400 mt-1 font-medium">Chờ đánh giá</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 border-l-4 border-l-emerald-500 p-4 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div className="text-2xl font-bold text-slate-800 tabular-nums">{reviewed.length}</div>
            <div className="text-xs text-slate-400 mt-1 font-medium">Đã đánh giá</div>
          </div>
        </div>
      )}

      {/* Pending */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Chờ đánh giá</span>
          {pending.length > 0 && (
            <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
              {pending.length}
            </span>
          )}
        </div>

        {pending.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 border border-dashed border-slate-200 rounded-2xl">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3 text-slate-400">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </div>
            <p className="text-sm font-semibold text-slate-500">Không có booking nào cần đánh giá</p>
            <p className="text-xs text-slate-400 mt-1">Các booking đã hoàn thành sẽ xuất hiện ở đây</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {pending.map(b => (
              <PendingCard key={b.booking_id} b={b} onSelect={setSelected} />
            ))}
          </div>
        )}
      </div>

      {/* Reviewed */}
      {reviewed.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Đã đánh giá</span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              {reviewed.length}
            </span>
          </div>
          <div className="space-y-2.5">
            {reviewed.map(b => (
              <ReviewedCard key={b.booking_id} b={b} />
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {selected && (
        <ReviewModal
          booking={selected}
          onClose={() => setSelected(null)}
          onSubmit={handleSubmit}
          loading={loading}
        />
      )}

      <Toast toasts={toasts} />
    </div>
  );
}