import { useState, useEffect, useRef } from "react";
import API from "../services/api";
import { setUser, getUser } from "../utils/auth";

export default function Profile() {
  const [tab, setTab] = useState("info");
  const [form, setForm] = useState({ name: "", phone: "", avatar: "" });
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [alert, setAlert] = useState(null); // { msg, type }
  const [pwStrength, setPwStrength] = useState(0);
  const [avatarPreview, setAvatarPreview] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    const user = getUser();
    if (user) {
      setForm({ name: user.name || "", phone: user.phone || "", avatar: user.avatar || "" });
      setAvatarPreview(user.avatar || "");
    }
  }, []);

  const showAlert = (msg, type = "success") => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 3500);
  };

  // ── Avatar upload ─────────────────────────────────────────────────────────
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/"))
      return showAlert("Chỉ chấp nhận file ảnh", "error");
    if (file.size > 2 * 1024 * 1024)
      return showAlert("Ảnh không được vượt quá 2MB", "error");

    // Local preview ngay lập tức
    const localUrl = URL.createObjectURL(file);
    setAvatarPreview(localUrl);

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await API.post("/profile/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const newAvatarUrl = res.data.avatarUrl;
      setForm((prev) => ({ ...prev, avatar: newAvatarUrl }));
      setAvatarPreview(newAvatarUrl);
      const user = getUser();
      setUser({ ...user, avatar: newAvatarUrl });
      showAlert("Cập nhật ảnh đại diện thành công");
    } catch (err) {
      const user = getUser();
      setAvatarPreview(user?.avatar || "");
      showAlert(err.response?.data?.message || "Upload ảnh thất bại", "error");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveAvatar = async () => {
    setAvatarPreview("");
    setForm((prev) => ({ ...prev, avatar: "" }));
    const user = getUser();
    setUser({ ...user, avatar: "" });
    try {
      await API.delete("/profile/avatar");
      showAlert("Đã xóa ảnh đại diện");
    } catch {
      // silently ignore
    }
  };

  // ── Password strength ─────────────────────────────────────────────────────
  const calcStrength = (pw) => {
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10 && /[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw) && /[^a-zA-Z0-9]/.test(pw)) score++;
    return score;
  };

  const strengthMeta = [
    null,
    { label: "Yếu",        bar: "bg-red-400",   text: "text-red-500"   },
    { label: "Trung bình",  bar: "bg-amber-400",  text: "text-amber-500" },
    { label: "Mạnh",        bar: "bg-green-500",  text: "text-green-600" },
  ];

  // ── Update profile ────────────────────────────────────────────────────────
  const updateProfile = async () => {
    if (!form.name.trim()) return showAlert("Tên không được để trống", "error");
    setLoading(true);
    try {
      const res = await API.put("/profile", form);
      setUser(res.data.user);
      showAlert("Cập nhật thông tin thành công");
    } catch (err) {
      showAlert(err.response?.data?.message || "Cập nhật thất bại", "error");
    } finally {
      setLoading(false);
    }
  };

  // ── Change password ───────────────────────────────────────────────────────
  const changePassword = async () => {
    const { currentPassword, newPassword, confirm } = pwForm;
    if (!currentPassword || !newPassword || !confirm)
      return showAlert("Vui lòng nhập đầy đủ thông tin", "error");
    if (newPassword.length < 6)
      return showAlert("Mật khẩu mới phải có ít nhất 6 ký tự", "error");
    if (newPassword !== confirm)
      return showAlert("Mật khẩu xác nhận không khớp", "error");

    setLoading(true);
    try {
      await API.put("/profile/change-password", { currentPassword, newPassword });
      showAlert("Đổi mật khẩu thành công");
      setPwForm({ currentPassword: "", newPassword: "", confirm: "" });
      setPwStrength(0);
    } catch (err) {
      showAlert(err.response?.data?.message || "Đổi mật khẩu thất bại", "error");
    } finally {
      setLoading(false);
    }
  };

  const user = getUser();
  const initials = form.name?.charAt(0).toUpperCase() || user?.name?.charAt(0).toUpperCase() || "?";

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-4">

      {/* ── Alert ── */}
      {alert && (
        <div
          className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium
            ${alert.type === "error"
              ? "bg-red-50 text-red-600 border border-red-200"
              : "bg-green-50 text-green-700 border border-green-200"}`}
        >
          <span>{alert.type === "error" ? "✕" : "✓"}</span>
          {alert.msg}
        </div>
      )}

      {/* ── Header card ── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4">

        {/* Avatar with hover overlay */}
        <div className="relative group shrink-0">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-medium text-blue-600">{initials}</span>
            )}
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute inset-0 rounded-full bg-black/40 flex flex-col items-center justify-center
                       opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed"
          >
            {uploading ? (
              <svg className="w-5 h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : (
              <>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <span className="text-white text-[10px] mt-1 font-medium">Tải lên</span>
              </>
            )}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>

        {/* User info */}
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-gray-900 truncate">{user?.name || "—"}</p>
          <p className="text-sm text-gray-500 truncate">{user?.email}</p>
          <span
            className={`inline-block mt-1 text-xs font-medium px-2.5 py-0.5 rounded-full
              ${user?.role === "admin" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}
          >
            {user?.role}
          </span>
        </div>

        {avatarPreview && (
          <button
            onClick={handleRemoveAvatar}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors shrink-0"
          >
            Xóa ảnh
          </button>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-2">
        {[
          { key: "info",     label: "Thông tin cá nhân" },
          { key: "password", label: "Đổi mật khẩu"      },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => { setTab(key); setAlert(null); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${tab === key
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab: Thông tin ── */}
      {tab === "info" && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            Thông tin cơ bản
          </p>

          {/* Avatar shortcut row */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center shrink-0">
              {avatarPreview
                ? <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
                : <span className="text-sm font-medium text-blue-600">{initials}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700">Ảnh đại diện</p>
              <p className="text-xs text-gray-400">JPG, PNG, GIF — tối đa 2MB</p>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 shrink-0 disabled:opacity-50"
            >
              {uploading ? "Đang tải..." : "Thay đổi"}
            </button>
          </div>

          <div className="h-px bg-gray-100" />

          {[
            { key: "name",  label: "Họ và tên",     type: "text", placeholder: "Nguyễn Văn A", required: true  },
            { key: "phone", label: "Số điện thoại",  type: "text", placeholder: "0901 234 567", required: false },
          ].map(({ key, label, type, placeholder, required }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {label}
                {required && <span className="text-red-500 ml-0.5">*</span>}
              </label>
              <input
                type={type}
                placeholder={placeholder}
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50
                           focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400
                           focus:bg-white transition-all placeholder:text-gray-300"
              />
            </div>
          ))}

          <button
            onClick={updateProfile}
            disabled={loading}
            className="w-full py-2.5 rounded-xl text-sm font-semibold bg-blue-600 text-white
                       hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Đang lưu..." : "Lưu thông tin"}
          </button>
        </div>
      )}

      {/* ── Tab: Đổi mật khẩu ── */}
      {tab === "password" && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            Bảo mật tài khoản
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Mật khẩu hiện tại
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={pwForm.currentPassword}
              onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50
                         focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400
                         focus:bg-white transition-all placeholder:text-gray-300"
            />
          </div>

          <div className="h-px bg-gray-100" />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Mật khẩu mới
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={pwForm.newPassword}
              onChange={(e) => {
                setPwForm({ ...pwForm, newPassword: e.target.value });
                setPwStrength(e.target.value ? calcStrength(e.target.value) : 0);
              }}
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50
                         focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400
                         focus:bg-white transition-all placeholder:text-gray-300"
            />
            {pwStrength > 0 && (
              <div className="mt-2 space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors
                        ${i <= pwStrength ? strengthMeta[pwStrength].bar : "bg-gray-200"}`}
                    />
                  ))}
                </div>
                <p className={`text-xs font-medium ${strengthMeta[pwStrength].text}`}>
                  Độ mạnh: {strengthMeta[pwStrength].label}
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Xác nhận mật khẩu mới
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={pwForm.confirm}
              onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
              className={`w-full px-3 py-2.5 text-sm rounded-xl border bg-gray-50
                          focus:outline-none focus:ring-2 focus:bg-white transition-all placeholder:text-gray-300
                          ${pwForm.confirm && pwForm.confirm !== pwForm.newPassword
                            ? "border-red-300 focus:ring-red-200 focus:border-red-400"
                            : "border-gray-200 focus:ring-blue-300 focus:border-blue-400"}`}
            />
            {pwForm.confirm && (
              <p className={`text-xs mt-1 font-medium
                ${pwForm.confirm === pwForm.newPassword ? "text-green-600" : "text-red-500"}`}>
                {pwForm.confirm === pwForm.newPassword ? "✓ Mật khẩu khớp" : "✕ Chưa khớp"}
              </p>
            )}
          </div>

          <button
            onClick={changePassword}
            disabled={loading}
            className="w-full py-2.5 rounded-xl text-sm font-semibold bg-blue-600 text-white
                       hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Đang xử lý..." : "Cập nhật mật khẩu"}
          </button>
        </div>
      )}
    </div>
  );
}