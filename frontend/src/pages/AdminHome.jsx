import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import API from "../services/api";
import { getUser } from "../utils/auth";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatVND  = (n) => Number(n || 0).toLocaleString("vi-VN") + "đ";
const formatM    = (n) => `${(Number(n || 0) / 1_000_000).toFixed(1)}M`;
const formatDate = (d) => { if (!d) return ""; const [y, m, day] = d.split("-"); return `${day}/${m}/${y}`; };
const formatTime = (t) => t?.slice(0, 5) || "";
const pad        = (n) => String(n).padStart(2, "0");
const todayStr   = ()  => new Date().toISOString().split("T")[0];

// ─── SVG Icons ────────────────────────────────────────────────────────────────

const Icon = {
  calendar:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  clock:      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  money:      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  users:      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  court:      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="3" x2="12" y2="21"/><line x1="3" y1="12" x2="21" y2="12"/></svg>,
  check:      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
  x:          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  refresh:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.9"/></svg>,
  trend:      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
  trophy:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 9a6 6 0 0 0 12 0"/><line x1="12" y1="15" x2="12" y2="22"/><polyline points="9 22 15 22"/></svg>,
  bar:        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  arrowRight: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  slots:      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  warning:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  calSmall:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
};

// ─── Preset tabs ──────────────────────────────────────────────────────────────

const PRESETS = [
  { key: "7d",        label: "7 ngày"     },
  { key: "30d",       label: "30 ngày"    },
  { key: "thisMonth", label: "Tháng này"  },
  { key: "custom",    label: "1 ngày"     },
];

// ─── DatePicker nhỏ (inline, dùng cho custom date) ───────────────────────────

function MiniDatePicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [viewY, setViewY] = useState(() => new Date().getFullYear());
  const [viewM, setViewM] = useState(() => new Date().getMonth());
  const ref    = useRef(null);
  const btnRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const MONTH_NAMES = ["Th1","Th2","Th3","Th4","Th5","Th6","Th7","Th8","Th9","Th10","Th11","Th12"];
  const DAY_NAMES   = ["T2","T3","T4","T5","T6","T7","CN"];

  useEffect(() => {
    if (value) {
      const d = new Date(value + "T00:00:00");
      setViewY(d.getFullYear()); setViewM(d.getMonth());
    }
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (btnRef.current && !btnRef.current.contains(e.target) &&
          ref.current    && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const openPicker = () => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      const top  = r.bottom + 6;
      const left = Math.min(r.left, window.innerWidth - 252);
      setPos({ top, left });
    }
    setOpen(true);
  };

  const daysInMonth     = (y, m) => new Date(y, m + 1, 0).getDate();
  const firstDayOfMonth = (y, m) => { const fd = new Date(y, m, 1).getDay(); return fd === 0 ? 6 : fd - 1; };
  const mkDate = (day)  => `${viewY}-${pad(viewM + 1)}-${pad(day)}`;
  const prevM  = () => viewM === 0  ? (setViewM(11), setViewY(y => y-1)) : setViewM(m => m-1);
  const nextM  = () => viewM === 11 ? (setViewM(0),  setViewY(y => y+1)) : setViewM(m => m+1);

  const totalDays   = daysInMonth(viewY, viewM);
  const startOffset = firstDayOfMonth(viewY, viewM);

  const fmtDisplay = (ds) => {
    if (!ds) return "Chọn ngày";
    const d = new Date(ds + "T00:00:00");
    const days = ["CN","T2","T3","T4","T5","T6","T7"];
    return `${days[d.getDay()]}, ${pad(d.getDate())}/${pad(d.getMonth()+1)}`;
  };

  return (
    <>
      <button ref={btnRef} type="button"
        onClick={() => open ? setOpen(false) : openPicker()}
        className={`flex items-center gap-1.5 h-8 px-2.5 text-xs rounded-lg border transition-all bg-white
          ${open ? "border-indigo-400 ring-2 ring-indigo-500/15 text-indigo-700" : "border-slate-200 hover:border-slate-300 text-slate-600"}`}>
        <span className={open ? "text-indigo-500" : "text-slate-400"}>{Icon.calSmall}</span>
        <span className="font-semibold tabular-nums">{fmtDisplay(value)}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          className={`transition-transform ${open ? "rotate-180 text-indigo-400" : "text-slate-400"}`}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div ref={ref}
          style={{ position: "fixed", top: pos.top, left: pos.left, zIndex: 9999, width: 248 }}
          className="bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden"
          onMouseDown={(e) => e.stopPropagation()}>
          {/* Nav */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-100">
            <button onClick={prevM} className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <span className="text-xs font-bold text-slate-700">{MONTH_NAMES[viewM]} {viewY}</span>
            <button onClick={nextM} className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
          {/* Day names */}
          <div className="grid grid-cols-7 px-2 pt-1.5 pb-1">
            {DAY_NAMES.map(d => (
              <div key={d} className={`text-center text-[9px] font-bold uppercase tracking-wide py-0.5 ${d==="CN"?"text-rose-400":"text-slate-400"}`}>{d}</div>
            ))}
          </div>
          {/* Days */}
          <div className="grid grid-cols-7 gap-y-0.5 px-2 pb-2.5">
            {Array.from({ length: startOffset }, (_, i) => <div key={`e-${i}`} />)}
            {Array.from({ length: totalDays }, (_, i) => {
              const day   = i + 1;
              const ds    = mkDate(day);
              const sel   = value === ds;
              const tod   = todayStr() === ds;
              const isSun = (startOffset + i) % 7 === 6;
              return (
                <button key={day} onClick={() => { onChange(ds); setOpen(false); }}
                  className={`h-7 w-full flex items-center justify-center rounded-lg text-xs font-medium transition-all
                    ${sel ? "bg-indigo-600 text-white font-bold" :
                      tod ? "bg-indigo-50 text-indigo-700 font-bold ring-1 ring-indigo-200" :
                      isSun ? "text-rose-500 hover:bg-rose-50" : "text-slate-700 hover:bg-slate-100"}`}>
                  {day}
                </button>
              );
            })}
          </div>
          {/* Today shortcut */}
          <div className="px-2 pb-2.5">
            <button onClick={() => { onChange(todayStr()); setOpen(false); }}
              className="w-full h-6 rounded-lg text-[10px] font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
              Hôm nay
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ─── RevenueChart — Recharts Area ─────────────────────────────────────────────

function RevenueChart({ data, preset, customDate, onPresetChange, onDateChange, isAdmin }) {
  const hasData = data?.length > 0 && data.some(d => Number(d.revenue) > 0);

  const chartData = (data || []).map(d => ({
    day:     d.day,
    revenue: Number(d.revenue),
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-3 py-2.5 text-xs">
        <p className="font-bold text-slate-700 mb-1">{label}</p>
        <p className="text-indigo-600 font-bold tabular-nums">{formatVND(payload[0].value)}</p>
      </div>
    );
  };

  const fmtYAxis = (v) => {
    if (v >= 1_000_000) return `${(v/1_000_000).toFixed(0)}M`;
    if (v >= 1_000)     return `${(v/1_000).toFixed(0)}k`;
    return v;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            {Icon.trend}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Doanh thu</h3>
            <p className="text-[10px] text-slate-400 font-medium">
              {isAdmin ? "Sân của tôi · " : "Toàn hệ thống · "}Đã thanh toán
            </p>
          </div>
        </div>

        {/* Filter tabs + date picker */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
            {PRESETS.map(({ key, label }) => (
              <button key={key} onClick={() => onPresetChange(key)}
                className={`h-7 px-2.5 rounded-md text-xs font-semibold transition-all
                  ${preset === key ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                {label}
              </button>
            ))}
          </div>
          {preset === "custom" && (
            <MiniDatePicker value={customDate} onChange={onDateChange} />
          )}
        </div>
      </div>

      {/* Chart */}
      {hasData ? (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}    />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 500 }}
              axisLine={false} tickLine={false}
            />
            <YAxis
              tickFormatter={fmtYAxis}
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              axisLine={false} tickLine={false} width={36}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#e2e8f0", strokeWidth: 1 }} />
            <Area
              type="monotone" dataKey="revenue"
              stroke="#6366f1" strokeWidth={2}
              fill="url(#revenueGrad)"
              dot={{ fill: "#6366f1", strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5, fill: "#6366f1", strokeWidth: 2, stroke: "#fff" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex flex-col items-center justify-center h-48 text-center">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mb-2 text-slate-400">
            {Icon.bar}
          </div>
          <p className="text-sm font-semibold text-slate-400">Chưa có dữ liệu</p>
          <p className="text-xs text-slate-300 mt-0.5">Chưa có booking đã thanh toán trong khoảng này</p>
        </div>
      )}

      {/* Summary dưới chart */}
      {hasData && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-400">Tổng kỳ này</span>
          <span className="text-sm font-bold text-indigo-600 tabular-nums">
            {formatVND(chartData.reduce((s, d) => s + d.revenue, 0))}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, accent, iconBg }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-100 border-l-4 ${accent} p-4 shadow-sm`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${iconBg}`}>{icon}</div>
      <div className="text-2xl font-bold text-slate-800 leading-none tabular-nums">{value}</div>
      {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
      <div className="text-xs text-slate-500 mt-2 font-medium">{label}</div>
    </div>
  );
}

// ─── PendingItem ──────────────────────────────────────────────────────────────

function PendingItem({ b, onApprove, onReject }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-slate-50 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <span className="text-[11px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded shrink-0">
            #{String(b.id).padStart(4,"0")}
          </span>
          <span className="font-semibold text-slate-800 text-sm truncate">{b.user_name}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 flex-wrap">
          <span className="flex items-center gap-1 text-slate-500 font-medium shrink-0">
            <span className="text-slate-400">{Icon.court}</span>
            {b.court_name}
          </span>
          <span className="text-slate-200">·</span>
          <span>{formatDate(b.date)}</span>
          <span className="text-slate-200">·</span>
          <span>{formatTime(b.start_time)}–{formatTime(b.end_time)}</span>
        </div>
        <div className="text-xs font-bold text-indigo-600 mt-0.5 tabular-nums">{formatVND(b.total_price)}</div>
      </div>
      <div className="flex gap-1.5 shrink-0">
        <button onClick={() => onApprove(b.id)}
          className="flex items-center justify-center w-8 h-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-sm">
          {Icon.check}
        </button>
        <button onClick={() => onReject(b.id)}
          className="flex items-center justify-center w-8 h-8 border-2 border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors">
          {Icon.x}
        </button>
      </div>
    </div>
  );
}

// ─── SkeletonStats ────────────────────────────────────────────────────────────

function SkeletonStats() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-100 p-4 animate-pulse">
            <div className="w-9 h-9 rounded-xl bg-slate-100 mb-3" />
            <div className="h-7 w-16 bg-slate-100 rounded mb-2" />
            <div className="h-3 w-24 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 p-5 animate-pulse h-64" />
        <div className="bg-white rounded-xl border border-slate-100 p-5 animate-pulse h-64" />
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 👑 SUPER ADMIN DASHBOARD
// ════════════════════════════════════════════════════════════════

function SuperAdminDashboard({ stats, preset, customDate, onPresetChange, onDateChange, onApprove, onReject, navigate }) {
  const { summary, revenueByDay, topCourts, bookingsByStatus, pendingList } = stats;

  const STATUS_LABEL = { approved: "Đã duyệt", pending: "Chờ duyệt", rejected: "Từ chối", cancelled: "Đã huỷ" };
  const STATUS_DOT   = { approved: "bg-emerald-500", pending: "bg-amber-400", rejected: "bg-rose-500", cancelled: "bg-slate-400" };
  const STATUS_TEXT  = { approved: "text-emerald-700", pending: "text-amber-700", rejected: "text-rose-600", cancelled: "text-slate-500" };

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={<span className="text-slate-500">{Icon.calendar}</span>}  label="Tổng booking"      value={summary.totalBookings}          accent="border-l-slate-300"   iconBg="bg-slate-100"   />
        <StatCard icon={<span className="text-amber-500">{Icon.clock}</span>}     label="Chờ duyệt"         value={summary.pendingBookings}        accent="border-l-amber-400"   iconBg="bg-amber-50"    sub="Cần xử lý ngay" />
        <StatCard icon={<span className="text-indigo-600">{Icon.money}</span>}    label="Doanh thu tháng"   value={formatM(summary.monthRevenue)}  accent="border-l-indigo-500"  iconBg="bg-indigo-50"   sub={`Tổng: ${formatM(summary.totalRevenue)}`} />
        <StatCard icon={<span className="text-violet-600">{Icon.users}</span>}    label="Người dùng"        value={summary.totalUsers}             accent="border-l-violet-500"  iconBg="bg-violet-50"   sub={`${summary.totalAdmins} admin · ${summary.totalCourts} sân`} />
      </div>

      {/* Chart + right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <RevenueChart
            data={revenueByDay} preset={preset} customDate={customDate}
            onPresetChange={onPresetChange} onDateChange={onDateChange}
            isAdmin={false}
          />
        </div>

        <div className="space-y-4">
          {/* Booking by status */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">{Icon.bar}</div>
              <h3 className="text-sm font-bold text-slate-700">Theo trạng thái</h3>
            </div>
            <div className="space-y-2.5">
              {(bookingsByStatus || []).map(s => (
                <div key={s.status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[s.status] || "bg-slate-400"}`} />
                    <span className="text-xs text-slate-600">{STATUS_LABEL[s.status] || s.status}</span>
                  </div>
                  <span className={`text-xs font-bold tabular-nums ${STATUS_TEXT[s.status] || "text-slate-700"}`}>{s.total}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top courts */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500">{Icon.trophy}</div>
              <h3 className="text-sm font-bold text-slate-700">Top sân booking</h3>
            </div>
            <div className="space-y-2.5">
              {(topCourts || []).map((c, i) => (
                <div key={i} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0
                      ${i===0?"bg-amber-100 text-amber-700":i===1?"bg-slate-200 text-slate-600":"bg-slate-100 text-slate-500"}`}>
                      {i+1}
                    </span>
                    <span className="text-xs text-slate-700 truncate">{c.name}</span>
                  </div>
                  <span className="text-xs font-bold text-indigo-600 tabular-nums shrink-0">{c.total_bookings} lượt</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Pending */}
      {pendingList?.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500">{Icon.clock}</div>
              <h3 className="text-sm font-bold text-slate-700">Booking chờ duyệt</h3>
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">{summary.pendingBookings}</span>
            </div>
            <button onClick={() => navigate("/admin/bookings")}
              className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-semibold transition-colors">
              Xem tất cả {Icon.arrowRight}
            </button>
          </div>
          {pendingList.map(b => <PendingItem key={b.id} b={b} onApprove={onApprove} onReject={onReject} />)}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 🛠 ADMIN DASHBOARD
// ════════════════════════════════════════════════════════════════

function AdminDashboard({ stats, preset, customDate, onPresetChange, onDateChange, onApprove, onReject, navigate }) {
  const { summary, revenueByDay, todaySlots, pendingList } = stats;

  const slotRows = [
    { label: "Tổng slot",  value: todaySlots?.total,     cls: "text-slate-700"   },
    { label: "Còn trống",  value: todaySlots?.available, cls: "text-emerald-600" },
    { label: "Đã đặt",     value: todaySlots?.booked,    cls: "text-indigo-600"  },
    { label: "Bị chặn",    value: todaySlots?.blocked,   cls: "text-rose-500"    },
  ];

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={<span className="text-slate-500">{Icon.calendar}</span>}  label="Tổng booking"      value={summary.totalBookings}          accent="border-l-slate-300"   iconBg="bg-slate-100"   />
        <StatCard icon={<span className="text-amber-500">{Icon.clock}</span>}     label="Chờ duyệt"         value={summary.pendingBookings}        accent="border-l-amber-400"   iconBg="bg-amber-50"    sub="Cần xử lý ngay" />
        <StatCard icon={<span className="text-indigo-600">{Icon.money}</span>}    label="Doanh thu tháng"   value={formatM(summary.monthRevenue)}  accent="border-l-indigo-500"  iconBg="bg-indigo-50"   sub={`Tổng: ${formatM(summary.totalRevenue)}`} />
        <StatCard icon={<span className="text-emerald-600">{Icon.court}</span>}   label="Sân của tôi"       value={summary.totalCourts}            accent="border-l-emerald-500" iconBg="bg-emerald-50"  sub="đang hoạt động" />
      </div>

      {/* Chart + today slots */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <RevenueChart
            data={revenueByDay} preset={preset} customDate={customDate}
            onPresetChange={onPresetChange} onDateChange={onDateChange}
            isAdmin={true}
          />
        </div>

        {/* Today slots */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">{Icon.slots}</div>
            <h3 className="text-sm font-bold text-slate-700">Slot hôm nay</h3>
          </div>
          {todaySlots ? (
            <>
              <div className="space-y-1">
                {slotRows.map(({ label, value, cls }) => (
                  <div key={label} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                    <span className="text-xs text-slate-500">{label}</span>
                    <span className={`text-lg font-bold ${cls} tabular-nums`}>{value ?? 0}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => navigate("/admin/slots")}
                className="flex items-center justify-center gap-1.5 w-full mt-3 py-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">
                Quản lý slot {Icon.arrowRight}
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mb-2 text-slate-400">{Icon.slots}</div>
              <p className="text-xs text-slate-400">Chưa có slot hôm nay</p>
              <button onClick={() => navigate("/admin/slots")}
                className="mt-2 text-xs font-semibold text-indigo-600 hover:underline">
                Tạo slot ngay
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Pending */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500">{Icon.clock}</div>
            <h3 className="text-sm font-bold text-slate-700">Cần duyệt ngay</h3>
            {summary.pendingBookings > 0 && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">{summary.pendingBookings}</span>
            )}
          </div>
          <button onClick={() => navigate("/admin/bookings")}
            className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-semibold transition-colors">
            Xem tất cả {Icon.arrowRight}
          </button>
        </div>

        {!pendingList?.length ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-500">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <p className="text-sm font-semibold text-slate-500">Tất cả đã được xử lý</p>
            <p className="text-xs text-slate-400 mt-0.5">Không có booking nào đang chờ duyệt</p>
          </div>
        ) : (
          pendingList.map(b => <PendingItem key={b.id} b={b} onApprove={onApprove} onReject={onReject} />)
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════════

export default function AdminHome() {
  const [stats,      setStats]      = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [preset,     setPreset]     = useState("7d");
  const [customDate, setCustomDate] = useState(todayStr());

  const user     = getUser();
  const navigate = useNavigate();

  const loadStats = useCallback(async (p = "7d", date = todayStr()) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ preset: p });
      if (p === "custom" && date) params.set("from", date);
      const res = await API.get(`/stats/dashboard?${params.toString()}`);
      if (!res.data?.role) throw new Error("Invalid response");
      setStats(res.data);
    } catch (err) {
      console.error("[AdminHome] loadStats:", err);
      setError("Không thể tải thống kê. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStats(preset, customDate); }, [loadStats, preset, customDate]);

  // document.title badge
  useEffect(() => {
    const pending = stats?.summary?.pendingBookings ?? 0;
    document.title = pending > 0 ? `Dashboard (${pending} chờ duyệt)` : "Dashboard";
    return () => { document.title = "Dashboard"; };
  }, [stats]);

  const handlePresetChange = (p) => {
    setPreset(p);
    // nếu không phải custom thì load ngay, custom sẽ load khi customDate thay đổi
    if (p !== "custom") loadStats(p, customDate);
  };

  const handleDateChange = (date) => {
    setCustomDate(date);
    if (preset === "custom") loadStats("custom", date);
  };

  const handleApprove = async (id) => {
    try { await API.put(`/bookings/approve/${id}`); loadStats(preset, customDate); }
    catch { setError("Không thể duyệt booking"); }
  };

  const handleReject = async (id) => {
    try { await API.put(`/bookings/reject/${id}`); loadStats(preset, customDate); }
    catch { setError("Không thể từ chối booking"); }
  };

  const pendingCount = stats?.summary?.pendingBookings ?? 0;

  const sharedProps = {
    preset, customDate,
    onPresetChange: handlePresetChange,
    onDateChange:   handleDateChange,
    onApprove:      handleApprove,
    onReject:       handleReject,
    navigate,
  };

  return (
    <div className="p-6 w-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Dashboard</h2>
            {pendingCount > 0 && (
              <span className="text-xs font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full">
                {pendingCount} chờ duyệt
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400 mt-0.5">
            Xin chào, <span className="font-semibold text-slate-600">{user?.name}</span>
            <span className="ml-2 text-[11px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-mono">{user?.role}</span>
          </p>
        </div>
        <button onClick={() => loadStats(preset, customDate)}
          className="flex items-center gap-1.5 h-9 px-3 text-sm font-semibold text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors">
          {Icon.refresh} Làm mới
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-600 text-sm px-4 py-3 rounded-xl mb-5">
          {Icon.warning} {error}
        </div>
      )}

      {/* Loading */}
      {loading && <SkeletonStats />}

      {/* Dashboard */}
      {!loading && stats?.role === "super_admin" && (
        <SuperAdminDashboard stats={stats} {...sharedProps} />
      )}
      {!loading && stats?.role === "admin" && (
        <AdminDashboard stats={stats} {...sharedProps} />
      )}
      {!loading && stats && !["super_admin","admin"].includes(stats.role) && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-sm font-semibold text-slate-500">Không xác định được quyền</p>
          <p className="text-xs text-slate-400 mt-1">Role: {stats.role}</p>
        </div>
      )}
    </div>
  );
}