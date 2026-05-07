import { Link, useNavigate, useLocation } from "react-router-dom";
import { clearAuth, getUser, isSuperAdmin } from "../utils/auth";

const NAV_ITEMS = [
  { to: "/admin",          label: "Dashboard" },
  { to: "/admin/courts",   label: "Courts"    },
  { to: "/admin/slots",    label: "Slots"     },
  { to: "/admin/bookings", label: "Bookings"  },
  { to: "/admin/payments", label: "Payments"  },
  { to: "/admin/news",     label: "News"      },
  { to: "/admin/users",    label: "Users", superAdminOnly: true },
];

function getInitials(name) {
  if (!name) return "A";
  return name.split(" ").slice(-2).map(w => w[0]).join("").toUpperCase();
}

export default function AdminLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user     = getUser();

  const logout = () => {
    clearAuth();
    navigate("/");
  };

  return (
    <div className="flex min-h-screen">

      {/* ── SIDEBAR ── */}
      <aside className="w-[220px] min-h-screen bg-[#0f1117] flex flex-col shrink-0 border-r border-[#1e2130]">

        {/* Logo */}
        <div className="px-5 py-6 border-b border-[#1e2130]">
          <span className="text-xs font-bold tracking-[2px] text-white uppercase">
            Admin Panel
          </span>
        </div>

        {/* User info */}
        <div className="px-4 py-4 border-b border-[#1e2130]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-content-center shrink-0 text-white text-sm font-bold flex items-center justify-center">
              {getInitials(user?.name)}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-100 truncate">
                {user?.name}
              </div>
              <div className="text-[11px] text-slate-500 uppercase tracking-wide mt-0.5">
                {user?.role}
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 flex flex-col gap-0.5">
          <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-2 pt-1 pb-2">
            Menu
          </div>

          {NAV_ITEMS
            .filter(item => !item.superAdminOnly || isSuperAdmin())
            .map(({ to, label }) => {
              const active = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`
                    flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium
                    transition-all duration-150 no-underline
                    ${active
                      ? "bg-indigo-950 text-indigo-300 font-semibold"
                      : "text-slate-500 hover:bg-[#1a1d2e] hover:text-slate-200"
                    }
                  `}
                >
                  <span className={`
                    w-1.5 h-1.5 rounded-full shrink-0 transition-colors
                    ${active ? "bg-indigo-400" : "bg-slate-700"}
                  `} />
                  {label}
                </Link>
              );
            })
          }
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-[#1e2130]">
          <button
            onClick={logout}
            className="
              w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg
              text-sm font-medium text-slate-500
              border border-[#1e2130] bg-transparent
              hover:bg-red-950 hover:text-red-400 hover:border-red-900
              transition-all duration-150 cursor-pointer font-[inherit]
              text-left
            "
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Đăng xuất
          </button>
        </div>

      </aside>

      {/* ── CONTENT ── */}
      <main className="flex-1 bg-[#f6f7fb] min-h-screen overflow-y-auto">
        {children}
      </main>

    </div>
  );
}