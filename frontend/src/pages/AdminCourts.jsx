import { useEffect, useState, useCallback, useRef } from "react";
import API from "../services/api";

// ─── Constants ───────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  name: "", location: "", price: "", description: "",
  surface_type: "", open_time: "06:00", close_time: "22:00",
};

const STATUS = {
  active:      { label: "Hoạt động", dot: "bg-emerald-500" },
  inactive:    { label: "Tạm dừng",  dot: "bg-amber-400"  },
  maintenance: { label: "Bảo trì",   dot: "bg-rose-500"   },
};

const SURFACE_OPTIONS = ["Cỏ nhân tạo", "Cỏ tự nhiên", "Sân cứng", "Sân gỗ", "Đất nện", "Concrete"];
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
const pad = (n) => String(n).padStart(2, "0");
const fmtTime = (h, m) => `${pad(h)}:${pad(m)}`;

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
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Scroll selected item into view when opening
  useEffect(() => {
    if (!open) return;
    setTimeout(() => {
      if (hRef.current) {
        const el = hRef.current.querySelector("[data-sel='1']");
        if (el) hRef.current.scrollTop = el.offsetTop - 60;
      }
      if (mRef.current) {
        const el = mRef.current.querySelector("[data-sel='1']");
        if (el) mRef.current.scrollTop = el.offsetTop - 60;
      }
    }, 30);
  }, [open]);

  const selectHour = (h) => {
    setCurH(h);
    onChange(fmtTime(h, curM));
    // Don't close — let user pick minute too if needed
  };

  const selectMinute = (m) => {
    setCurM(m);
    onChange(fmtTime(curH, m));
    setOpen(false); // close after minute selected
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`
          flex items-center gap-2 w-full h-10 px-3 text-base rounded-lg border transition-all bg-white
          ${open ? "border-indigo-400 ring-2 ring-indigo-500/15" : "border-slate-200 hover:border-slate-300"}
        `}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className={open ? "text-indigo-500" : "text-slate-400"}>
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
        <span className={`flex-1 text-left font-semibold tabular-nums text-base ${open ? "text-indigo-700" : "text-slate-700"}`}>
          {value}
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          className={`text-slate-400 transition-transform ${open ? "rotate-180 text-indigo-400" : ""}`}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-[200] bg-white border border-slate-200 rounded-xl shadow-xl shadow-slate-900/10 overflow-hidden">
          {/* Column headers */}
          <div className="flex bg-slate-50/80 border-b border-slate-100">
            <div className="flex-1 py-2 text-center text-[11px] font-semibold text-slate-400 uppercase tracking-widest border-r border-slate-100">Giờ</div>
            <div className="flex-1 py-2 text-center text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Phút</div>
          </div>
          {/* Scrollable columns */}
          <div className="flex" style={{ height: 200 }}>
            {/* Hours */}
            <div ref={hRef} className="flex-1 overflow-y-auto border-r border-slate-100">
              {Array.from({ length: 24 }, (_, i) => (
                <div
                  key={i}
                  data-sel={i === curH ? "1" : undefined}
                  onClick={() => selectHour(i)}
                  className={`py-2 text-center text-sm cursor-pointer select-none transition-colors
                    ${i === curH
                      ? "bg-indigo-600 text-white font-bold"
                      : "text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
                    }`}
                >
                  {pad(i)}
                </div>
              ))}
            </div>
            {/* Minutes */}
            <div ref={mRef} className="flex-1 overflow-y-auto">
              {MINUTES.map((m) => (
                <div
                  key={m}
                  data-sel={m === curM ? "1" : undefined}
                  onClick={() => selectMinute(m)}
                  className={`py-2 text-center text-sm cursor-pointer select-none transition-colors
                    ${m === curM
                      ? "bg-indigo-600 text-white font-bold"
                      : "text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
                    }`}
                >
                  {pad(m)}
                </div>
              ))}
            </div>
          </div>
          {/* Current value preview */}
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

// ─── Modal ────────────────────────────────────────────────────────────────────

