import { useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";

export default function ForgotPassword() {
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [sent,    setSent]    = useState(false);

  const submit = async () => {
    setError("");
    if (!email) return setError("Vui lòng nhập email");
    if (!/\S+@\S+\.\S+/.test(email)) return setError("Email không hợp lệ");

    setLoading(true);
    try {
      await API.post("/auth/forgot-password", { email });
      setSent(true);
    } catch {
      setError("Gửi yêu cầu thất bại, thử lại sau");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => { if (e.key === "Enter") submit(); };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-100 px-4">
      <div className="w-full max-w-md">

        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-indigo-600 items-center justify-center shadow-lg shadow-indigo-500/25 mb-4">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <rect x="3" y="11" width="18" height="11" rx="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Quên mật khẩu</h1>
          <p className="text-base text-slate-500 mt-1">Chúng tôi sẽ gửi link đặt lại qua email</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-900/5 p-8">

          {sent ? (
            /* ── Success state ── */
            <div className="text-center py-4">
              <div className="inline-flex w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 items-center justify-center mb-5">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>

              <h2 className="text-lg font-bold text-slate-800 mb-2">Kiểm tra hộp thư!</h2>
              <p className="text-sm text-slate-500 mb-1">
                Chúng tôi đã gửi link đặt lại mật khẩu đến
              </p>
              <p className="text-sm font-semibold text-indigo-600 mb-5">{email}</p>
              <p className="text-xs text-slate-400 mb-6">
                Không thấy email? Kiểm tra thư mục <span className="font-medium text-slate-500">Spam</span> hoặc thử lại.
              </p>

              <button
                onClick={() => { setSent(false); setEmail(""); }}
                className="w-full h-11 flex items-center justify-center gap-2 rounded-xl text-sm font-semibold
                  text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all active:scale-[.98] mb-4"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4"/>
                </svg>
                Gửi lại email
              </button>

              <Link
                to="/login"
                className="flex items-center justify-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700 hover:underline transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
                Quay lại đăng nhập
              </Link>
            </div>

          ) : (
            /* ── Form state ── */
            <>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Email
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <polyline points="22,6 12,13 2,6"/>
                      </svg>
                    </span>
                    <input
                      type="email"
                      placeholder="example@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="w-full h-11 pl-10 pr-4 text-slate-800 bg-white border border-slate-200 rounded-xl
                        focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-400
                        hover:border-slate-300 transition-all placeholder:text-slate-300"
                    />
                  </div>
                </div>
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
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                      <line x1="22" y1="2" x2="11" y2="13"/>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                    Gửi yêu cầu
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-xs font-medium text-slate-400">hoặc</span>
                <div className="flex-1 h-px bg-slate-100" />
              </div>

              {/* Back to login */}
              <p className="text-center text-sm text-slate-500">
                Nhớ mật khẩu rồi?{" "}
                <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline transition-colors">
                  Đăng nhập ngay
                </Link>
              </p>
            </>
          )}
        </div>

        {/* Footer note */}
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