import { useEffect, useState, useCallback, useRef } from "react";
import API from "../services/api";

// ─── Constants ────────────────────────────────────────────────────────────────
const EMPTY_FORM = { title: "", thumbnail: "", summary: "", content: "", category_id: "" };

const STATUS = {
  published: { label: "Published", dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  draft:     { label: "Draft",     dot: "bg-amber-400",   text: "text-amber-700",   bg: "bg-amber-50 border-amber-200"   },
  archived:  { label: "Archived",  dot: "bg-slate-400",   text: "text-slate-500",   bg: "bg-slate-50 border-slate-200"   },
};

// ─── NewsModal ────────────────────────────────────────────────────────────────
function NewsModal({ isEdit, value, onChange, onSubmit, onClose, categories }) {
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

  const set = (key) => (e) => onChange({ ...value, [key]: e.target.value });

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdrop}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.45)", backdropFilter: "blur(4px)" }}
    >
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl shadow-slate-900/20 overflow-hidden">

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
              {isEdit ? "Chỉnh sửa bài viết" : "Viết bài mới"}
            </h3>
            <p className="text-sm text-slate-400">
              {isEdit ? `Đang chỉnh sửa: ${value.title}` : "Điền thông tin bài viết bên dưới"}
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

          {/* Tiêu đề */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Tiêu đề <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={value.title}
              onChange={set("title")}
              placeholder="Nhập tiêu đề bài viết..."
              className="w-full h-10 px-3 text-base text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-400 hover:border-slate-300 transition-all placeholder:text-slate-300"
            />
          </div>

          {/* Danh mục + Thumbnail */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Danh mục
              </label>
              <div className="relative">
                <select
                  value={value.category_id ?? ""}
                  onChange={set("category_id")}
                  className="w-full h-10 pl-3 pr-8 text-base text-slate-800 bg-white border border-slate-200 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-400 hover:border-slate-300 transition-all"
                >
                  <option value="">-- Chọn danh mục --</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                URL Ảnh đại diện
              </label>
              <input
                type="text"
                value={value.thumbnail}
                onChange={set("thumbnail")}
                placeholder="https://..."
                className="w-full h-10 px-3 text-base text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-400 hover:border-slate-300 transition-all placeholder:text-slate-300"
              />
            </div>
          </div>

          {/* Tóm tắt */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Tóm tắt
            </label>
            <input
              type="text"
              value={value.summary}
              onChange={set("summary")}
              placeholder="Mô tả ngắn về bài viết..."
              className="w-full h-10 px-3 text-base text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-400 hover:border-slate-300 transition-all placeholder:text-slate-300"
            />
          </div>

          {/* Nội dung */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Nội dung <span className="text-rose-400">*</span>
              <span className="ml-2 normal-case font-normal text-slate-400">(hỗ trợ HTML)</span>
            </label>
            <textarea
              value={value.content}
              onChange={set("content")}
              rows={10}
              placeholder="<p>Nội dung bài viết...</p>"
              className="w-full px-3 py-2.5 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-400 hover:border-slate-300 transition-all placeholder:text-slate-300 resize-y font-mono"
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
            {isEdit ? "Lưu thay đổi" : "Đăng bài"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── NewsCard ─────────────────────────────────────────────────────────────────
function NewsCard({ n, onEdit, onArchive, onDelete }) {
  const s = STATUS[n.status] || STATUS.draft;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 hover:shadow-sm transition-all duration-150">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {/* Title + status */}
          <div className="flex items-center gap-2.5 mb-2 flex-wrap">
            <span className="text-base font-bold text-slate-900 truncate">{n.title}</span>
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full border ${s.bg} ${s.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
              {s.label}
            </span>
          </div>

          {/* Category */}
          {n.category_name && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-blue-50 border border-blue-100 text-xs font-semibold text-blue-600 mb-2">
              {n.category_name}
            </span>
          )}

          {/* Summary */}
          {n.summary && (
            <p className="text-sm text-slate-400 line-clamp-1 mb-2">{n.summary}</p>
          )}

          {/* Meta */}
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
              {n.views} lượt xem
            </span>
            <span className="flex items-center gap-1">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              {new Date(n.created_at).toLocaleDateString("vi-VN")}
            </span>
          </div>
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
            onClick={onArchive}
            className={`flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-semibold border border-transparent transition-all
              ${n.status === "archived"
                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-200"
                : "bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200"
              }`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {n.status === "archived"
                ? <><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.51"/></>
                : <><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></>
              }
            </svg>
            {n.status === "archived" ? "Publish" : "Archive"}
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
export default function AdminNews() {
  const [news,       setNews]       = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [success,    setSuccess]    = useState("");
  const [modal,      setModal]      = useState(null); // null | "add" | "edit"
  const [formData,   setFormData]   = useState(EMPTY_FORM);

  const feedback = (msg, isError = false) => {
    if (isError) { setError(msg); setSuccess(""); }
    else         { setSuccess(msg); setError(""); }
    setTimeout(() => { setError(""); setSuccess(""); }, 3500);
  };

  // ── Load ─────────────────────────────────────────────────────────────────
  const loadNews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get("/news/admin/all");
      setNews(res.data);
    } catch {
      feedback("Không thể tải danh sách tin tức", true);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const res = await API.get("/news/categories");
      setCategories(res.data);
    } catch {}
  }, []);

  useEffect(() => { loadNews();       }, [loadNews]);
  useEffect(() => { loadCategories(); }, [loadCategories]);

  // ── Modal helpers ─────────────────────────────────────────────────────────
  const openAdd  = () => { setFormData(EMPTY_FORM); setModal("add"); };
  const openEdit = (n) => { setFormData({ ...n }); setModal("edit"); };
  const closeModal = () => { setModal(null); setFormData(EMPTY_FORM); };

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const createNews = async () => {
    if (!formData.title || !formData.content) {
      return feedback("Vui lòng nhập tiêu đề và nội dung", true);
    }
    try {
      await API.post("/news", formData);
      closeModal();
      feedback("Đăng bài thành công");
      loadNews();
    } catch (err) {
      feedback(err.response?.data?.message || "Đăng bài thất bại", true);
    }
  };

  const updateNews = async () => {
    if (!formData.title || !formData.content) {
      return feedback("Vui lòng nhập tiêu đề và nội dung", true);
    }
    try {
      await API.put(`/news/${formData.id}`, formData);
      closeModal();
      feedback("Cập nhật bài viết thành công");
      loadNews();
    } catch (err) {
      feedback(err.response?.data?.message || "Cập nhật thất bại", true);
    }
  };

  const deleteNews = async (id) => {
    if (!window.confirm("Xóa bài viết này?")) return;
    try {
      await API.delete(`/news/${id}`);
      feedback("Đã xóa bài viết");
      loadNews();
    } catch (err) {
      feedback(err.response?.data?.message || "Xóa thất bại", true);
    }
  };

  const archiveNews = async (id, currentStatus) => {
    const newStatus = currentStatus === "archived" ? "published" : "archived";
    try {
      await API.put(`/news/${id}`, { status: newStatus });
      feedback(newStatus === "archived" ? "Đã archive bài viết" : "Đã publish lại bài viết");
      loadNews();
    } catch (err) {
      feedback(err.response?.data?.message || "Thao tác thất bại", true);
    }
  };

  return (
    <div className="p-8 w-full">

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Quản lý Tin tức</h2>
          <p className="text-base text-slate-400 mt-1">Viết, chỉnh sửa và quản lý bài viết</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-all active:scale-[.98] shadow-sm"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Viết bài mới
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
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Danh sách bài viết</h3>
        {!loading && news.length > 0 && (
          <span className="text-xs font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
            {news.length} bài
          </span>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center gap-2 text-sm text-slate-400 py-12">
          <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
          Đang tải danh sách bài viết...
        </div>
      )}

      {/* Empty state */}
      {!loading && news.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 border border-dashed border-slate-200 rounded-2xl">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-400">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
            </svg>
          </div>
          <p className="text-base font-semibold text-slate-500">Chưa có bài viết nào</p>
          <p className="text-sm text-slate-400 mt-1 mb-4">Bắt đầu bằng cách viết bài đầu tiên</p>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 h-9 px-4 rounded-lg text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-all"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Viết bài đầu tiên
          </button>
        </div>
      )}

      {/* News list */}
      <div className="flex flex-col gap-3">
        {news.map(n => (
          <NewsCard
            key={n.id}
            n={n}
            onEdit={() => openEdit(n)}
            onArchive={() => archiveNews(n.id, n.status)}
            onDelete={() => deleteNews(n.id)}
          />
        ))}
      </div>

      {/* Modal */}
      {modal && (
        <NewsModal
          isEdit={modal === "edit"}
          value={formData}
          onChange={setFormData}
          onSubmit={modal === "edit" ? updateNews : createNews}
          onClose={closeModal}
          categories={categories}
        />
      )}
    </div>
  );
}