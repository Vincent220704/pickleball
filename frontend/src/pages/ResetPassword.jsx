import { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import API from "../services/api";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);
  const [showPw,   setShowPw]   = useState({ password: false, confirm: false });

  const [params] = useSearchParams();
  const navigate  = useNavigate();
  const token     = params.get("token");

  const isMismatch = confirm && password !== confirm;

  const validate = () => {
    if (!token)                return "Link reset không hợp lệ";
    if (!password || !confirm) return "Vui lòng nhập đầy đủ thông tin";
    if (password.length < 6)   return "Mật khẩu phải có ít nhất 6 ký tự";
    if (password !== confirm)  return "Mật khẩu xác nhận không khớp";
    return "";
  };

  const submit = async () => {
    setError("");
    const err = validate();
    if (err) return setError(err);

    setLoading(true);
    try {
      await API.post("/auth/reset-password", { token, newPassword: password });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Đổi mật khẩu thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => { if (e.key === "Enter") submit(); };
  const togglePw = (key) => setShowPw((prev) => ({ ...prev, [key]: !prev[key] }));

  const EyeIcon = ({ open }) => open
    ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
    : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;

  const fields = [
    { key: "password", label: "Mật khẩu mới",    placeholder: "Tối thiểu 6 ký tự",  value: password, onChange: setPassword },
    { key: "confirm",  label: "Nhập lại mật khẩu", placeholder: "Nhập lại mật khẩu", value: confirm,  onChange: setConfirm  },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-100 px-4">
      <div className="w-full max-w-md">

        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-indigo-600 items-center justify-center shadow-lg shadow-indigo-500/25 mb-4">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Đặt lại mật khẩu</h1>
          <p className="text-base text-slate-500 mt-1">Tạo mật khẩu mới cho tài khoản của bạn</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-900/5 p-8">

          {success ? (
            /* ── Success state ── */
            <div className="text-center py-4">
              <div className="inline-flex w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 items-center justify-center mb-5">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>

              <h2 className="text-lg font-bold text-slate-800 mb-2">Đổi mật khẩu thành công!</h2>
              <p className="text-sm text-slate-500 mb-6">
                Đang chuyển bạn về trang đăng nhập...
              </p>

              {/* Progress bar */}
              <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden mb-6">
                <div className="h-full bg-indigo-500 rounded-full animate-[shrink_2s_linear_forwards]"
                  style={{ animation: "width 2s linear forwards", width: "100%" }}
                />
              </div>

              <Link
                to="/login"
                className="flex items-center justify-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700 hover:underline transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
                Đăng nhập ngay
              </Link>
            </div>

          ) : (
            /* ── Form state ── */
            <>
              {/* Invalid token warning */}
              {!token && (
                <div className="flex items-center gap-2 mb-5 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 font-medium">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  Link reset không hợp lệ hoặc đã hết hạn
                </div>
              )}

              <div className="space-y-4">
                {fields.map(({ key, label, placeholder, value, onChange }) => (
                  <div key={key}>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      {label}
                    </label>
                    <div className="relative">
                      {/* Lock icon */}
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="11" width="18" height="11" rx="2"/>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                      </span>
                      <input
                        type={showPw[key] ? "text" : "password"}
                        placeholder={placeholder}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className={`w-full h-11 pl-10 pr-10 text-slate-800 bg-white border rounded-xl
                          focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-400
                          hover:border-slate-300 transition-all placeholder:text-slate-300
                          ${key === "confirm" && isMismatch
                            ? "border-rose-300 focus:border-rose-400 focus:ring-rose-500/15"
                            : "border-slate-200"
                          }`}
                      />
                      {/* Show/hide toggle */}
                      <button type="button" onClick={() => togglePw(key)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                        <EyeIcon open={showPw[key]} />
                      </button>
                    </div>

                    {/* Realtime mismatch under confirm field */}
                    {key === "confirm" && isMismatch && (
                      <p className="flex items-center gap-1.5 mt-1.5 text-xs font-medium text-rose-600">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                        Mật khẩu không khớp
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Password strength hint */}
              {password.length > 0 && (
                <div className="mt-3 flex items-center gap-2">
                  {[1,2,3,4].map((i) => (
                    <div key={i} className={`flex-1 h-1 rounded-full transition-all ${
                      password.length < 6  ? (i === 1 ? "bg-rose-400"   : "bg-slate-100") :
                      password.length < 9  ? (i <= 2  ? "bg-amber-400"  : "bg-slate-100") :
                      password.length < 12 ? (i <= 3  ? "bg-indigo-400" : "bg-slate-100") :
                                              "bg-emerald-400"
                    }`} />
                  ))}
                  <span className="text-xs font-medium text-slate-400 w-14 text-right">
                    {password.length < 6  ? "Yếu"    :
                     password.length < 9  ? "Trung bình" :
                     password.length < 12 ? "Mạnh"   : "Rất mạnh"}
                  </span>
                </div>
              )}

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
                disabled={loading || !!isMismatch || !token}
                className="mt-6 w-full h-11 flex items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white
                  bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed
                  transition-all active:scale-[.98] shadow-sm shadow-indigo-500/20"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                    </svg>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                      <rect x="3" y="11" width="18" height="11" rx="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    Đổi mật khẩu
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-xs font-medium text-slate-400">hoặc</span>
                <div className="flex-1 h-px bg-slate-100" />
              </div>

              <p className="text-center text-sm text-slate-500">
                Nhớ mật khẩu rồi?{" "}
                <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline transition-colors">
                  Đăng nhập ngay
                </Link>
              </p>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-5">
          Bằng cách tiếp tục, bạn đồng ý với{" "}
          <span className="text-slate-500 font-medium cursor-pointer hover:underline">Điều khoản sử dụng</span>
          {" "}và{" "}
          <span className="text-slate-500 font-medium cursor-pointer hover:underline">Chính sách bảo mật</span>
        </p>
      </div>
    </div>
  );
}