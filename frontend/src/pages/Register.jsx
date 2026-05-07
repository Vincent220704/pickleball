import { useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";

const fields = [
  { key: "name",     label: "Họ tên",             type: "text",     placeholder: "Nguyễn Văn A",      icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
  { key: "email",    label: "Email",               type: "email",    placeholder: "example@gmail.com", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> },
  { key: "phone",    label: "Số điện thoại",       type: "tel",      placeholder: "0xxxxxxxxx",        icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.71 3.18 2 2 0 0 1 3.69 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6.13 6.13l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg> },
  { key: "password", label: "Mật khẩu",           type: "password", placeholder: "Tối thiểu 6 ký tự", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> },
  { key: "confirm",  label: "Nhập lại mật khẩu",  type: "password", placeholder: "Nhập lại mật khẩu", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> },
];

export default function Register() {
  const [form,    setForm]    = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw,  setShowPw]  = useState({ password: false, confirm: false });
  const [done,    setDone]    = useState(false); // ✅ trạng thái đăng ký thành công

  const onChange = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const validate = () => {
    if (!form.name || !form.email || !form.phone || !form.password || !form.confirm)
      return "Vui lòng nhập đầy đủ thông tin";
    if (!/\S+@\S+\.\S+/.test(form.email))
      return "Email không hợp lệ";
    if (!/^(0[3-9]\d{8})$/.test(form.phone))
      return "Số điện thoại không hợp lệ";
    if (form.password.length < 6)
      return "Mật khẩu phải có ít nhất 6 ký tự";
    if (form.password !== form.confirm)
      return "Mật khẩu không khớp";
    return "";
  };

  const submit = async () => {
    setError("");
    const err = validate();
    if (err) return setError(err);
    setLoading(true);
    try {
      await API.post("/auth/register", { name: form.name, email: form.email, phone: form.phone, password: form.password });
      setDone(true); // ✅ hiện màn hình kiểm tra email
    } catch (err) {
      setError(err.response?.data?.message || "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => { if (e.key === "Enter") submit(); };
  const togglePw = (key) => setShowPw((prev) => ({ ...prev, [key]: !prev[key] }));

  // ✅ Màn hình sau khi đăng ký thành công
  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-100 px-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-900/5 p-10">
            {/* Icon mail */}
            <div className="inline-flex w-16 h-16 rounded-2xl bg-indigo-50 items-center justify-center mb-5">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Kiểm tra email của bạn</h2>
            <p className="text-slate-500 text-sm mb-1">
              Chúng tôi đã gửi email xác nhận đến
            </p>
            <p className="text-indigo-600 font-semibold text-sm mb-6">{form.email}</p>
            <p className="text-slate-400 text-xs mb-8">
              Nhấn vào link trong email để kích hoạt tài khoản. Nếu không thấy, hãy kiểm tra thư mục Spam.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 w-full h-11 rounded-xl text-sm font-semibold text-white
                bg-indigo-600 hover:bg-indigo-700 transition-all active:scale-[.98] shadow-sm shadow-indigo-500/20"
            >
              Về trang đăng nhập
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-100 px-4">

      <div className="w-full max-w-md">

        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-indigo-600 items-center justify-center shadow-lg shadow-indigo-500/25 mb-4">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Tạo tài khoản</h1>
          <p className="text-base text-slate-500 mt-1">Đăng ký để bắt đầu đặt sân</p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-900/5 p-8">

          <div className="space-y-4">
            {fields.map(({ key, label, type, placeholder, icon }) => {
              const isPassword = type === "password";
              const inputType  = isPassword && showPw[key] ? "text" : type;
              return (
                <div key={key}>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    {label}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      {icon}
                    </span>
                    <input
                      type={inputType}
                      value={form[key]}
                      onChange={onChange(key)}
                      onKeyDown={handleKeyDown}
                      placeholder={placeholder}
                      className="w-full h-11 pl-10 pr-10 text-slate-800 bg-white border border-slate-200 rounded-xl
                        focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-400
                        hover:border-slate-300 transition-all placeholder:text-slate-300"
                    />
                    {isPassword && (
                      <button type="button" onClick={() => togglePw(key)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                        {showPw[key]
                          ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                          : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        }
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 mt-4 px-3 py-2.5 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700 font-medium">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={submit}
            disabled={loading}
            className="mt-6 w-full h-11 flex items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white
              bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed
              transition-all active:scale-[.98] shadow-sm shadow-indigo-500/20"
          >
            {loading ? (
              <>
                <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                Đang đăng ký...
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <line x1="19" y1="8" x2="19" y2="14"/>
                  <line x1="22" y1="11" x2="16" y2="11"/>
                </svg>
                Đăng ký
              </>
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-xs font-medium text-slate-400">hoặc</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          {/* Login link */}
          <p className="text-center text-sm text-slate-500">
            Đã có tài khoản?{" "}
            <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline transition-colors">
              Đăng nhập ngay
            </Link>
          </p>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-slate-400 mt-5">
          Bằng cách đăng ký, bạn đồng ý với{" "}
          <span className="text-slate-500 font-medium cursor-pointer hover:underline">Điều khoản sử dụng</span>
          {" "}và{" "}
          <span className="text-slate-500 font-medium cursor-pointer hover:underline">Chính sách bảo mật</span>
        </p>
      </div>
    </div>
  );
}