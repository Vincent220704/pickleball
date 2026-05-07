import { useEffect, useState, useCallback, useRef } from "react";
import API from "../services/api";

// ─── Constants ────────────────────────────────────────────────────────────────

const today = () => new Date().toISOString().split("T")[0];

const SLOT_STATUS = {
  available: { label: "Còn trống", dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", activeBg: "bg-emerald-600" },
  booked:    { label: "Đã đặt",   dot: "bg-blue-500",    text: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200",    activeBg: "bg-blue-600"    },
  blocked:   { label: "Bị chặn",  dot: "bg-rose-500",    text: "text-rose-700",    bg: "bg-rose-50",    border: "border-rose-200",    activeBg: "bg-rose-600"    },
};

const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
const pad = (n) => String(n).padStart(2, "0");
const fmtTime = (h, m) => `${pad(h)}:${pad(m)}`;

const fmtDateDisplay = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  return `${days[d.getDay()]}, ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
};

// ─── DatePickerCalendar ────────────────────────────────────────────────────────

function DatePickerCalendar({ value, onChange, min, onClose }) {
  const parsed = value ? new Date(value + "T00:00:00") : new Date();
  const [viewYear,  setViewYear]  = useState(parsed.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed.getMonth());

  const MONTH_NAMES = ["Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6","Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12"];
  const DAY_NAMES   = ["T2","T3","T4","T5","T6","T7","CN"];

  const daysInMonth     = (y, m) => new Date(y, m + 1, 0).getDate();
  const firstDayOfMonth = (y, m) => { const fd = new Date(y, m, 1).getDay(); return fd === 0 ? 6 : fd - 1; };

  const prevMonth = () => viewMonth === 0  ? (setViewMonth(11), setViewYear(y => y - 1)) : setViewMonth(m => m - 1);
  const nextMonth = () => viewMonth === 11 ? (setViewMonth(0),  setViewYear(y => y + 1)) : setViewMonth(m => m + 1);

  const mkDate    = (day) => `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`;
  const isSelected = (day) => value === mkDate(day);
  const isDisabled = (day) => !!min && mkDate(day) < min;
  const isTodayDay = (day) => today() === mkDate(day);

  const selectDay = (day) => {
    if (isDisabled(day)) return;
    onChange(mkDate(day));
    onClose();
  };

  const totalDays   = daysInMonth(viewYear, viewMonth);
  const startOffset = firstDayOfMonth(viewYear, viewMonth);

  return (
    <div
      className="bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-slate-900/15 overflow-hidden"
      style={{ width: 280 }}
      onMouseDown={(e) => e.stopPropagation()}
    >
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
          <div key={d} className={`text-center text-[10px] font-bold uppercase tracking-wide py-1 ${d === "CN" ? "text-rose-400" : "text-slate-400"}`}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-0.5 px-3 pb-3">
        {Array.from({ length: startOffset }, (_, i) => <div key={`e-${i}`} />)}
        {Array.from({ length: totalDays }, (_, i) => {
          const day = i + 1;
          const sel = isSelected(day);
          const dis = isDisabled(day);
          const tod = isTodayDay(day);
          const isSun = (startOffset + i) % 7 === 6;
          return (
            <button key={day} onClick={() => selectDay(day)} disabled={dis}
              className={`h-8 w-full flex items-center justify-center rounded-lg text-sm font-medium transition-all
                ${dis ? "text-slate-200 cursor-not-allowed" :
                  sel ? "bg-indigo-600 text-white font-bold shadow-sm" :
                  tod ? "bg-indigo-50 text-indigo-700 font-bold ring-1 ring-indigo-300" :
                  isSun ? "text-rose-500 hover:bg-rose-50" :
                  "text-slate-700 hover:bg-slate-100"}`}>
              {day}
            </button>
          );
        })}
      </div>

      <div className="px-3 pb-3">
        <button onClick={() => { onChange(today()); onClose(); }}
          className="w-full h-7 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
          Hôm nay
        </button>
      </div>
    </div>
  );
}

// ─── DatePicker — dùng fixed positioning để không bị cắt bởi overflow:hidden ─

function DatePicker({ value, onChange, min }) {
  const [open, setOpen] = useState(false);
  const [pos,  setPos]  = useState({ top: 0, left: 0 });
  const btnRef          = useRef(null);
  const calRef          = useRef(null);

  const openPicker = () => {
    if (btnRef.current) {
      const r        = btnRef.current.getBoundingClientRect();
      const calH     = 340;
      const spaceBelow = window.innerHeight - r.bottom - 8;
      const top      = spaceBelow >= calH ? r.bottom + 6 : r.top - calH - 6;
      const left     = Math.min(r.left, window.innerWidth - 288);
      setPos({ top, left });
    }
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (
        btnRef.current && !btnRef.current.contains(e.target) &&
        calRef.current  && !calRef.current.contains(e.target)
      ) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => open ? setOpen(false) : openPicker()}
        className={`flex items-center gap-2 w-full h-10 px-3 text-sm rounded-lg border transition-all bg-white
          ${open ? "border-indigo-400 ring-2 ring-indigo-500/15" : "border-slate-200 hover:border-slate-300"}`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className={open ? "text-indigo-500" : "text-slate-400"}>
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <span className={`flex-1 text-left font-medium tabular-nums
          ${open ? "text-indigo-700" : value ? "text-slate-700" : "text-slate-400"}`}>
          {value ? fmtDateDisplay(value) : "Chọn ngày..."}
        </span>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          className={`text-slate-400 transition-transform ${open ? "rotate-180 text-indigo-400" : ""}`}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div ref={calRef} style={{ position: "fixed", top: pos.top, left: pos.left, zIndex: 9999 }}>
          <DatePickerCalendar value={value} onChange={onChange} min={min} onClose={() => setOpen(false)} />
        </div>
      )}
    </>
  );
}

// ─── CourtSelect ──────────────────────────────────────────────────────────────

function CourtSelect({ courts, value, onChange, accent = "indigo" }) {
  const [open, setOpen] = useState(false);
  const ref             = useRef(null);
  const selected        = courts.find(c => String(c.id) === String(value));

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isRose  = accent === "rose";
  const active  = isRose ? "bg-rose-600"   : "bg-indigo-600";
  const hover   = isRose ? "hover:bg-rose-50 hover:text-rose-700"     : "hover:bg-indigo-50 hover:text-indigo-700";
  const border  = isRose ? "border-rose-400 ring-2 ring-rose-500/15"  : "border-indigo-400 ring-2 ring-indigo-500/15";
  const txtOpen = isRose ? "text-rose-700"  : "text-indigo-700";
  const iconOpen = isRose ? "text-rose-500" : "text-indigo-500";
  const arrowOpen = isRose ? "text-rose-400" : "text-indigo-400";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-2.5 w-full h-10 px-3 text-sm rounded-lg border transition-all bg-white
          ${open ? border : "border-slate-200 hover:border-slate-300"}`}
      >
        {/* icon */}
        <span className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors ${open ? active : "bg-slate-100"}`}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
            stroke={open ? "white" : "#64748b"} strokeWidth="2.5">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <line x1="12" y1="3" x2="12" y2="21"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
          </svg>
        </span>
        <span className={`flex-1 text-left font-semibold truncate ${open ? txtOpen : "text-slate-800"}`}>
          {selected?.name ?? "Chọn sân..."}
        </span>
        {courts.length > 1 && (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            className={`shrink-0 transition-transform ${open ? `rotate-180 ${arrowOpen}` : "text-slate-400"}`}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        )}
      </button>

      {open && courts.length > 1 && (
        <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-[300] bg-white border border-slate-200 rounded-xl shadow-xl shadow-slate-900/10 overflow-hidden py-1">
          {courts.map((c) => {
            const isSel = String(c.id) === String(value);
            return (
              <button key={c.id} type="button"
                onClick={() => { onChange(String(c.id)); setOpen(false); }}
                className={`flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-left transition-colors
                  ${isSel ? `${active} text-white font-semibold` : `text-slate-700 font-medium ${hover}`}`}
              >
                <span className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${isSel ? "bg-white/20" : "bg-slate-100"}`}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                    stroke={isSel ? "white" : "#94a3b8"} strokeWidth="2.5">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <line x1="12" y1="3" x2="12" y2="21"/>
                    <line x1="3" y1="12" x2="21" y2="12"/>
                  </svg>
                </span>
                <span className="truncate">{c.name}</span>
                {isSel && (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="ml-auto shrink-0">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── TimePicker ───────────────────────────────────────────────────────────────

function TimePicker({ value = "06:00", onChange }) {
  const [open, setOpen] = useState(false);
  const [curH, setCurH] = useState(parseInt(value.split(":")[0]) || 0);
  const [curM, setCurM] = useState(parseInt(value.split(":")[1]) || 0);
  const ref  = useRef(null);
  const hRef = useRef(null);
  const mRef = useRef(null);

  useEffect(() => {
    setCurH(parseInt(value.split(":")[0]) || 0);
    setCurM(parseInt(value.split(":")[1]) || 0);
  }, [value]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    setTimeout(() => {
      if (hRef.current) { const el = hRef.current.querySelector("[data-sel='1']"); if (el) hRef.current.scrollTop = el.offsetTop - 60; }
      if (mRef.current) { const el = mRef.current.querySelector("[data-sel='1']"); if (el) mRef.current.scrollTop = el.offsetTop - 60; }
    }, 30);
  }, [open]);

  const selectHour   = (h) => { setCurH(h); onChange(fmtTime(h, curM)); };
  const selectMinute = (m) => { setCurM(m); onChange(fmtTime(curH, m)); setOpen(false); };

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-2 w-full h-10 px-3 text-sm rounded-lg border transition-all bg-white
          ${open ? "border-indigo-400 ring-2 ring-indigo-500/15" : "border-slate-200 hover:border-slate-300"}`}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className={open ? "text-indigo-500" : "text-slate-400"}>
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
        <span className={`flex-1 text-left font-semibold tabular-nums ${open ? "text-indigo-700" : "text-slate-700"}`}>{value}</span>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          className={`text-slate-400 transition-transform ${open ? "rotate-180 text-indigo-400" : ""}`}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-[200] bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
          <div className="flex bg-slate-50/80 border-b border-slate-100">
            <div className="flex-1 py-2 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest border-r border-slate-100">Giờ</div>
            <div className="flex-1 py-2 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phút</div>
          </div>
          <div className="flex" style={{ height: 200 }}>
            <div ref={hRef} className="flex-1 overflow-y-auto border-r border-slate-100">
              {Array.from({ length: 24 }, (_, i) => (
                <div key={i} data-sel={i === curH ? "1" : undefined} onClick={() => selectHour(i)}
                  className={`py-2 text-center text-sm cursor-pointer select-none transition-colors
                    ${i === curH ? "bg-indigo-600 text-white font-bold" : "text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"}`}>
                  {pad(i)}
                </div>
              ))}
            </div>
            <div ref={mRef} className="flex-1 overflow-y-auto">
              {MINUTES.map((m) => (
                <div key={m} data-sel={m === curM ? "1" : undefined} onClick={() => selectMinute(m)}
                  className={`py-2 text-center text-sm cursor-pointer select-none transition-colors
                    ${m === curM ? "bg-indigo-600 text-white font-bold" : "text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"}`}>
                  {pad(m)}
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-center px-3 py-2 bg-slate-50 border-t border-slate-100">
            <span className="text-sm font-bold text-slate-500 tabular-nums">
              Đã chọn: <span className="text-indigo-600">{fmtTime(curH, curM)}</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Modal wrapper ────────────────────────────────────────────────────────────

function Modal({ onClose, children }) {
  const backdropRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", handler); document.body.style.overflow = ""; };
  }, [onClose]);

  return (
    <div ref={backdropRef} onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.45)", backdropFilter: "blur(4px)" }}>
      {children}
    </div>
  );
}

// ─── GenerateModal ────────────────────────────────────────────────────────────

function GenerateModal({ courts, onClose, onSuccess, feedback }) {
  const [courtId,   setCourtId]   = useState(courts[0]?.id ? String(courts[0].id) : "");
  const [rangeMode, setRangeMode] = useState(false);
  const [date,      setDate]      = useState(today());
  const [dateFrom,  setDateFrom]  = useState(today());
  const [dateTo,    setDateTo]    = useState(today());
  const [duration,  setDuration]  = useState(60);
  const [loading,   setLoading]   = useState(false);

  const dayCount = rangeMode && dateFrom <= dateTo
    ? Math.round((new Date(dateTo) - new Date(dateFrom)) / 86400000) + 1 : 1;

  const generate = async () => {
    if (!courtId) return feedback("Chọn sân trước", true);
    const from = rangeMode ? dateFrom : date;
    const to   = rangeMode ? dateTo   : date;
    if (rangeMode && from > to) return feedback("Ngày bắt đầu phải trước ngày kết thúc", true);
    setLoading(true);
    try {
      const res = await API.post("/slots/generate", { court_id: courtId, date_from: from, date_to: to, duration: Number(duration) });
      feedback(res.data.message); onSuccess(); onClose();
    } catch (err) { feedback(err.response?.data?.message || "Tạo slot thất bại", true); }
    finally { setLoading(false); }
  };

  return (
    <Modal onClose={onClose}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-visible">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 rounded-t-2xl">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Tạo slot tự động</h3>
            <p className="text-xs text-slate-400">Sinh slot theo giờ mở cửa của sân</p>
          </div>
          <button onClick={onClose} className="ml-auto w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Sân</label>
            <CourtSelect courts={courts} value={courtId} onChange={setCourtId} accent="indigo" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Chế độ</label>
            <div className="flex gap-2">
              {["1 ngày", "Khoảng ngày"].map((label, i) => (
                <button key={label} type="button" onClick={() => setRangeMode(i === 1)}
                  className={`flex-1 h-9 rounded-lg text-sm font-semibold transition-all
                    ${rangeMode === (i === 1) ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {!rangeMode ? (
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Ngày</label>
              <DatePicker value={date} onChange={setDate} />
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Từ ngày</label>
                <DatePicker value={dateFrom} onChange={setDateFrom} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Đến ngày</label>
                <DatePicker value={dateTo} onChange={setDateTo} min={dateFrom} />
              </div>
              {dateFrom <= dateTo && (
                <p className="text-sm font-semibold text-indigo-600">{dayCount} ngày được chọn</p>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Thời lượng mỗi slot</label>
            <div className="grid grid-cols-4 gap-2">
              {[30, 60, 90, 120].map((d) => (
                <button key={d} type="button" onClick={() => setDuration(d)}
                  className={`h-10 rounded-lg text-sm font-semibold transition-all
                    ${duration === d ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                  {d} phút
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 bg-slate-50 border-t border-slate-100 rounded-b-2xl">
          <button onClick={onClose} className="h-10 px-4 rounded-lg text-sm font-semibold text-slate-500 bg-white border border-slate-200 hover:bg-slate-100 transition-all">Hủy</button>
          <button onClick={generate} disabled={loading}
            className="flex items-center gap-2 h-10 px-5 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-all active:scale-[.98]">
            {loading
              ? <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>}
            {loading ? "Đang tạo..." : "Tạo slot"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── DeleteBulkModal ──────────────────────────────────────────────────────────

function DeleteBulkModal({ courts, onClose, onSuccess, feedback }) {
  const [courtId, setCourtId] = useState(courts[0]?.id ? String(courts[0].id) : "");
  const [delFrom, setDelFrom] = useState(today());
  const [delTo,   setDelTo]   = useState(today());
  const [loading, setLoading] = useState(false);

  const dayCount = delFrom <= delTo ? Math.round((new Date(delTo) - new Date(delFrom)) / 86400000) + 1 : 0;

  const deleteBulk = async () => {
    if (!courtId) return feedback("Chọn sân trước", true);
    if (delFrom > delTo) return feedback("Ngày bắt đầu phải trước ngày kết thúc", true);
    if (!window.confirm(`Xóa tất cả slot trống & bị chặn từ ${delFrom} đến ${delTo} (${dayCount} ngày)?`)) return;
    setLoading(true);
    try {
      const res = await API.delete("/slots/bulk", { data: { court_id: courtId, date_from: delFrom, date_to: delTo } });
      feedback(res.data.message); onSuccess(); onClose();
    } catch (err) { feedback(err.response?.data?.message || "Xóa thất bại", true); }
    finally { setLoading(false); }
  };

  return (
    <Modal onClose={onClose}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-visible">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-rose-50/60 rounded-t-2xl">
          <div className="w-9 h-9 rounded-xl bg-rose-600 flex items-center justify-center shrink-0">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Xóa slot hàng loạt</h3>
            <p className="text-xs text-slate-400">Chỉ xóa slot trống & bị chặn, giữ lại slot đã đặt</p>
          </div>
          <button onClick={onClose} className="ml-auto w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Sân</label>
            <CourtSelect courts={courts} value={courtId} onChange={setCourtId} accent="rose" />
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Từ ngày</label>
              <DatePicker value={delFrom} onChange={setDelFrom} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Đến ngày</label>
              <DatePicker value={delTo} onChange={setDelTo} min={delFrom} />
            </div>
          </div>

          {dayCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-rose-50 border border-rose-100 rounded-lg">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-rose-500 shrink-0">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span className="text-sm font-semibold text-rose-700">Sẽ xóa slot trong {dayCount} ngày được chọn</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 bg-slate-50 border-t border-slate-100 rounded-b-2xl">
          <button onClick={onClose} className="h-10 px-4 rounded-lg text-sm font-semibold text-slate-500 bg-white border border-slate-200 hover:bg-slate-100 transition-all">Hủy</button>
          <button onClick={deleteBulk} disabled={loading}
            className="flex items-center gap-2 h-10 px-5 rounded-lg text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 transition-all active:scale-[.98]">
            {loading
              ? <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>}
            {loading ? "Đang xóa..." : "Xóa hàng loạt"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── AddSlotModal ─────────────────────────────────────────────────────────────

function AddSlotModal({ courts, date, onClose, onSuccess, feedback }) {
  const [courtId,   setCourtId]   = useState(courts[0]?.id ? String(courts[0].id) : "");
  const [startTime, setStartTime] = useState("06:00");
  const [endTime,   setEndTime]   = useState("07:00");
  const [price,     setPrice]     = useState("");
  const [loading,   setLoading]   = useState(false);

  const create = async () => {
    if (!startTime || !endTime) return feedback("Nhập đủ giờ bắt đầu và kết thúc", true);
    if (startTime >= endTime)   return feedback("Giờ bắt đầu phải nhỏ hơn giờ kết thúc", true);
    setLoading(true);
    try {
      await API.post("/slots", { court_id: courtId, date, start_time: startTime, end_time: endTime, price: price || null });
      feedback("Tạo slot thành công"); onSuccess(); onClose();
    } catch (err) { feedback(err.response?.data?.message || "Tạo slot thất bại", true); }
    finally { setLoading(false); }
  };

  return (
    <Modal onClose={onClose}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-visible">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 rounded-t-2xl">
          <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center shrink-0">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Thêm slot thủ công</h3>
            <p className="text-xs text-slate-400">Ngày: <span className="font-semibold text-slate-600">{fmtDateDisplay(date)}</span></p>
          </div>
          <button onClick={onClose} className="ml-auto w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Sân</label>
            <CourtSelect courts={courts} value={courtId} onChange={setCourtId} accent="indigo" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Giờ bắt đầu</label>
              <TimePicker value={startTime} onChange={setStartTime} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Giờ kết thúc</label>
              <TimePicker value={endTime} onChange={setEndTime} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Giá riêng <span className="font-normal text-slate-400 normal-case">(để trống = dùng giá sân)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium select-none">₫</span>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="150000"
                className="w-full h-10 pl-7 pr-3 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-400 hover:border-slate-300 transition-all placeholder:text-slate-300" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 bg-slate-50 border-t border-slate-100 rounded-b-2xl">
          <button onClick={onClose} className="h-10 px-4 rounded-lg text-sm font-semibold text-slate-500 bg-white border border-slate-200 hover:bg-slate-100 transition-all">Hủy</button>
          <button onClick={create} disabled={loading}
            className="flex items-center gap-2 h-10 px-5 rounded-lg text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 transition-all active:scale-[.98]">
            {loading
              ? <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>}
            {loading ? "Đang tạo..." : "Thêm slot"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── SlotCard ─────────────────────────────────────────────────────────────────

function SlotCard({ slot, onToggleBlock, onDelete }) {
  const s = SLOT_STATUS[slot.status] || { label: slot.status, dot: "bg-slate-400", text: "text-slate-600", bg: "bg-slate-50", border: "border-slate-200" };
  return (
    <div className={`bg-white border-2 ${s.border} rounded-xl p-4 flex flex-col gap-3 transition-all hover:shadow-sm`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-slate-900 tabular-nums">{slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)}</span>
        <span className={`flex items-center gap-1.5 text-xs font-semibold ${s.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />{s.label}
        </span>
      </div>
      {slot.price && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-100 text-xs font-semibold text-indigo-700 self-start">
          {Number(slot.price).toLocaleString("vi-VN")}đ<span className="font-normal text-indigo-400">/giờ</span>
        </span>
      )}
      {slot.status !== "booked" ? (
        <div className="flex gap-2 pt-1 border-t border-slate-100">
          <button onClick={() => onToggleBlock(slot.id)}
            className={`flex-1 h-8 rounded-lg text-xs font-semibold transition-all
              ${slot.status === "blocked"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                : "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"}`}>
            {slot.status === "blocked" ? "Mở khóa" : "Chặn"}
          </button>
          <button onClick={() => onDelete(slot.id)}
            className="flex-1 h-8 rounded-lg text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 transition-all">
            Xóa
          </button>
        </div>
      ) : (
        <div className="pt-1 border-t border-slate-100">
          <span className="text-xs text-slate-400 font-medium">Không thể chỉnh sửa</span>
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AdminSlots() {
  const [courts,       setCourts]       = useState([]);
  const [slots,        setSlots]        = useState([]);
  const [courtId,      setCourtId]      = useState("");
  const [date,         setDate]         = useState(today());
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [success,      setSuccess]      = useState("");
  const [modal,        setModal]        = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");

  const feedback = (msg, isError = false) => {
    if (isError) { setError(msg); setSuccess(""); } else { setSuccess(msg); setError(""); }
    setTimeout(() => { setError(""); setSuccess(""); }, 4000);
  };

  const loadCourts = useCallback(async () => {
    try {
      const res = await API.get("/courts/manage");
      setCourts(res.data);
      if (res.data.length > 0) setCourtId(String(res.data[0].id));
    } catch { feedback("Không thể tải danh sách sân", true); }
  }, []);

  const loadSlots = useCallback(async () => {
    if (!courtId || !date) return;
    setLoading(true);
    try {
      const res = await API.get(`/slots?court_id=${courtId}&date=${date}`);
      setSlots(res.data);
    } catch { feedback("Không thể tải danh sách slot", true); }
    finally { setLoading(false); }
  }, [courtId, date]);

  useEffect(() => { loadCourts(); }, [loadCourts]);
  useEffect(() => { loadSlots();  }, [loadSlots]);
  useEffect(() => { setActiveFilter("all"); }, [courtId, date]);

  const toggleBlock = async (id) => {
    try { const res = await API.patch(`/slots/${id}/block`); feedback(res.data.message); loadSlots(); }
    catch (err) { feedback(err.response?.data?.message || "Thao tác thất bại", true); }
  };

  const deleteSlot = async (id) => {
    if (!window.confirm("Xóa slot này?")) return;
    try { await API.delete(`/slots/${id}`); feedback("Đã xóa slot"); loadSlots(); }
    catch (err) { feedback(err.response?.data?.message || "Xóa thất bại", true); }
  };

  const stats = {
    available: slots.filter(s => s.status === "available").length,
    booked:    slots.filter(s => s.status === "booked").length,
    blocked:   slots.filter(s => s.status === "blocked").length,
  };

  const filteredSlots = activeFilter === "all" ? slots : slots.filter(s => s.status === activeFilter);

  const FILTER_TABS = [
    { key: "all",       label: "Tất cả",    count: slots.length,    dot: "bg-slate-400",   activeBg: "bg-slate-800 text-white"   },
    { key: "available", label: "Còn trống", count: stats.available, dot: "bg-emerald-500", activeBg: "bg-emerald-600 text-white" },
    { key: "booked",    label: "Đã đặt",    count: stats.booked,    dot: "bg-blue-500",    activeBg: "bg-blue-600 text-white"    },
    { key: "blocked",   label: "Bị chặn",   count: stats.blocked,   dot: "bg-rose-500",    activeBg: "bg-rose-600 text-white"    },
  ];

  return (
    <div className="p-6 w-full">

      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Quản lý Slot</h2>
          <p className="text-sm text-slate-400 mt-0.5">Xem, tạo và quản lý khung giờ cho từng sân</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setModal("delete")}
            className="flex items-center gap-2 h-9 px-3 rounded-lg text-sm font-semibold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-all active:scale-[.98]">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            </svg>
            Xóa hàng loạt
          </button>
          <button onClick={() => setModal("generate")}
            className="flex items-center gap-2 h-9 px-3 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-all active:scale-[.98] shadow-sm">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
            Tạo slot tự động
          </button>
        </div>
      </div>

      {/* Toast */}
      {(error || success) && (
        <div className={`flex items-center gap-3 px-4 py-3 mb-4 rounded-xl text-sm font-medium border
          ${error ? "bg-rose-50 border-rose-200 text-rose-700" : "bg-emerald-50 border-emerald-200 text-emerald-700"}`}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {error
              ? <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>
              : <polyline points="20 6 9 17 4 12"/>}
          </svg>
          {error || success}
        </div>
      )}

      {/* Filter bar */}
      <div className="flex items-end gap-3 flex-wrap mb-5 p-4 bg-white border border-slate-200 rounded-xl">
        <div className="flex-1 min-w-36">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Sân</label>
          <CourtSelect courts={courts} value={courtId} onChange={setCourtId} accent="indigo" />
        </div>

        <div className="w-52">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Ngày xem</label>
          <DatePicker value={date} onChange={setDate} />
        </div>

        <button onClick={() => setModal("add")}
          className="flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all border border-slate-200 self-end">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Thêm slot
        </button>
      </div>

      {/* Status filter tabs */}
      {slots.length > 0 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {FILTER_TABS.map(({ key, label, count, dot, activeBg }) => {
            const isActive = activeFilter === key;
            return (
              <button key={key} onClick={() => setActiveFilter(key)}
                className={`flex items-center gap-2 h-8 px-3 rounded-lg text-xs font-semibold transition-all border
                  ${isActive ? `${activeBg} border-transparent shadow-sm` : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"}`}>
                {key !== "all" && (
                  <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-white/70" : dot}`} />
                )}
                {label}
                <span className={`px-1.5 rounded-md text-[10px] font-bold ${isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Slot list header */}
      <div className="flex items-center gap-3 mb-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          {activeFilter === "all" ? "Danh sách slot" : FILTER_TABS.find(t => t.key === activeFilter)?.label}
        </h3>
        {!loading && filteredSlots.length > 0 && (
          <span className="text-xs font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
            {filteredSlots.length} slot
          </span>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center gap-2 text-sm text-slate-400 py-12">
          <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
          Đang tải slot...
        </div>
      )}

      {/* Empty */}
      {!loading && slots.length === 0 && (
        <div className="flex flex-col items-center justify-center py-14 border border-dashed border-slate-200 rounded-2xl">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-400">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <p className="text-sm font-semibold text-slate-500">Chưa có slot nào</p>
          <p className="text-xs text-slate-400 mt-1 mb-4">Tạo slot tự động hoặc thêm thủ công</p>
          <button onClick={() => setModal("generate")}
            className="flex items-center gap-1.5 h-9 px-4 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-all">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
            Tạo slot tự động
          </button>
        </div>
      )}

      {/* Empty filter result */}
      {!loading && slots.length > 0 && filteredSlots.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 border border-dashed border-slate-200 rounded-2xl">
          <p className="text-sm font-semibold text-slate-400">Không có slot nào trong trạng thái này</p>
        </div>
      )}

      {/* Grid */}
      {!loading && filteredSlots.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filteredSlots.map(s => (
            <SlotCard key={s.id} slot={s} onToggleBlock={toggleBlock} onDelete={deleteSlot} />
          ))}
        </div>
      )}

      {/* Modals */}
      {modal === "generate" && <GenerateModal  courts={courts} onClose={() => setModal(null)} onSuccess={loadSlots} feedback={feedback} />}
      {modal === "delete"   && <DeleteBulkModal courts={courts} onClose={() => setModal(null)} onSuccess={loadSlots} feedback={feedback} />}
      {modal === "add"      && <AddSlotModal    courts={courts} date={date} onClose={() => setModal(null)} onSuccess={loadSlots} feedback={feedback} />}
    </div>
  );
}