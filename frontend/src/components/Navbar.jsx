import { Link, useNavigate, useLocation } from "react-router-dom";
import { clearAuth, isAdmin, getUser } from "../utils/auth";
import NotificationBell from "./NotificationBell";

export default function Navbar() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const user      = getUser();

  const logout = () => {
    clearAuth();
    navigate("/");
  };

  const navLink = (to, label) => {
    const active = location.pathname === to;
    return (
      <Link
        to={to}
        className={`px-3 py-1.5 rounded-lg text-sm transition-colors duration-150 ${
          active
            ? "bg-indigo-50 text-indigo-600 font-medium"
            : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <nav className="flex items-center gap-1 px-5 bg-white border-b border-slate-200 h-14 sticky top-0 z-50">

      {/* Logo */}
      <Link to="/" className="text-indigo-600 font-bold text-base tracking-tight mr-3">
        🏸 Pickerbal
      </Link>

      {/* Nav links */}
      <div className="flex items-center gap-0.5">
        {navLink("/", "Trang chủ")}
        {navLink("/courts", "Sân")}
        {navLink("/news", "Tin tức")}
        {user && navLink("/review", "Đánh giá")}
        {isAdmin() && navLink("/admin", "Admin")}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right side */}
      {user ? (
        <div className="flex items-center gap-2">
          {/* Notification bell */}
          <NotificationBell />

          <div className="w-px h-5 bg-slate-200" />

          {/* User */}
          <Link
            to="/profile"
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <div className="w-6 h-6 rounded-md bg-indigo-600 text-white text-xs font-semibold flex items-center justify-center">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <span>{user.name}</span>
          </Link>

          {/* Logout */}
          <button
            onClick={logout}
            className="px-3 py-1.5 text-sm text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Đăng xuất
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="px-3.5 py-1.5 text-sm text-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors font-medium"
          >
            Đăng nhập
          </Link>
          <Link
            to="/register"
            className="px-3.5 py-1.5 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Đăng ký
          </Link>
        </div>
      )}
    </nav>
  );
}