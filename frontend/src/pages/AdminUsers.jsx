import { useEffect, useState, useCallback, useRef } from "react";
import API from "../services/api";
import { isSuperAdmin } from "../utils/auth";

const EMPTY_FORM = { name: "", email: "", password: "", role: "user", phone: "" };
const PAGE_SIZE  = 10;

const ROLE = {
  super_admin: { label: "Super Admin", dot: "bg-purple-500",  text: "text-purple-700",  bg: "bg-purple-50 border-purple-200"  },
  admin:       { label: "Admin",       dot: "bg-blue-500",    text: "text-blue-700",    bg: "bg-blue-50 border-blue-200"      },
  user:        { label: "User",        dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
};

// ─── RoleSelect ───────────────────────────────────────────────────────────────
function RoleSelect({ value, onChange, superAdmin, size = "md" }) {
  const options = [
    { value: "user",  label: "User",  dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
    ...(superAdmin ? [{ value: "admin", label: "Admin", dot: "bg-blue-500", text: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" }] : []),
  ];

  const current = options.find(o => o.value === value) || options[0];

  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`appearance-none font-semibold border rounded-lg cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20
          ${current.bg} ${current.text} ${current.border}
          ${size === "sm" ? "h-8 pl-2.5 pr-7 text-xs" : "h-10 pl-3 pr-8 text-sm"}
        `}
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <div className={`absolute top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-1 ${size === "sm" ? "right-1.5" : "right-2"}`}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={current.text}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>
    </div>
  );
}

// ─── Modal tạo user ───────────────────────────────────────────────────────────
function CreateUserModal({ form, onChange, onSubmit, onClose, superAdmin }) {
  const backdropRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const fields = [
    { key: "name",     label: "Họ tên",        type: "text",     placeholder: "Nguyễn Văn A",     required: true  },
    { key: "email",    label: "Email",          type: "email",    placeholder: "example@mail.com",  required: true  },
    { key: "password", label: "Mật khẩu",      type: "password", placeholder: "••••••••",          required: true  },
    { key: "phone",    label: "Số điện thoại", type: "text",     placeholder: "0901234567",        required: false },
  ];

  return (
    <div
      ref={backdropRef}
      onClick={(e) => e.target === backdropRef.current && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.45)", backdropFilter: "blur(4px)" }}
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl shadow-slate-900/20 overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center shrink-0">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Tạo tài khoản mới</h3>
            <p className="text-sm text-slate-400">Điền thông tin bên dưới</p>
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
        <div className="px-6 py-5 space-y-4">
          {fields.map(({ key, label, type, placeholder, required }) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                {label} {required && <span className="text-rose-400">*</span>}
              </label>
              <input
                type={type}
                placeholder={placeholder}
                value={form[key]}
                onChange={(e) => onChange({ ...form, [key]: e.target.value })}
                className="w-full h-10 px-3 text-base text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-400 hover:border-slate-300 transition-all placeholder:text-slate-300"
              />
            </div>
          ))}

          {/* Role */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Role
            </label>
            <RoleSelect
              value={form.role}
              onChange={(val) => onChange({ ...form, role: val })}
              superAdmin={superAdmin}
              size="md"
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
            className="flex items-center gap-2 h-10 px-5 rounded-lg text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-all active:scale-[.98]"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Tạo tài khoản
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── UserCard ─────────────────────────────────────────────────────────────────
function UserCard({ u, superAdmin, onChangeRole, onToggleBan, onDelete }) {
  const r = ROLE[u.role] || ROLE.user;

  return (
    <div className={`bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-300 hover:shadow-sm transition-all duration-150 ${u.status === "banned" ? "opacity-60" : ""}`}>
      <div className="flex items-center justify-between gap-4">

        {/* Avatar + Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0 font-bold text-indigo-700 text-base">
            {u.name?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span className="font-bold text-slate-900">{u.name}</span>
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full border ${r.bg} ${r.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${r.dot}`} />
                {r.label}
              </span>
              {u.status === "banned" && (
                <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-600">
                  Bị khóa
                </span>
              )}
            </div>
            <div className="text-sm text-slate-400 truncate">
              {u.email}
              {u.phone && <span className="ml-2 text-slate-300">· {u.phone}</span>}
            </div>
            <div className="text-xs text-slate-300 mt-0.5">
              Tham gia {new Date(u.created_at).toLocaleDateString("vi-VN")}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">

          {/* Đổi role */}
          {superAdmin && u.role !== "super_admin" && (
            <RoleSelect
              value={u.role}
              onChange={(val) => onChangeRole(u.id, val)}
              superAdmin={superAdmin}
              size="sm"
            />
          )}

          {/* Ban / Unban */}
          {u.role !== "super_admin" && (
            <button
              onClick={() => onToggleBan(u.id, u.status)}
              className={`h-8 px-3 rounded-lg text-xs font-semibold border transition-all
                ${u.status === "active"
                  ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                }`}
            >
              {u.status === "active" ? "Khóa" : "Mở khóa"}
            </button>
          )}

          {/* Delete */}
          {superAdmin && u.role !== "super_admin" && (
            <button
              onClick={() => onDelete(u.id)}
              className="h-8 px-3 rounded-lg text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 transition-all"
            >
              Xóa
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────
function Pagination({ page, total, pageSize, onChange }) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
      <p className="text-sm text-slate-400">
        Trang <span className="font-semibold text-slate-700">{page}</span> / {totalPages}
        &nbsp;·&nbsp;
        <span className="font-semibold text-slate-700">{total}</span> người dùng
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-sm text-slate-500 border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
          .reduce((acc, p, i, arr) => {
            if (i > 0 && p - arr[i - 1] > 1) acc.push("...");
            acc.push(p);
            return acc;
          }, [])
          .map((p, i) =>
            p === "..." ? (
              <span key={`dot-${i}`} className="w-8 h-8 flex items-center justify-center text-slate-400 text-sm">···</span>
            ) : (
              <button
                key={p}
                onClick={() => onChange(p)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-semibold transition-all
                  ${page === p
                    ? "bg-slate-900 text-white border border-slate-900"
                    : "text-slate-500 border border-slate-200 hover:bg-slate-50"
                  }`}
              >
                {p}
              </button>
            )
          )
        }

        <button
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-sm text-slate-500 border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminUsers() {
  const [users,      setUsers]      = useState([]);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [showModal,  setShowModal]  = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [success,    setSuccess]    = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [page,       setPage]       = useState(1);
  const superAdmin = isSuperAdmin();

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get("/users");
      setUsers(res.data);
    } catch {
      feedback("Không thể tải danh sách user", true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  // Reset page khi đổi filter
  useEffect(() => { setPage(1); }, [filterRole]);

  const feedback = (msg, isError = false) => {
    if (isError) { setError(msg); setSuccess(""); }
    else         { setSuccess(msg); setError(""); }
    setTimeout(() => { setError(""); setSuccess(""); }, 3500);
  };

  const createUser = async () => {
    if (!form.name || !form.email || !form.password) {
      return feedback("Vui lòng nhập đủ tên, email, mật khẩu", true);
    }
    try {
      await API.post("/users", form);
      feedback("Tạo user thành công");
      setForm(EMPTY_FORM);
      setShowModal(false);
      loadUsers();
    } catch (err) {
      feedback(err.response?.data?.message || "Tạo user thất bại", true);
    }
  };

  const toggleBan = async (id, currentStatus) => {
    const action = currentStatus === "active" ? "khóa" : "mở khóa";
    if (!window.confirm(`Xác nhận ${action} tài khoản này?`)) return;
    try {
      const res = await API.patch(`/users/${id}/ban`);
      feedback(res.data.message);
      loadUsers();
    } catch (err) {
      feedback(err.response?.data?.message || "Thao tác thất bại", true);
    }
  };

  const changeRole = async (id, role) => {
    try {
      await API.put(`/users/role/${id}`, { role });
      feedback("Đã cập nhật role");
      loadUsers();
    } catch (err) {
      feedback(err.response?.data?.message || "Đổi role thất bại", true);
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Xóa vĩnh viễn tài khoản này?")) return;
    try {
      await API.delete(`/users/${id}`);
      feedback("Đã xóa user");
      loadUsers();
    } catch (err) {
      feedback(err.response?.data?.message || "Xóa thất bại", true);
    }
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = [
    { key: "all",         label: "Tổng",       value: users.length,                                        activeBg: "bg-slate-800 text-white border-slate-800",    bg: "bg-slate-100 text-slate-700 border-slate-200"    },
    { key: "super_admin", label: "Super Admin", value: users.filter(u => u.role === "super_admin").length,  activeBg: "bg-purple-600 text-white border-purple-600",  bg: "bg-purple-50 text-purple-700 border-purple-200"  },
    { key: "admin",       label: "Admin",       value: users.filter(u => u.role === "admin").length,        activeBg: "bg-blue-600 text-white border-blue-600",      bg: "bg-blue-50 text-blue-700 border-blue-200"        },
    { key: "user",        label: "User",        value: users.filter(u => u.role === "user").length,         activeBg: "bg-emerald-600 text-white border-emerald-600",bg: "bg-emerald-50 text-emerald-700 border-emerald-200"},
    { key: "banned",      label: "Bị khóa",    value: users.filter(u => u.status === "banned").length,     activeBg: "bg-rose-600 text-white border-rose-600",      bg: "bg-rose-50 text-rose-700 border-rose-200"        },
  ];

  // ── Filter + Paginate ─────────────────────────────────────────────────────
  const filtered = users.filter(u => {
    if (filterRole === "all")    return true;
    if (filterRole === "banned") return u.status === "banned";
    return u.role === filterRole;
  });

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="p-8 w-full">

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Quản lý User</h2>
          <p className="text-base text-slate-400 mt-1">Quản lý tài khoản, phân quyền và trạng thái</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-all active:scale-[.98] shadow-sm"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Thêm user
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

      {/* Stats filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {stats.map(({ key, label, value, bg, activeBg }) => (
          <button
            key={key}
            onClick={() => setFilterRole(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all
              ${filterRole === key ? activeBg : `${bg} hover:opacity-80`}`}
          >
            {label}
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${filterRole === key ? "bg-white/20 text-white" : "bg-white/80"}`}>
              {value}
            </span>
          </button>
        ))}
      </div>

      {/* List header */}
      <div className="flex items-center gap-3 mb-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          {stats.find(s => s.key === filterRole)?.label || "Tất cả"}
        </h3>
        <span className="text-xs font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
          {filtered.length} người
        </span>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center gap-2 text-sm text-slate-400 py-12">
          <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
          Đang tải danh sách user...
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 border border-dashed border-slate-200 rounded-2xl">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-400">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <p className="text-base font-semibold text-slate-500">Không có user nào</p>
        </div>
      )}

      {/* User list */}
      <div className="flex flex-col gap-3">
        {paginated.map(u => (
          <UserCard
            key={u.id}
            u={u}
            superAdmin={superAdmin}
            onChangeRole={changeRole}
            onToggleBan={toggleBan}
            onDelete={deleteUser}
          />
        ))}
      </div>

      {/* Pagination */}
      <Pagination
        page={page}
        total={filtered.length}
        pageSize={PAGE_SIZE}
        onChange={setPage}
      />

      {/* Modal */}
      {showModal && (
        <CreateUserModal
          form={form}
          onChange={setForm}
          onSubmit={createUser}
          onClose={() => { setShowModal(false); setForm(EMPTY_FORM); }}
          superAdmin={superAdmin}
        />
      )}
    </div>
  );
}