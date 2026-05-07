import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../services/api";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  pending:   { label: "Chờ duyệt", dot: "bg-amber-400",   badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-200"       },
  approved:  { label: "Đã duyệt",  dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" },
  rejected:  { label: "Từ chối",   dot: "bg-rose-500",    badge: "bg-rose-50 text-rose-600 ring-1 ring-rose-200"          },
  cancelled: { label: "Đã huỷ",    dot: "bg-slate-400",   badge: "bg-slate-100 text-slate-500 ring-1 ring-slate-200"      },
};

const PAYMENT_CONFIG = {
  paid:     { label: "Đã thanh toán",   cls: "text-emerald-600 bg-emerald-50 ring-1 ring-emerald-200" },
  unpaid:   { label: "Chưa thanh toán", cls: "text-rose-500 bg-rose-50 ring-1 ring-rose-200"          },
  refunded: { label: "Đã hoàn tiền",    cls: "text-slate-400 bg-slate-100 ring-1 ring-slate-200"      },
};

const DAYS_VI   = ["CN","T2","T3","T4","T5","T6","T7"];
const MONTHS_VI = ["Th1","Th2","Th3","Th4","Th5","Th6","Th7","Th8","Th9","Th10","Th11","Th12"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const pad        = (n) => String(n).padStart(2, "0");
const todayStr   = ()  => new Date().toISOString().split("T")[0];
const formatVND  = (n) => Number(n || 0).toLocaleString("vi-VN") + "đ";
const formatTime = (t) => t?.slice(0, 5) || "";
const formatDate = (d) => { if (!d) return ""; const [y, m, day] = d.split("-"); return `${day}/${m}/${y}`; };
const getDayName = (d) => d ? DAYS_VI[new Date(d + "T00:00:00").getDay()] : "";

const fmtDateDisplay = (ds) => {
  if (!ds) return "";
  const d = new Date(ds + "T00:00:00");
  return `${DAYS_VI[d.getDay()]}, ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
};

// ─── DatePickerCalendar ───────────────────────────────────────────────────────

function DatePickerCalendar({ value, onChange, onClose, minDate }) {
  const parsed = value ? new Date(value + "T00:00:00") : new Date();
  const [viewYear,  setViewYear]  = useState(parsed.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed.getMonth());

  const MONTH_NAMES = ["Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6","Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12"];
  const DAY_NAMES   = ["T2","T3","T4","T5","T6","T7","CN"];

  const daysInMonth     = (y, m) => new Date(y, m + 1, 0).getDate();
  const firstDayOfMonth = (y, m) => { const fd = new Date(y, m, 1).getDay(); return fd === 0 ? 6 : fd - 1; };
  const prevMonth = () => viewMonth === 0  ? (setViewMonth(11), setViewYear(y => y-1)) : setViewMonth(m => m-1);
  const nextMonth = () => viewMonth === 11 ? (setViewMonth(0),  setViewYear(y => y+1)) : setViewMonth(m => m+1);
  const mkDate    = (day) => `${viewYear}-${pad(viewMonth+1)}-${pad(day)}`;
  const isDisabled = (day) => !!minDate && mkDate(day) < minDate;

  const totalDays   = daysInMonth(viewYear, viewMonth);
  const startOffset = firstDayOfMonth(viewYear, viewMonth);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-slate-900/15 overflow-hidden"
      style={{ width: 288 }} onMouseDown={(e) => e.stopPropagation()}>
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
          const ds    = mkDate(day);
          const sel   = value === ds;
          const dis   = isDisabled(day);
          const tod   = todayStr() === ds;
          const isSun = (startOffset + i) % 7 === 6;
          return (
            <button key={day} onClick={() => { if (!dis) { onChange(ds); onClose(); } }} disabled={dis}
              className={`h-8 w-full flex items-center justify-center rounded-lg text-sm font-medium transition-all
                ${dis ? "text-slate-200 cursor-not-allowed" :
                  sel ? "bg-indigo-600 text-white font-bold shadow-sm" :
                  tod ? "bg-indigo-50 text-indigo-700 font-bold ring-1 ring-indigo-300" :
                  isSun ? "text-rose-500 hover:bg-rose-50" : "text-slate-700 hover:bg-slate-100"}`}>
              {day}
            </button>
          );
        })}
      </div>
      <div className="px-3 pb-3">
        <button onClick={() => { onChange(todayStr()); onClose(); }}
          className="w-full h-7 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
          Hôm nay
        </button>
      </div>
    </div>
  );
}

// ─── DatePicker (fixed portal) ────────────────────────────────────────────────

function DatePicker({ value, onChange, minDate }) {
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
      setPos({ top, left: Math.min(r.left, window.innerWidth - 296) });
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
        className={`flex items-center gap-2 h-10 px-3 text-sm rounded-lg border transition-all bg-white
          ${open ? "border-indigo-400 ring-2 ring-indigo-500/15" : "border-slate-200 hover:border-slate-300"}`}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className={open ? "text-indigo-500" : "text-slate-400"}>
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <span className={`font-medium tabular-nums ${open ? "text-indigo-700" : value ? "text-slate-700" : "text-slate-400"}`}>
          {value ? fmtDateDisplay(value) : "Chọn ngày..."}
        </span>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          className={`ml-1 text-slate-400 transition-transform ${open ? "rotate-180 text-indigo-400" : ""}`}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && (
        <div ref={calRef} style={{ position: "fixed", top: pos.top, left: pos.left, zIndex: 9999 }}>
          <DatePickerCalendar value={value} onChange={onChange} onClose={() => setOpen(false)} minDate={minDate} />
        </div>
      )}
    </>
  );
}

// ─── QuickDates (7 ngày nhanh) ────────────────────────────────────────────────

function QuickDates({ value, onChange }) {
  const quickDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().split("T")[0];
  });

  return (
    <div className="grid grid-cols-7 gap-1.5">
      {quickDates.map((d, i) => {
        const date = new Date(d + "T00:00:00");
        const sel  = value === d;
        return (
          <button key={d} onClick={() => onChange(d)}
            className={`flex flex-col items-center py-2.5 rounded-xl text-xs font-medium transition-all border-2
              ${sel
                ? "border-indigo-500 bg-indigo-600 text-white shadow-md shadow-indigo-100"
                : "border-slate-100 bg-white text-slate-600 hover:border-indigo-300 hover:bg-indigo-50"}`}>
            <span className={`text-[10px] mb-1 font-semibold ${sel ? "text-indigo-200" : "text-slate-400"}`}>
              {i === 0 ? "Hôm nay" : DAYS_VI[date.getDay()]}
            </span>
            <span className="text-base font-bold leading-none">{date.getDate()}</span>
            <span className={`text-[10px] mt-1 ${sel ? "text-indigo-200" : "text-slate-400"}`}>
              {MONTHS_VI[date.getMonth()]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Booking() {
  const navigate                   = useNavigate();
  const { courtId: paramCourtId }  = useParams();

  const [court,       setCourt]       = useState(null);
  const [date,        setDate]        = useState(todayStr());
  const [note,        setNote]        = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [slots,       setSlots]       = useState([]);
  const [bookings,    setBookings]    = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [success,     setSuccess]     = useState("");
  const [tab,         setTab]         = useState("book");

  // ── Dismissed rejected bookings (localStorage) ────────────────────────────
  const [dismissedIds, setDismissedIds] = useState(
    () => JSON.parse(localStorage.getItem("dismissed_rejected") || "[]")
  );

  const unreadRejected = bookings.filter(
    b => b.status === "rejected" && !dismissedIds.includes(b.id)
  );

  const dismissRejected = () => {
    const ids = [...dismissedIds, ...unreadRejected.map(b => b.id)];
    setDismissedIds(ids);
    localStorage.setItem("dismissed_rejected", JSON.stringify(ids));
  };

  // ── Loads ─────────────────────────────────────────────────────────────────

  const loadCourt = useCallback(async () => {
    if (!paramCourtId) return;
    try {
      const res = await API.get(`/courts/${paramCourtId}`);
      setCourt(res.data);
    } catch { setError("Không thể tải thông tin sân"); }
  }, [paramCourtId]);

  const loadBookings = useCallback(async () => {
    try {
      const res = await API.get("/bookings");
      setBookings(res.data);
    } catch { setError("Không thể tải lịch sử booking"); }
  }, []);

  const loadSlots = useCallback(async (d) => {
    if (!paramCourtId || !d) return setSlots([]);
    try {
      const res = await API.get(`/slots?court_id=${paramCourtId}&date=${d}`);
      setSlots(res.data);
      setSelectedIds([]);
    } catch { setSlots([]); }
  }, [paramCourtId]);

  useEffect(() => { loadCourt(); loadBookings(); }, [loadCourt, loadBookings]);
  useEffect(() => { loadSlots(date); }, [date, loadSlots]);

  // ── Toggle slot ───────────────────────────────────────────────────────────

  const toggleSlot = (slot) => {
    if (slot.status !== "available") return;
    setSelectedIds((prev) => {
      const isSelected = prev.includes(slot.id);
      if (isSelected) {
        if (slot.id === prev[0] || slot.id === prev[prev.length - 1])
          return prev.filter(id => id !== slot.id);
        return [];
      }
      if (prev.length === 0) return [slot.id];
      const sorted = slots.filter(s => prev.includes(s.id))
        .sort((a, b) => a.start_time.localeCompare(b.start_time));
      const first = sorted[0];
      const last  = sorted[sorted.length - 1];
      if (slot.start_time.slice(0,5) === last.end_time.slice(0,5))    return [...prev, slot.id];
      if (slot.end_time.slice(0,5)   === first.start_time.slice(0,5)) return [slot.id, ...prev];
      return [slot.id];
    });
  };

  // ── Computed ──────────────────────────────────────────────────────────────

  const selectedSlots = slots
    .filter(s => selectedIds.includes(s.id))
    .sort((a, b) => a.start_time.localeCompare(b.start_time));
  const totalPrice = selectedSlots.reduce((sum, s) => sum + (s.price ?? court?.price ?? 0), 0);
  const firstSlot  = selectedSlots[0];
  const lastSlot   = selectedSlots[selectedSlots.length - 1];

  const slotStats = {
    available: slots.filter(s => s.status === "available").length,
    booked:    slots.filter(s => s.status === "booked").length,
    blocked:   slots.filter(s => s.status === "blocked").length,
  };

  // ── Actions ───────────────────────────────────────────────────────────────

  const createBooking = async () => {
    setError(""); setSuccess("");
    if (selectedIds.length === 0) return setError("Vui lòng chọn ít nhất 1 khung giờ");
    setLoading(true);
    try {
      const res = await API.post("/bookings", { slot_ids: selectedIds, note: note || undefined });
      setSuccess(res.data.message);
      setSelectedIds([]); setNote("");
      loadBookings(); loadSlots(date);
      setTab("history");
    } catch (err) {
      setError(err.response?.data?.message || "Đặt sân thất bại");
    } finally { setLoading(false); }
  };

  const cancelBooking = async (id) => {
    if (!window.confirm("Xác nhận huỷ booking này?")) return;
    try {
      await API.put(`/bookings/cancel/${id}`);
      loadBookings(); loadSlots(date);
    } catch (err) {
      setError(err.response?.data?.message || "Huỷ booking thất bại");
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">

      {/* Court info */}
      {court && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-slate-800 mb-1 truncate">{court.name}</h2>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                  {court.location}
                </span>
                <span className="flex items-center gap-1">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                  {court.open_time?.slice(0,5)} – {court.close_time?.slice(0,5)}
                </span>
                {court.surface_type && <span>{court.surface_type}</span>}
              </div>
              {court.avg_rating > 0 && (
                <div className="mt-1.5 flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="#fbbf24" stroke="#fbbf24" strokeWidth="1">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                  <span className="text-xs font-semibold text-slate-700">{court.avg_rating}</span>
                  <span className="text-xs text-slate-400">({court.review_count} đánh giá)</span>
                </div>
              )}
            </div>
            <div className="text-right shrink-0">
              <div className="text-xl font-bold text-indigo-600">{formatVND(court.price)}</div>
              <div className="text-xs text-slate-400 mb-2">/ giờ</div>
              <button onClick={() => navigate("/courts")}
                className="text-xs text-slate-500 hover:text-slate-700 border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition-colors">
                ← Đổi sân
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-5 w-fit">
        {[
          { key: "book",    label: "Đặt sân",  badge: null },
          { key: "history", label: "Lịch sử",  badge: bookings.length > 0 ? bookings.length : null },
        ].map(({ key, label, badge }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all
              ${tab === key ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            {label}
            {badge !== null && (
              <span className={`text-[10px] font-bold px-1.5 py-0 rounded-md
                ${tab === key ? "bg-indigo-100 text-indigo-600" : "bg-slate-200 text-slate-500"}`}>
                {badge}
              </span>
            )}
            {/* Chấm đỏ chỉ khi còn unread rejected */}
            {key === "history" && unreadRejected.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
            )}
          </button>
        ))}
      </div>

      {/* ══ TAB: ĐẶT SÂN ══ */}
      {tab === "book" && (
        <div className="space-y-4">

          {/* Chọn ngày */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-700">Chọn ngày</h3>
              <DatePicker value={date} onChange={setDate} minDate={todayStr()} />
            </div>
            <QuickDates value={date} onChange={setDate} />
          </div>

          {/* Chọn slot */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-700">Chọn khung giờ</h3>
                <p className="text-xs text-slate-400 mt-0.5">Chọn nhiều slot liên tiếp để ghép giờ</p>
              </div>
              {selectedIds.length > 0 && (
                <button onClick={() => setSelectedIds([])}
                  className="text-xs text-rose-500 hover:text-rose-600 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition-colors font-semibold">
                  Bỏ chọn
                </button>
              )}
            </div>

            {/* Slot stats */}
            {slots.length > 0 && (
              <div className="flex gap-2 mb-4 flex-wrap">
                {[
                  { label: "Còn trống", value: slotStats.available, cls: "text-emerald-700 bg-emerald-50 border-emerald-100" },
                  { label: "Đã đặt",    value: slotStats.booked,    cls: "text-indigo-600 bg-indigo-50 border-indigo-100"    },
                  { label: "Bị chặn",   value: slotStats.blocked,   cls: "text-slate-500 bg-slate-50 border-slate-200"       },
                ].filter(s => s.value > 0).map(({ label, value, cls }) => (
                  <span key={label} className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${cls}`}>
                    {label}: {value}
                  </span>
                ))}
              </div>
            )}

            {slots.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mb-2 text-slate-400">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                </div>
                <p className="text-sm text-slate-400 font-medium">Không có slot nào cho ngày này</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {slots.map((s) => {
                  const isSel   = selectedIds.includes(s.id);
                  const isAvail = s.status === "available";
                  const price   = s.price ?? court?.price ?? 0;

                  return (
                    <button key={s.id} disabled={!isAvail} onClick={() => toggleSlot(s)}
                      className={`p-3 rounded-xl border-2 text-left transition-all duration-150
                        ${isSel
                          ? "border-indigo-500 bg-indigo-600 text-white shadow-md shadow-indigo-100"
                          : isAvail
                          ? "border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50 text-slate-700"
                          : "border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed"}`}>
                      <div className="text-sm font-bold leading-none mb-1">{formatTime(s.start_time)}</div>
                      <div className={`text-xs ${isSel ? "text-indigo-200" : "text-slate-400"}`}>
                        – {formatTime(s.end_time)}
                      </div>
                      <div className={`text-xs font-semibold mt-1.5
                        ${isSel ? "text-indigo-100" : isAvail ? "text-indigo-600" : "text-slate-300"}`}>
                        {isAvail
                          ? formatVND(price)
                          : s.status === "booked" ? "Đã đặt" : "Chặn"}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tóm tắt + đặt sân */}
          {selectedSlots.length > 0 && (
            <div className="bg-indigo-600 rounded-xl p-5 text-white shadow-lg shadow-indigo-200">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-indigo-300 text-[10px] font-bold uppercase tracking-widest mb-1">Khung giờ đã chọn</p>
                  <p className="text-xl font-bold tabular-nums">
                    {formatTime(firstSlot.start_time)} – {formatTime(lastSlot.end_time)}
                  </p>
                  <p className="text-indigo-300 text-xs mt-0.5">
                    {selectedSlots.length} slot · {getDayName(date)}, {formatDate(date)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-indigo-300 text-[10px] font-bold uppercase tracking-widest mb-1">Tổng tiền</p>
                  <p className="text-2xl font-bold tabular-nums">{formatVND(totalPrice)}</p>
                </div>
              </div>

              <input type="text" placeholder="Ghi chú (không bắt buộc)..."
                value={note} onChange={(e) => setNote(e.target.value)}
                className="w-full bg-indigo-500 border border-indigo-400 rounded-lg px-4 py-2.5 text-sm text-white placeholder-indigo-300 focus:outline-none focus:border-white mb-4 transition-colors" />

              {error && (
                <div className="bg-rose-500/80 text-white text-xs px-3 py-2 rounded-lg mb-3 flex items-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-emerald-500/80 text-white text-xs px-3 py-2 rounded-lg mb-3 flex items-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  {success}
                </div>
              )}

              <button onClick={createBooking} disabled={loading}
                className="w-full py-3 bg-white text-indigo-600 font-bold rounded-lg hover:bg-indigo-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm shadow-sm">
                {loading ? "Đang đặt..." : `Xác nhận đặt sân (${selectedIds.length} slot)`}
              </button>
            </div>
          )}

          {/* Error khi chưa chọn slot */}
          {error && selectedSlots.length === 0 && (
            <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-600 text-sm px-4 py-3 rounded-xl">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}
        </div>
      )}

      {/* ══ TAB: LỊCH SỬ ══ */}
      {tab === "history" && (
        <div>
          {success && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3 rounded-xl mb-4">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              {success}
            </div>
          )}

          {/* Banner cảnh báo — chỉ hiện khi còn unread rejected */}
          {unreadRejected.length > 0 && (
            <div className="flex items-start gap-3 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 mb-4">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-rose-500 shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <div className="flex-1">
                <p className="text-sm font-semibold text-rose-700">
                  Bạn có {unreadRejected.length} booking bị từ chối
                </p>
                <p className="text-xs text-rose-500 mt-0.5">Xem lý do bên dưới và đặt lại nếu cần</p>
              </div>
              {/* Nút dismiss */}
              <button
                onClick={dismissRejected}
                className="w-6 h-6 flex items-center justify-center rounded-md text-rose-400 hover:text-rose-600 hover:bg-rose-100 transition-colors shrink-0"
                title="Đã đọc, không hiện lại"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          )}

          {bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-slate-200">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3 text-slate-400">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              <p className="font-semibold text-slate-600 text-sm">Bạn chưa có booking nào</p>
              <button onClick={() => setTab("book")}
                className="mt-4 px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
                Đặt sân ngay
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((b) => {
                const status  = STATUS_CONFIG[b.status]  || { label: b.status,         dot: "bg-slate-400", badge: "bg-slate-100 text-slate-500" };
                const payment = PAYMENT_CONFIG[b.payment_status] || { label: b.payment_status, cls: "text-slate-400 bg-slate-100" };
                const isRejected  = b.status === "rejected";
                const isCancelled = b.status === "cancelled";
                const isPending   = b.status === "pending";

                return (
                  <div key={b.id}
                    className={`bg-white border rounded-xl p-4 shadow-sm transition-shadow hover:shadow-md
                      ${isRejected ? "border-rose-200" : "border-slate-200"}`}>

                    {/* Top row */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-[11px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded shrink-0">
                            #{String(b.id).padStart(4,"0")}
                          </span>
                          <span className="font-bold text-slate-800 text-sm truncate">{b.court_name}</span>
                          {b.slot_count > 1 && (
                            <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-semibold ring-1 ring-indigo-100 shrink-0">
                              {b.slot_count} slot
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${status.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                        {status.label}
                      </span>
                    </div>

                    {/* Info chips */}
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
                      <span className="flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1.5 rounded-lg border border-indigo-100 font-bold tabular-nums">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-400">
                          <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                        </svg>
                        {formatVND(b.total_price)}
                      </span>
                      <span className={`text-xs px-2.5 py-1.5 rounded-lg font-semibold ${payment.cls}`}>
                        {payment.label}
                      </span>
                    </div>

                    {/* Ghi chú */}
                    {b.note && (
                      <p className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2 mb-2 border border-slate-100 italic">
                        {b.note}
                      </p>
                    )}

                    {/* Lý do từ chối / huỷ */}
                    {(isRejected || isCancelled) && b.cancel_reason && (
                      <div className={`flex items-start gap-2 rounded-lg px-3 py-2.5 mb-2 border
                        ${isRejected ? "bg-rose-50 border-rose-200" : "bg-slate-50 border-slate-200"}`}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                          className={`shrink-0 mt-0.5 ${isRejected ? "text-rose-500" : "text-slate-400"}`}>
                          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                        <div>
                          <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${isRejected ? "text-rose-500" : "text-slate-400"}`}>
                            {isRejected ? "Lý do từ chối" : "Lý do huỷ"}
                          </p>
                          <p className={`text-xs font-medium ${isRejected ? "text-rose-700" : "text-slate-600"}`}>
                            {b.cancel_reason}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    {isPending && (
                      <div className="flex gap-2 pt-3 border-t border-slate-100">
                        {b.payment_status === "unpaid" && (
                          <button onClick={() => navigate(`/payment/${b.id}`)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                              <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                            </svg>
                            Thanh toán
                          </button>
                        )}
                        <button onClick={() => cancelBooking(b.id)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-lg transition-colors">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                          Huỷ booking
                        </button>
                      </div>
                    )}

                    {/* Đặt lại nếu bị từ chối */}
                    {isRejected && (
                      <div className="pt-3 border-t border-rose-100">
                        <button onClick={() => setTab("book")}
                          className="flex items-center justify-center gap-1.5 w-full py-2 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.9"/>
                          </svg>
                          Đặt lại khung giờ khác
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}