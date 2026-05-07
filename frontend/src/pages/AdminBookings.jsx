import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import API from "../services/api";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  approved:  { label: "Đã duyệt",  badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", dot: "bg-emerald-500" },
  rejected:  { label: "Từ chối",   badge: "bg-rose-50 text-rose-600 ring-1 ring-rose-200",           dot: "bg-rose-500"   },
  cancelled: { label: "Đã huỷ",    badge: "bg-slate-100 text-slate-500 ring-1 ring-slate-200",       dot: "bg-slate-400"  },
  pending:   { label: "Chờ duyệt", badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",        dot: "bg-amber-400"  },
};

const PAYMENT_CONFIG = {
  paid:     { label: "Đã thanh toán",   cls: "text-emerald-700 bg-emerald-50 ring-1 ring-emerald-200" },
  unpaid:   { label: "Chưa thanh toán", cls: "text-rose-600 bg-rose-50 ring-1 ring-rose-200"          },
  refunded: { label: "Đã hoàn tiền",    cls: "text-slate-500 bg-slate-100 ring-1 ring-slate-200"      },
};

const STATUS_FILTERS = [
  { key: "all",       label: "Tất cả"    },
  { key: "pending",   label: "Chờ duyệt" },
  { key: "approved",  label: "Đã duyệt"  },
  { key: "rejected",  label: "Từ chối"   },
  { key: "cancelled", label: "Đã huỷ"    },
];

const SORT_OPTIONS = [
  { key: "newest", label: "Mới nhất" },
  { key: "oldest", label: "Cũ nhất"  },
];

const PAGE_SIZE = 10;
const DAYS_VI   = ["CN","T2","T3","T4","T5","T6","T7"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const pad            = (n)  => String(n).padStart(2, "0");
const todayStr       = ()   => new Date().toISOString().split("T")[0];
const formatDate     = (d)  => { if (!d) return ""; const [y, m, day] = d.split("-"); return `${day}/${m}/${y}`; };
const formatTime     = (t)  => t?.slice(0, 5) || "";
const formatVND      = (n)  => Number(n || 0).toLocaleString("vi-VN") + "đ";
const getDayName     = (d)  => d ? DAYS_VI[new Date(d + "T00:00:00").getDay()] : "";
const fmtDateDisplay = (ds) => {
  if (!ds) return "";
  const d = new Date(ds + "T00:00:00");
  return `${DAYS_VI[d.getDay()]}, ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
};

// ─── useToast ─────────────────────────────────────────────────────────────────

function useToast() {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);
  return { toasts, push };
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

// ─── ConfirmModal ─────────────────────────────────────────────────────────────

function ConfirmModal({ booking, action, onConfirm, onClose }) {
  const [reason,  setReason]  = useState("");
  const [loading, setLoading] = useState(false);
  const isReject    = action === "reject";
  const textareaRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    if (isReject) setTimeout(() => textareaRef.current?.focus(), 50);
    return () => { document.removeEventListener("keydown", handler); document.body.style.overflow = ""; };
  }, [onClose, isReject]);

  const handle = async () => {
    if (isReject && !reason.trim()) return;
    setLoading(true);
    await onConfirm(booking.id, action, reason.trim());
    setLoading(false);
  };

  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.45)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className={`flex items-center gap-3 px-5 py-4 border-b border-slate-100 ${isReject ? "bg-rose-50/60" : "bg-emerald-50/60"}`}>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isReject ? "bg-rose-600" : "bg-emerald-600"}`}>
            {isReject
              ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">{isReject ? "Từ chối booking" : "Duyệt booking"}</h3>
            <p className="text-xs text-slate-400">#{String(booking.id).padStart(4,"0")} · {booking.user_name}</p>
          </div>
          <button onClick={onClose} className="ml-auto w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          <div className="flex flex-wrap gap-1.5">
            <span className="flex items-center gap-1 text-xs bg-slate-50 text-slate-600 px-2.5 py-1.5 rounded-lg border border-slate-100 font-medium">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <line x1="12" y1="3" x2="12" y2="21"/><line x1="3" y1="12" x2="21" y2="12"/>
              </svg>
              {booking.court_name}
            </span>
            <span className="text-xs bg-slate-50 text-slate-600 px-2.5 py-1.5 rounded-lg border border-slate-100 font-medium">
              {getDayName(booking.date)}, {formatDate(booking.date)}
            </span>
            <span className="text-xs bg-slate-50 text-slate-600 px-2.5 py-1.5 rounded-lg border border-slate-100 font-medium">
              {formatTime(booking.start_time)} – {formatTime(booking.end_time)}
            </span>
          </div>

          {isReject ? (
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Lý do từ chối <span className="text-rose-500 normal-case font-normal">(bắt buộc)</span>
              </label>
              <textarea ref={textareaRef} value={reason} onChange={(e) => setReason(e.target.value)}
                placeholder="VD: Sân đã được bảo trì trong ngày này..." rows={3}
                className="w-full px-3 py-2.5 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-rose-500/15 focus:border-rose-400 hover:border-slate-300 transition-all placeholder:text-slate-300" />
            </div>
          ) : (
            <p className="text-sm text-slate-600">Xác nhận duyệt booking này? Khách hàng sẽ nhận được thông báo.</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 bg-slate-50 border-t border-slate-100">
          <button onClick={onClose} className="h-9 px-4 rounded-lg text-sm font-semibold text-slate-500 bg-white border border-slate-200 hover:bg-slate-100 transition-all">
            Huỷ
          </button>
          <button onClick={handle} disabled={loading || (isReject && !reason.trim())}
            className={`flex items-center gap-2 h-9 px-5 rounded-lg text-sm font-semibold text-white disabled:opacity-50 transition-all active:scale-[.98]
              ${isReject ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"}`}>
            {loading && <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>}
            {isReject ? "Xác nhận từ chối" : "Xác nhận duyệt"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── DatePickerCalendar ────────────────────────────────────────────────────────

function DatePickerCalendar({ value, onChange, onClose }) {
  const parsed = value ? new Date(value + "T00:00:00") : new Date();
  const [viewYear,  setViewYear]  = useState(parsed.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed.getMonth());

  const MONTH_NAMES = ["Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6","Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12"];
  const DAY_NAMES   = ["T2","T3","T4","T5","T6","T7","CN"];

  const daysInMonth     = (y, m) => new Date(y, m + 1, 0).getDate();
  const firstDayOfMonth = (y, m) => { const fd = new Date(y, m, 1).getDay(); return fd === 0 ? 6 : fd - 1; };
  const prevMonth = () => viewMonth === 0  ? (setViewMonth(11), setViewYear(y => y-1)) : setViewMonth(m => m-1);
  const nextMonth = () => viewMonth === 11 ? (setViewMonth(0),  setViewYear(y => y+1)) : setViewMonth(m => m+1);
  const mkDate     = (day) => `${viewYear}-${pad(viewMonth+1)}-${pad(day)}`;

  const totalDays   = daysInMonth(viewYear, viewMonth);
  const startOffset = firstDayOfMonth(viewYear, viewMonth);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-slate-900/15 overflow-hidden"
      style={{ width: 280 }} onMouseDown={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <button onClick={prevMonth} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors text-slate-500">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span className="text-sm font-bold text-slate-800">{MONTH_NAMES[viewMonth]} {viewYear}</span>
        <button onClick={nextMonth} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors text-slate-500">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
      <div className="grid grid-cols-7 px-3 pt-2 pb-1">
        {DAY_NAMES.map(d => (
          <div key={d} className={`text-center text-[10px] font-bold uppercase tracking-wide py-1 ${d==="CN"?"text-rose-400":"text-slate-400"}`}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5 px-3 pb-3">
        {Array.from({ length: startOffset }, (_, i) => <div key={`e-${i}`} />)}
        {Array.from({ length: totalDays }, (_, i) => {
          const day   = i + 1;
          const sel   = value === mkDate(day);
          const tod   = todayStr() === mkDate(day);
          const isSun = (startOffset + i) % 7 === 6;
          return (
            <button key={day} onClick={() => { onChange(mkDate(day)); onClose(); }}
              className={`h-8 w-full flex items-center justify-center rounded-lg text-sm font-medium transition-all
                ${sel ? "bg-indigo-600 text-white font-bold shadow-sm" :
                  tod ? "bg-indigo-50 text-indigo-700 font-bold ring-1 ring-indigo-300" :
                  isSun ? "text-rose-500 hover:bg-rose-50" : "text-slate-700 hover:bg-slate-100"}`}>
              {day}
            </button>
          );
        })}
      </div>
      <div className="px-3 pb-3 flex gap-2">
        <button onClick={() => { onChange(todayStr()); onClose(); }}
          className="flex-1 h-7 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
          Hôm nay
        </button>
        {value && (
          <button onClick={() => { onChange(""); onClose(); }}
            className="h-7 px-3 rounded-lg text-xs font-semibold bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors">
            Xoá
          </button>
        )}
      </div>
    </div>
  );
}

// ─── DatePicker (fixed portal) ────────────────────────────────────────────────

function DatePicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [pos,  setPos]  = useState({ top: 0, left: 0 });
  const btnRef          = useRef(null);
  const calRef          = useRef(null);

  const openPicker = () => {
    if (btnRef.current) {
      const r          = btnRef.current.getBoundingClientRect();
      const calH       = 340;
      const spaceBelow = window.innerHeight - r.bottom - 8;
      const top        = spaceBelow >= calH ? r.bottom + 6 : r.top - calH - 6;
      setPos({ top, left: Math.min(r.left, window.innerWidth - 288) });
    }
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (btnRef.current && !btnRef.current.contains(e.target) &&
          calRef.current  && !calRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <>
      <button ref={btnRef} type="button" onClick={() => open ? setOpen(false) : openPicker()}
        className={`flex items-center gap-2 w-full h-10 px-3 text-sm rounded-lg border transition-all bg-white
          ${open ? "border-indigo-400 ring-2 ring-indigo-500/15" : "border-slate-200 hover:border-slate-300"}`}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className={open ? "text-indigo-500" : "text-slate-400"}>
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <span className={`flex-1 text-left font-medium tabular-nums ${open ? "text-indigo-700" : value ? "text-slate-700" : "text-slate-400"}`}>
          {value ? fmtDateDisplay(value) : "Tất cả ngày"}
        </span>
        {value && (
          <span role="button" onClick={(e) => { e.stopPropagation(); onChange(""); }}
            className="w-4 h-4 flex items-center justify-center rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </span>
        )}
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          className={`text-slate-400 transition-transform ${open ? "rotate-180 text-indigo-400" : ""}`}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && (
        <div ref={calRef} style={{ position: "fixed", top: pos.top, left: pos.left, zIndex: 9999 }}>
          <DatePickerCalendar value={value} onChange={onChange} onClose={() => setOpen(false)} />
        </div>
      )}
    </>
  );
}

// ─── CourtSelect ─────────────────────────────────────────────────────────────

function CourtSelect({ courts, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref             = useRef(null);
  const selected        = courts.find(c => String(c.id) === String(value));

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-2.5 w-full h-10 px-3 text-sm rounded-lg border transition-all bg-white
          ${open ? "border-indigo-400 ring-2 ring-indigo-500/15" : "border-slate-200 hover:border-slate-300"}`}>
        <span className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors ${open ? "bg-indigo-600" : "bg-slate-100"}`}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={open ? "white" : "#64748b"} strokeWidth="2.5">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <line x1="12" y1="3" x2="12" y2="21"/><line x1="3" y1="12" x2="21" y2="12"/>
          </svg>
        </span>
        <span className={`flex-1 text-left font-semibold truncate ${open ? "text-indigo-700" : "text-slate-800"}`}>
          {selected ? selected.name : "Tất cả sân"}
        </span>
        {value && (
          <span role="button" onClick={(e) => { e.stopPropagation(); onChange(""); }}
            className="w-4 h-4 flex items-center justify-center rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </span>
        )}
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          className={`shrink-0 transition-transform ${open ? "rotate-180 text-indigo-400" : "text-slate-400"}`}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-[300] bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden py-1">
          {/* Tất cả sân */}
          <button type="button" onClick={() => { onChange(""); setOpen(false); }}
            className={`flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-left transition-colors
              ${!value ? "bg-indigo-600 text-white font-semibold" : "text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 font-medium"}`}>
            <span className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${!value ? "bg-white/20" : "bg-slate-100"}`}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={!value ? "white" : "#94a3b8"} strokeWidth="2.5">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <line x1="12" y1="3" x2="12" y2="21"/><line x1="3" y1="12" x2="21" y2="12"/>
              </svg>
            </span>
            Tất cả sân
            {!value && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="ml-auto"><polyline points="20 6 9 17 4 12"/></svg>}
          </button>
          {courts.map(c => {
            const isSel = String(c.id) === String(value);
            return (
              <button key={c.id} type="button" onClick={() => { onChange(String(c.id)); setOpen(false); }}
                className={`flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-left transition-colors
                  ${isSel ? "bg-indigo-600 text-white font-semibold" : "text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 font-medium"}`}>
                <span className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${isSel ? "bg-white/20" : "bg-slate-100"}`}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={isSel ? "white" : "#94a3b8"} strokeWidth="2.5">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <line x1="12" y1="3" x2="12" y2="21"/><line x1="3" y1="12" x2="21" y2="12"/>
                  </svg>
                </span>
                <span className="truncate">{c.name}</span>
                {isSel && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="ml-auto shrink-0"><polyline points="20 6 9 17 4 12"/></svg>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── StatusBadge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const s = STATUS_CONFIG[status] || { label: status, badge: "bg-slate-100 text-slate-500 ring-1 ring-slate-200", dot: "bg-slate-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${s.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />{s.label}
    </span>
  );
}

// ─── SkeletonCard ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white border border-slate-100 rounded-xl p-5 animate-pulse">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-4 w-14 bg-slate-100 rounded-md" />
            <div className="h-4 w-28 bg-slate-100 rounded-md" />
          </div>
          <div className="h-3 w-20 bg-slate-100 rounded-md" />
        </div>
        <div className="h-6 w-20 bg-slate-100 rounded-full" />
      </div>
      <div className="flex gap-1.5 mb-3">
        <div className="h-7 w-24 bg-slate-100 rounded-lg" />
        <div className="h-7 w-20 bg-slate-100 rounded-lg" />
        <div className="h-7 w-16 bg-slate-100 rounded-lg" />
      </div>
    </div>
  );
}

// ─── Stats ────────────────────────────────────────────────────────────────────

function Stats({ bookings }) {
  const pending  = bookings.filter(b => b.status === "pending").length;
  const approved = bookings.filter(b => b.status === "approved").length;
  const revenue  = bookings
    .filter(b => b.status === "approved" && b.payment_status === "paid")
    .reduce((s, b) => s + (b.total_price || 0), 0);

  const cards = [
    { label: "Tổng booking",      value: bookings.length,                    iconBg: "bg-slate-100 text-slate-500", accent: "border-l-slate-300",
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
    { label: "Chờ duyệt",         value: pending,                            iconBg: "bg-amber-50 text-amber-500",  accent: "border-l-amber-400",
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
    { label: "Đã duyệt",          value: approved,                           iconBg: "bg-emerald-50 text-emerald-600", accent: "border-l-emerald-500",
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg> },
    { label: "Doanh thu (đã TT)", value: `${(revenue/1000000).toFixed(1)}M`, iconBg: "bg-indigo-50 text-indigo-600",  accent: "border-l-indigo-500",
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {cards.map(({ label, value, icon, iconBg, accent }) => (
        <div key={label} className={`bg-white rounded-xl border border-slate-100 border-l-4 ${accent} p-4 shadow-sm`}>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${iconBg}`}>{icon}</div>
          <div className="text-2xl font-bold text-slate-800 leading-none tabular-nums">{value}</div>
          <div className="text-xs text-slate-400 mt-1.5 font-medium">{label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({ page, total, pageSize, onChange }) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100">
      <span className="text-xs text-slate-400">
        {Math.min((page-1)*pageSize+1, total)}–{Math.min(page*pageSize, total)} / {total} booking
      </span>
      <div className="flex items-center gap-1">
        <button onClick={() => onChange(page-1)} disabled={page===1}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        {Array.from({ length: totalPages }, (_, i) => i+1).map(p => (
          <button key={p} onClick={() => onChange(p)}
            className={`w-8 h-8 text-xs rounded-lg font-semibold transition-colors
              ${p===page ? "bg-indigo-600 text-white shadow-sm" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
            {p}
          </button>
        ))}
        <button onClick={() => onChange(page+1)} disabled={page===totalPages}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
    </div>
  );
}

// ─── BookingCard ──────────────────────────────────────────────────────────────

function BookingCard({ b, onRequestAction, actionLoading }) {
  const payment   = PAYMENT_CONFIG[b.payment_status] || { label: b.payment_status, cls: "text-slate-500 bg-slate-100" };
  const isLoading = actionLoading === b.id;

  return (
    <div className={`bg-white border rounded-xl p-5 shadow-sm transition-all duration-150
      ${isLoading ? "border-slate-300 opacity-60" : "border-slate-200 hover:shadow-md hover:border-slate-300"}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-[11px] font-mono bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md shrink-0">
              #{String(b.id).padStart(4,"0")}
            </span>
            <span className="font-bold text-slate-800 text-sm truncate">{b.user_name}</span>
            {b.user_phone && (
              <span className="text-xs text-slate-400 font-medium shrink-0">{b.user_phone}</span>
            )}
            {b.slot_count > 1 && (
              <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-semibold ring-1 ring-indigo-100 shrink-0">
                {b.slot_count} slot
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400 shrink-0">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <line x1="12" y1="3" x2="12" y2="21"/><line x1="3" y1="12" x2="21" y2="12"/>
            </svg>
            <span className="font-semibold text-slate-700">{b.court_name}</span>
          </div>
        </div>
        <StatusBadge status={b.status} />
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className="flex items-center gap-1 text-xs bg-slate-50 text-slate-600 px-2.5 py-1.5 rounded-lg border border-slate-100 font-medium">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          {getDayName(b.date)}, {formatDate(b.date)}
        </span>
        <span className="flex items-center gap-1 text-xs bg-slate-50 text-slate-600 px-2.5 py-1.5 rounded-lg border border-slate-100 font-medium">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          {formatTime(b.start_time)} – {formatTime(b.end_time)}
        </span>
        <span className="flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1.5 rounded-lg border border-indigo-100 font-bold">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-400">
            <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
          {formatVND(b.total_price)}
        </span>
        <span className={`text-xs px-2.5 py-1.5 rounded-lg font-semibold ${payment.cls}`}>
          {payment.label}
        </span>
      </div>

      {b.note && (
        <p className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2 mb-3 border border-slate-100 italic">{b.note}</p>
      )}
      {b.cancel_reason && (
        <p className="text-xs text-rose-600 bg-rose-50 rounded-lg px-3 py-2 mb-3 border border-rose-100">{b.cancel_reason}</p>
      )}

      {b.status === "pending" && (
        <div className="flex gap-2 pt-3 border-t border-slate-100">
          <button onClick={() => onRequestAction(b, "approve")} disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50">
            {isLoading
              ? <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
            Duyệt
          </button>
          <button onClick={() => onRequestAction(b, "reject")} disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-rose-600 text-xs font-bold rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 transition-colors disabled:opacity-50">
            {isLoading
              ? <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>}
            Từ chối
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AdminBookings() {
  const [bookings,      setBookings]      = useState([]);
  const [courts,        setCourts]        = useState([]);
  const [date,          setDate]          = useState("");
  const [courtId,       setCourtId]       = useState("");
  const [search,        setSearch]        = useState("");
  const [sort,          setSort]          = useState("newest");
  const [loading,       setLoading]       = useState(false);
  const [filterStatus,  setFilterStatus]  = useState("all");
  const [page,          setPage]          = useState(1);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const { toasts, push: pushToast } = useToast();

  // ── Lấy danh sách sân 1 lần ──
  useEffect(() => {
    API.get("/courts/manage")
      .then(res => setCourts(res.data))
      .catch(() => {});
  }, []);

  // ── Load bookings — 1 effect duy nhất ──
  const load = useCallback(async (filterDate = "", filterCourtId = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterDate)    params.set("date",     filterDate);
      if (filterCourtId) params.set("court_id", filterCourtId);
      const url = `/bookings${params.toString() ? "?" + params.toString() : ""}`;
      const res = await API.get(url);
      setBookings(res.data);
      setPage(1);
    } catch {
      pushToast("Không thể tải dữ liệu booking", "error");
    } finally {
      setLoading(false);
    }
  }, [pushToast]);

  useEffect(() => { load(date, courtId); }, [date, courtId, load]);

  // ── document.title badge ──
  useEffect(() => {
    const pending = bookings.filter(b => b.status === "pending").length;
    document.title = pending > 0
      ? `Quản lý Booking (${pending} chờ duyệt)`
      : "Quản lý Booking";
    return () => { document.title = "Quản lý Booking"; };
  }, [bookings]);

  // ── Actions ──
  const handleRequestAction = (booking, action) => setConfirmTarget({ booking, action });

  const handleConfirmAction = async (id, action, reason) => {
    console.log("[handleConfirmAction]", { id, action, reason }); //
    setActionLoading(id);
    setConfirmTarget(null);
    try {
      await API.put(`/bookings/${action}/${id}`, { cancel_reason: reason || null });
      pushToast(action === "approve" ? "Đã duyệt booking thành công" : "Đã từ chối booking");
      await load(date, courtId);
    } catch {
      pushToast(`Không thể ${action === "approve" ? "duyệt" : "từ chối"} booking`, "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleFilterStatus = (key) => { setFilterStatus(key); setPage(1); };

  // Reset page khi search/sort thay đổi
  useEffect(() => { setPage(1); }, [search, sort]);

  // ── Pipeline: filter → search → sort → paginate ──
  const processed = useMemo(() => {
    let list = filterStatus === "all" ? bookings : bookings.filter(b => b.status === filterStatus);

    // Search theo tên khách hoặc số điện thoại
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(b =>
        b.user_name?.toLowerCase().includes(q) ||
        b.user_phone?.toLowerCase().includes(q) ||
        String(b.id).includes(q)
      );
    }

    // Sort
    list = [...list].sort((a, b) =>
      sort === "newest"
        ? new Date(b.created_at || b.date) - new Date(a.created_at || a.date)
        : new Date(a.created_at || a.date) - new Date(b.created_at || b.date)
    );

    return list;
  }, [bookings, filterStatus, search, sort]);

  const paginated    = processed.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);
  const statusCount  = (key) => key === "all" ? bookings.length : bookings.filter(b => b.status === key).length;
  const pendingCount = bookings.filter(b => b.status === "pending").length;
  const hasFilters   = date || courtId;

  return (
    <div className="p-6 w-full">

      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Quản lý Booking</h2>
            {pendingCount > 0 && (
              <span className="flex items-center gap-1 text-xs font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full">
                {pendingCount} chờ duyệt
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400 mt-0.5">Duyệt và quản lý lịch đặt sân</p>
        </div>
        {hasFilters && (
          <button onClick={() => { setDate(""); setCourtId(""); }}
            className="flex items-center gap-1.5 h-9 px-3 text-sm font-semibold text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.9"/>
            </svg>
            Xoá bộ lọc
          </button>
        )}
      </div>

      {/* Stats */}
      <Stats bookings={bookings} />

      {/* Filter bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5 p-4 bg-white border border-slate-200 rounded-xl">
        {/* Chọn sân */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Sân</label>
          <CourtSelect courts={courts} value={courtId} onChange={(v) => { setCourtId(v); setPage(1); }} />
        </div>

        {/* Chọn ngày */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Ngày</label>
          <DatePicker value={date} onChange={(v) => { setDate(v); setPage(1); }} />
        </div>

        {/* Tìm kiếm */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Tìm kiếm</label>
          <div className="relative">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tên khách, SĐT, mã..."
              className="w-full h-10 pl-9 pr-3 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-400 hover:border-slate-300 transition-all placeholder:text-slate-300"
            />
            {search && (
              <button onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Sort */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Sắp xếp</label>
          <div className="flex gap-1.5">
            {SORT_OPTIONS.map(({ key, label }) => (
              <button key={key} type="button" onClick={() => setSort(key)}
                className={`flex-1 h-10 rounded-lg text-xs font-semibold transition-all border
                  ${sort === key ? "bg-indigo-600 text-white border-transparent" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 mb-5 bg-slate-100 p-1 rounded-xl w-fit flex-wrap">
        {STATUS_FILTERS.map(({ key, label }) => {
          const isActive = filterStatus === key;
          return (
            <button key={key} onClick={() => handleFilterStatus(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                ${isActive ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              {label}
              <span className={`px-1.5 rounded-md text-[10px] font-bold
                ${isActive ? "bg-indigo-100 text-indigo-600" : "bg-slate-200 text-slate-500"}`}>
                {statusCount(key)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Skeleton loading — giữ layout ổn định khi reload sau action */}
      {loading && (
        <div className="space-y-2.5">
          {Array.from({ length: 4 }, (_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Empty */}
      {!loading && processed.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 border border-dashed border-slate-200 rounded-2xl">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-400">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          {search || hasFilters || filterStatus !== "all" ? (
            <>
              <p className="text-sm font-semibold text-slate-500">Không tìm thấy booking nào</p>
              <p className="text-xs text-slate-400 mt-1">Thử thay đổi bộ lọc hoặc từ khoá tìm kiếm</p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-slate-500">Chưa có booking nào</p>
              <p className="text-xs text-slate-400 mt-1">Booking của khách sẽ xuất hiện ở đây</p>
            </>
          )}
        </div>
      )}

      {/* Booking list */}
      {!loading && paginated.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Danh sách</span>
              <span className="text-xs font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                {processed.length} booking
              </span>
            </div>
          </div>
          <div className="space-y-2.5">
            {paginated.map(b => (
              <BookingCard key={b.id} b={b} onRequestAction={handleRequestAction} actionLoading={actionLoading} />
            ))}
          </div>
          <Pagination page={page} total={processed.length} pageSize={PAGE_SIZE} onChange={setPage} />
        </>
      )}

      {/* Confirm modal */}
      {confirmTarget && (
        <ConfirmModal
          booking={confirmTarget.booking}
          action={confirmTarget.action}
          onConfirm={handleConfirmAction}
          onClose={() => setConfirmTarget(null)}
        />
      )}

      <Toast toasts={toasts} />
    </div>
  );
}