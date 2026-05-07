import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-stone-900 text-stone-400 mt-auto">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 mb-10">

          {/* Brand */}
          <div>
            <div className="font-black text-white text-xl mb-3">🏸 Pickleball</div>
            <p className="text-sm leading-relaxed text-stone-500">
              Hệ thống đặt sân Pickleball trực tuyến. Nhanh chóng, tiện lợi, an toàn.
            </p>
          </div>

          {/* Links */}
          <div>
            <div className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-4">Khám phá</div>
            <div className="flex flex-col gap-2.5">
              {[
                { to: "/courts", label: "Danh sách sân" },
                { to: "/news",   label: "Tin tức"       },
                { to: "/review", label: "Đánh giá"      },
              ].map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className="text-sm text-stone-400 hover:text-emerald-400 transition-colors"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <div className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-4">Liên hệ</div>
            <div className="flex flex-col gap-2.5 text-sm text-stone-500">
              <span>📍 Đà Nẵng, Việt Nam</span>
              <span>📧 support@pickleball.vn</span>
              <span>📞 0901 234 567</span>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-stone-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-stone-600">
            © {new Date().getFullYear()} Pickleball Đà Nẵng. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link to="/login"    className="text-xs text-stone-600 hover:text-emerald-400 transition-colors">Đăng nhập</Link>
            <Link to="/register" className="text-xs text-stone-600 hover:text-emerald-400 transition-colors">Đăng ký</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}