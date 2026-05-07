import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { getUser } from "../utils/auth";

// ─── Fade animation hook ──────────────────────────────────────────────────────
function useFadeIn() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("opacity-100", "translate-y-0");
          el.classList.remove("opacity-0", "translate-y-6");
          obs.disconnect();
        }
      },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

function FadeSection({ children, className = "" }) {
  const ref = useFadeIn();
  return (
    <div ref={ref} className={`opacity-0 translate-y-6 transition-all duration-700 ease-out ${className}`}>
      {children}
    </div>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────
const FEATURES = [
  { n: "01", icon: "⚡", title: "Xác nhận tức thì",   desc: "Chọn giờ, thanh toán, nhận xác nhận trong 30 giây. Không cần gọi điện."         },
  { n: "02", icon: "🏟️", title: "Nhiều sân chất lượng", desc: "Sân Pickleball đạt chuẩn, đầy đủ tiện nghi, phù hợp mọi cấp độ người chơi."  },
  { n: "03", icon: "⭐", title: "Đánh giá thật",       desc: "Hàng nghìn đánh giá từ người chơi thực tế giúp bạn chọn đúng sân."              },
];

const STATS = [
  { val: "100%", label: "Xác nhận tức thì" },
  { val: "30s",  label: "Thời gian đặt sân" },
  { val: "5⭐",  label: "Đánh giá trung bình" },
];

// ─── CourtCard ────────────────────────────────────────────────────────────────
function CourtCard({ court, onClick }) {
  const ACCENTS = [
    "from-emerald-400 to-teal-300",
    "from-sky-400 to-blue-300",
    "from-violet-400 to-purple-300",
    "from-amber-400 to-orange-300",
  ];
  const accent = ACCENTS[court.id % ACCENTS.length];

  return (
    <div
      onClick={onClick}
      className="bg-white border border-stone-100 rounded-2xl overflow-hidden cursor-pointer hover:shadow-xl hover:shadow-stone-100 hover:-translate-y-1 transition-all duration-200 group"
    >
      <div className={`h-36 bg-gradient-to-br ${accent} flex items-center justify-center text-5xl`}>
        🏟️
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-1">
          {court.surface_type && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
              {court.surface_type}
            </span>
          )}
          {court.avg_rating > 0 && (
            <span className="text-xs text-amber-500 font-semibold">⭐ {court.avg_rating}</span>
          )}
        </div>
        <div className="font-bold text-stone-900 text-sm mt-2 group-hover:text-emerald-600 transition-colors line-clamp-1">
          {court.name}
        </div>
        <div className="text-xs text-stone-400 mt-0.5 line-clamp-1">📍 {court.location}</div>
        <div className="text-xs font-semibold text-emerald-600 mt-2">
          {Number(court.price).toLocaleString("vi-VN")}đ/giờ
        </div>
      </div>
    </div>
  );
}

// ─── NewsCard ─────────────────────────────────────────────────────────────────
function NewsCard({ n, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-white border border-stone-100 rounded-2xl overflow-hidden cursor-pointer hover:shadow-xl hover:shadow-stone-100 hover:-translate-y-1 transition-all duration-200"
    >
      {n.thumbnail ? (
        <img src={n.thumbnail} alt={n.title} className="h-36 w-full object-cover" />
      ) : (
        <div className="h-36 bg-gradient-to-br from-emerald-400 to-teal-300 relative">
          <span className="absolute bottom-3 left-4 text-xs font-semibold text-white/90">
            {new Date(n.created_at).toLocaleDateString("vi-VN", { day: "2-digit", month: "short", year: "numeric" })}
          </span>
        </div>
      )}
      <div className="p-4">
        {n.category_name && (
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            {n.category_name}
          </span>
        )}
        <p className="font-semibold text-stone-800 text-sm leading-snug line-clamp-2 mt-2">{n.title}</p>
        {n.summary && (
          <p className="text-xs text-stone-400 mt-1 line-clamp-2">{n.summary}</p>
        )}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function UserHome() {
  const navigate  = useNavigate();
  const user      = getUser();
  const [courts,  setCourts]  = useState([]);
  const [news,    setNews]    = useState([]);

  const loadCourts = useCallback(async () => {
    try {
      const res = await API.get("/courts?status=active");
      setCourts(res.data.slice(0, 4));
    } catch {}
  }, []);

  const loadNews = useCallback(async () => {
    try {
      const res = await API.get("/news");
      setNews(res.data.slice(0, 4));
    } catch {}
  }, []);

  useEffect(() => { loadCourts(); loadNews(); }, [loadCourts, loadNews]);

  return (
    <div className="bg-white min-h-screen text-stone-800 font-sans antialiased">

      {/* ── Hero ── */}
      <section className="w-full relative overflow-hidden bg-gradient-to-b from-emerald-50 via-white to-white border-b border-stone-100">

        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-100/60 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-100/40 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        <div className="max-w-5xl mx-auto px-6 py-20 md:py-28 relative z-10">

          {/* Badge */}
          {user ? (
            <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium px-4 py-2 rounded-full mb-8">
              <span className="w-2 h-2 bg-emerald-500 rounded-full" />
              Chào mừng trở lại, <strong>{user.name}</strong>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold tracking-wider uppercase px-4 py-2 rounded-full mb-8">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              Đặt sân trực tuyến · Đà Nẵng
            </div>
          )}

          {/* Heading */}
          <h1
            className="font-black text-stone-900 leading-[1.05] tracking-tight mb-6"
            style={{ fontSize: "clamp(40px, 6vw, 76px)" }}
          >
            Đặt sân Pickleball<br />
            <span className="text-emerald-500">nhanh &amp; dễ dàng</span>
          </h1>

          <p className="text-stone-500 text-lg leading-relaxed mb-10 max-w-xl">
            Chọn sân, chọn giờ, thanh toán online. Xác nhận trong 30 giây — không cần gọi điện.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3 mb-16">
            <button
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm px-7 py-3.5 rounded-xl transition-colors shadow-md shadow-emerald-200"
              onClick={() => navigate("/courts")}
            >
              Xem tất cả sân →
            </button>
            {!user && (
              <button
                className="bg-white border border-stone-200 hover:border-stone-300 text-stone-700 font-medium text-sm px-6 py-3.5 rounded-xl hover:bg-stone-50 transition-colors"
                onClick={() => navigate("/register")}
              >
                Đăng ký miễn phí
              </button>
            )}
            {user && (
              <button
                className="bg-white border border-stone-200 hover:border-emerald-300 text-stone-700 font-medium text-sm px-6 py-3.5 rounded-xl hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                onClick={() => navigate("/review")}
              >
                ⭐ Đánh giá sân
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-10">
            {STATS.map(({ val, label }) => (
              <div key={label}>
                <div className="font-black text-stone-900 text-3xl leading-none tracking-tight">{val}</div>
                <div className="text-stone-400 text-sm mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <FadeSection>
        <section className="max-w-5xl mx-auto px-6 py-20 md:py-24">
          <div className="mb-12">
            <span className="text-emerald-500 text-xs font-bold tracking-widest uppercase">Tại sao chọn chúng tôi</span>
            <h2
              className="font-black text-stone-900 mt-2 leading-tight"
              style={{ fontSize: "clamp(28px, 3.5vw, 42px)" }}
            >
              Đặt sân chưa bao giờ<br />dễ đến vậy
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {FEATURES.map(({ n, icon, title, desc }) => (
              <div
                key={n}
                className="group bg-white border border-stone-100 rounded-2xl p-7 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-50 hover:-translate-y-1 transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-5">
                  <span className="text-2xl">{icon}</span>
                  <span className="text-xs font-bold text-stone-200 tracking-widest">{n}</span>
                </div>
                <div className="font-bold text-stone-900 text-base mb-2 group-hover:text-emerald-600 transition-colors">{title}</div>
                <div className="text-stone-400 text-sm leading-relaxed">{desc}</div>
              </div>
            ))}
          </div>
        </section>
      </FadeSection>

      {/* ── Courts từ API ── */}
      {courts.length > 0 && (
        <FadeSection>
          <section className="bg-stone-50 border-y border-stone-100">
            <div className="max-w-5xl mx-auto px-6 py-20 md:py-24">
              <div className="flex items-end justify-between mb-12 gap-4">
                <div>
                  <span className="text-emerald-500 text-xs font-bold tracking-widest uppercase">Sân nổi bật</span>
                  <h2
                    className="font-black text-stone-900 mt-2 leading-tight"
                    style={{ fontSize: "clamp(28px, 3.5vw, 42px)" }}
                  >
                    Sân đang hoạt động
                  </h2>
                </div>
                <button
                  onClick={() => navigate("/courts")}
                  className="text-emerald-500 text-sm font-semibold hover:text-emerald-600 transition-colors whitespace-nowrap shrink-0"
                >
                  Xem tất cả →
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {courts.map(c => (
                  <CourtCard
                    key={c.id}
                    court={c}
                    onClick={() => navigate(`/courts/${c.id}`)}
                  />
                ))}
              </div>
            </div>
          </section>
        </FadeSection>
      )}

      {/* ── About ── */}
      <FadeSection>
        <section className="max-w-5xl mx-auto px-6 py-20 md:py-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-emerald-500 text-xs font-bold tracking-widest uppercase">Về chúng tôi</span>
              <h2
                className="font-black text-stone-900 mt-2 mb-5 leading-tight"
                style={{ fontSize: "clamp(28px, 3.5vw, 44px)" }}
              >
                Hệ thống đặt sân<br />
                <span className="text-emerald-500">Pickleball Đà Nẵng</span>
              </h2>
              <p className="text-stone-500 text-sm leading-relaxed mb-4">
                Kết nối người chơi với các sân Pickleball chất lượng cao. Trải nghiệm đặt sân đơn giản, nhanh chóng và minh bạch.
              </p>
              <p className="text-stone-500 text-sm leading-relaxed">
                Thanh toán online an toàn, xác nhận tức thì — không cần gọi điện hay chờ đợi.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { bg: "bg-emerald-500 text-white",                    label: "Sân tiêu chuẩn",  sub: "Mặt sân cứng, lưới chính quy"    },
                { bg: "bg-amber-400 text-amber-900",                   label: "Ánh sáng đêm",   sub: "Chơi đến 22:00"                  },
                { bg: "bg-white border border-stone-200 text-stone-800", label: "Thanh toán online", sub: "MoMo, Banking, VNPay"          },
                { bg: "bg-sky-50 border border-sky-100 text-sky-900",  label: "Đánh giá thật",  sub: "Từ người chơi thực tế"           },
              ].map(({ bg, label, sub }) => (
                <div key={label} className={`${bg} rounded-2xl p-5`}>
                  <div className="font-bold text-sm mb-1">{label}</div>
                  <div className="text-xs opacity-60 leading-snug">{sub}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </FadeSection>

      {/* ── News từ API ── */}
      {news.length > 0 && (
        <FadeSection>
          <section className="bg-stone-50 border-y border-stone-100">
            <div className="max-w-5xl mx-auto px-6 py-20 md:py-24">
              <div className="flex items-end justify-between mb-12 gap-4">
                <div>
                  <span className="text-emerald-500 text-xs font-bold tracking-widest uppercase">Tin tức</span>
                  <h2
                    className="font-black text-stone-900 mt-2 leading-tight"
                    style={{ fontSize: "clamp(28px, 3.5vw, 42px)" }}
                  >
                    Cập nhật mới nhất
                  </h2>
                </div>
                <button
                  onClick={() => navigate("/news")}
                  className="text-emerald-500 text-sm font-semibold hover:text-emerald-600 transition-colors whitespace-nowrap shrink-0"
                >
                  Xem tất cả →
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {news.map(n => (
                  <NewsCard
                    key={n.id}
                    n={n}
                    onClick={() => navigate(`/news/${n.slug || n.id}`)}
                  />
                ))}
              </div>
            </div>
          </section>
        </FadeSection>
      )}

      {/* ── CTA ── */}
      <FadeSection>
        <section className="max-w-5xl mx-auto px-6 py-20 md:py-24">
          <div className="relative overflow-hidden bg-emerald-500 rounded-3xl p-12 md:p-16 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-10">

            <div className="absolute right-4 bottom-0 font-black text-white/[0.06] leading-none select-none pointer-events-none" style={{ fontSize: 140 }}>
              PLAY
            </div>
            <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/10 rounded-full pointer-events-none" />

            <div className="relative z-10">
              <h2
                className="font-black text-white leading-tight mb-3"
                style={{ fontSize: "clamp(36px, 5vw, 58px)" }}
              >
                Sẵn sàng<br />chưa?
              </h2>
              <p className="text-white/70 text-sm max-w-xs">
                Đặt sân chỉ mất 30 giây. Không cần gọi điện, không cần chờ xác nhận.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 relative z-10">
              <button
                className="bg-white text-emerald-600 font-bold text-sm px-7 py-3.5 rounded-xl hover:bg-emerald-50 transition-colors shadow-md"
                onClick={() => navigate("/courts")}
              >
                Xem sân ngay →
              </button>
              {!user && (
                <button
                  className="bg-white/15 border border-white/30 text-white font-medium text-sm px-6 py-3.5 rounded-xl hover:bg-white/25 transition-colors"
                  onClick={() => navigate("/register")}
                >
                  Đăng ký miễn phí
                </button>
              )}
              {user && (
                <button
                  className="bg-white/15 border border-white/30 text-white font-medium text-sm px-6 py-3.5 rounded-xl hover:bg-white/25 transition-colors"
                  onClick={() => navigate("/booking")}
                >
                  Đặt sân ngay
                </button>
              )}
            </div>
          </div>
        </section>
      </FadeSection>

    </div>
  );
}