function CourtModal({ isEdit, value, onChange, onSubmit, onClose }) {
  const backdropRef = useRef(null);

  const handleBackdrop = (e) => {
    if (e.target === backdropRef.current) onClose();
  };

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const set = (key) => (e) =>
    onChange({ ...value, [key]: typeof e === "string" ? e : e.target.value });

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdrop}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.45)", backdropFilter: "blur(4px)" }}
    >
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl shadow-slate-900/20 overflow-hidden">

        {/* Header */}
        <div className={`flex items-center gap-3 px-6 py-4 border-b border-slate-100 ${isEdit ? "bg-indigo-50/60" : "bg-white"}`}>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isEdit ? "bg-indigo-600" : "bg-slate-900"}`}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              {isEdit
                ? <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>
                : <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>
              }
            </svg>
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {isEdit ? "Chỉnh sửa sân" : "Thêm sân mới"}
            </h3>
            <p className="text-sm text-slate-400">
              {isEdit ? `Đang chỉnh sửa: ${value.name}` : "Điền thông tin sân bên dưới"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">

          {/* Tên sân */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Tên sân <span className="text-rose-400">*</span>
            </label>
            <input
              type="text" value={value.name} onChange={set("name")}
              placeholder="VD: Sân bóng đá Mỹ Đình A1"
              className="w-full h-10 px-3 text-base text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-400 hover:border-slate-300 transition-all placeholder:text-slate-300"
            />
          </div>

          {/* Địa chỉ */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Địa chỉ <span className="text-rose-400">*</span>
            </label>
            <input
              type="text" value={value.location} onChange={set("location")}
              placeholder="VD: 123 Lê Duẩn, Hải Châu, Đà Nẵng"
              className="w-full h-10 px-3 text-base text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-400 hover:border-slate-300 transition-all placeholder:text-slate-300"
            />
          </div>

          {/* Giá + Loại mặt sân */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Giá thuê / giờ <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base text-slate-400 font-medium select-none">₫</span>
                <input
                  type="number" value={value.price} onChange={set("price")}
                  placeholder="150000"
                  className="w-full h-10 pl-7 pr-3 text-base text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-400 hover:border-slate-300 transition-all placeholder:text-slate-300"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Loại mặt sân
              </label>
              <div className="relative">
                <select
                  value={value.surface_type} onChange={set("surface_type")}
                  className="w-full h-10 pl-3 pr-8 text-base text-slate-800 bg-white border border-slate-200 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-400 hover:border-slate-300 transition-all"
                >
                  <option value="">Chọn loại</option>
                  {SURFACE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Giờ mở / đóng */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Giờ mở cửa
              </label>
              <TimePicker
                value={value.open_time}
                onChange={(v) => onChange({ ...value, open_time: v })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Giờ đóng cửa
              </label>
              <TimePicker
                value={value.close_time}
                onChange={(v) => onChange({ ...value, close_time: v })}
              />
            </div>
          </div>

          {/* Mô tả */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Mô tả
            </label>
            <textarea
              value={value.description} onChange={set("description")}
              rows={3} placeholder="Thông tin thêm về sân..."
              className="w-full px-3 py-2.5 text-base text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-400 hover:border-slate-300 transition-all placeholder:text-slate-300 resize-none"
            />
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 bg-slate-50 border-t border-slate-100">
          <button
            onClick={onClose}
            className="h-10 px-4 rounded-lg text-sm font-semibold text-slate-500 bg-white border border-slate-200 hover:bg-slate-100 transition-all"
          >
            Hủy
          </button>
          <button
            onClick={onSubmit}
            className={`
              flex items-center gap-2 h-10 px-5 rounded-lg text-sm font-semibold text-white transition-all active:scale-[.98]
              ${isEdit ? "bg-indigo-600 hover:bg-indigo-700" : "bg-slate-900 hover:bg-slate-800"}
            `}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              {isEdit
                ? <polyline points="20 6 9 17 4 12"/>
                : <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>
              }
            </svg>
            {isEdit ? "Lưu thay đổi" : "Thêm sân mới"}
          </button>
        </div>

      </div>
    </div>
  );
}

// ─── CourtCard ────────────────────────────────────────────────────────────────

function CourtCard({ court, onEdit, onDelete }) {
  const s = STATUS[court.status] || { label: court.status, dot: "bg-slate-400" };

  return (
    <div className="group bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 hover:shadow-sm transition-all duration-150">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {/* Name + status */}
          <div className="flex items-center gap-2.5 mb-3 flex-wrap">
            <span className="text-base font-bold text-slate-900">{court.name}</span>
            <span className="flex items-center gap-1.5 text-sm font-medium text-slate-500">
              <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
              {s.label}
            </span>
          </div>
          {/* Info chips */}
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100 text-sm text-slate-500">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              {court.location}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100 text-sm text-slate-500">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              {court.open_time} – {court.close_time}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-sm font-semibold text-indigo-700">
              {Number(court.price).toLocaleString("vi-VN")}đ
              <span className="font-normal text-indigo-400">/giờ</span>
            </span>
            {court.surface_type && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100 text-sm text-slate-500">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>
                </svg>
                {court.surface_type}
              </span>
            )}
          </div>
          {court.description && (
            <p className="mt-2 text-sm text-slate-400 line-clamp-1">{court.description}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-1.5 shrink-0">
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 border border-transparent hover:border-indigo-200 transition-all"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Sửa
          </button>
          <button
            onClick={onDelete}
            className="flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-semibold text-slate-500 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 border border-transparent hover:border-rose-200 transition-all"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
            </svg>
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AdminCourts() {
  const [courts,   setCourts]   = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState("");
  const [modal,    setModal]    = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const feedback = (msg, isError = false) => {
    if (isError) { setError(msg); setSuccess(""); }
    else         { setSuccess(msg); setError(""); }
    setTimeout(() => { setError(""); setSuccess(""); }, 3500);
  };

  const loadCourts = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await API.get("/courts/manage");
      setCourts(res.data);
    } catch (err) {
      feedback(`Không thể tải danh sách sân (${err.response?.status ?? "lỗi mạng"})`, true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCourts(); }, [loadCourts]);

  const openAdd  = () => { setFormData(EMPTY_FORM); setModal("add"); };
  const openEdit = (court) => { setFormData({ ...court }); setModal("edit"); };
  const closeModal = () => { setModal(null); setFormData(EMPTY_FORM); };

  const handleAdd = async () => {
    if (!formData.name || !formData.location || !formData.price)
      return feedback("Vui lòng nhập đủ tên sân, địa chỉ và giá", true);
    try {
      await API.post("/courts", formData);
      closeModal();
      feedback("Thêm sân thành công!");
      loadCourts();
    } catch (err) {
      feedback(err.response?.data?.message || "Thêm sân thất bại", true);
    }
  };

  const handleUpdate = async () => {
    if (!formData.name || !formData.location || !formData.price)
      return feedback("Vui lòng nhập đủ tên sân, địa chỉ và giá", true);
    try {
      await API.put(`/courts/${formData.id}`, formData);
      closeModal();
      feedback("Cập nhật sân thành công!");
      loadCourts();
    } catch (err) {
      feedback(err.response?.data?.message || "Cập nhật thất bại", true);
    }
  };

  const deleteCourt = async (id) => {
    if (!window.confirm("Xác nhận xóa sân này?")) return;
    try {
      await API.delete(`/courts/${id}`);
      feedback("Đã xóa sân");
      loadCourts();
    } catch (err) {
      feedback(err.response?.data?.message || "Xóa thất bại", true);
    }
  };

  return (
    <div className="p-8 w-full">

      {/* Page header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Quản lý sân</h2>
          <p className="text-base text-slate-400 mt-1">Thêm, chỉnh sửa và quản lý danh sách sân</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-all active:scale-[.98] shadow-sm"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Thêm sân mới
        </button>
      </div>

      {/* Toast */}
      {(error || success) && (
        <div className={`flex items-center gap-3 px-4 py-3 mb-5 rounded-xl text-sm font-medium border
          ${error
            ? "bg-rose-50 border-rose-200 text-rose-700"
            : "bg-emerald-50 border-emerald-200 text-emerald-700"}`}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {error
              ? <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>
              : <polyline points="20 6 9 17 4 12"/>}
          </svg>
          {error || success}
        </div>
      )}

      {/* List header */}
      <div className="flex items-center gap-3 mb-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Danh sách sân</h3>
        {!loading && courts.length > 0 && (
          <span className="text-xs font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
            {courts.length} sân
          </span>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center gap-2 text-sm text-slate-400 py-12">
          <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
          Đang tải danh sách sân...
        </div>
      )}

      {/* Empty state */}
      {!loading && courts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 border border-dashed border-slate-200 rounded-2xl">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-400">
              <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
            </svg>
          </div>
          <p className="text-base font-semibold text-slate-500">Chưa có sân nào</p>
          <p className="text-sm text-slate-400 mt-1 mb-4">Bắt đầu bằng cách thêm sân đầu tiên</p>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 h-9 px-4 rounded-lg text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-all"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Thêm sân đầu tiên
          </button>
        </div>
      )}

      {/* Court list */}
      <div className="flex flex-col gap-3">
        {courts.map((c) => (
          <CourtCard
            key={c.id}
            court={c}
            onEdit={() => openEdit(c)}
            onDelete={() => deleteCourt(c.id)}
          />
        ))}
      </div>

      {/* Modal */}
      {modal && (
        <CourtModal
          isEdit={modal === "edit"}
          value={formData}
          onChange={setFormData}
          onSubmit={modal === "edit" ? handleUpdate : handleAdd}
          onClose={closeModal}
        />
      )}

    </div>
  );
}