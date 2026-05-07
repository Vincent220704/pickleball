import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate }           from "react-router-dom";
import API                                  from "../services/api";
import { isLoggedIn }                       from "../utils/auth";

// ─── Star Display ─────────────────────────────────────────────────────────────
function StarDisplay({ value, size = "text-lg" }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <span key={s} className={`${size} ${s <= value ? "text-amber-400" : "text-stone-200"}`}>★</span>
      ))}
    </span>
  );
}

// ─── Rating Bar ───────────────────────────────────────────────────────────────
function RatingBar({ star, count, total }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-stone-400 w-4">{star}</span>
      <span className="text-amber-400 text-xs">★</span>
      <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
        <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-stone-400 w-6 text-right">{count}</span>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function CourtDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [court,     setCourt]     = useState(null);
  const [reviews,   setReviews]   = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");

  const loadCourt = useCallback(async () => {
    try {
      const res = await API.get(`/courts/${id}`);
      setCourt(res.data);
    } catch {
      setError("Không tìm thấy sân");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadReviews = useCallback(async () => {
    try {
      const res = await API.get(`/reviews?court_id=${id}`);
      setReviews(res.data.reviews);
      setAvgRating(res.data.avg_rating);
    } catch {}
  }, [id]);

  useEffect(() => { loadCourt(); loadReviews(); }, [loadCourt, loadReviews]);

  // ── Rating breakdown ──────────────────────────────────────────────────────
  const ratingBreakdown = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
  }));

  const handleBook = () => {
    if (!isLoggedIn()) {
      navigate("/login", {
        state: {
          from:    { pathname: `/booking/${court.id}` },
          message: "Vui lòng đăng nhập để đặt sân",
        },
      });
    } else {
      navigate(`/booking/${court.id}`);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="flex items-center gap-2 text-stone-400 text-sm">
        <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
        Đang tải thông tin sân...
      </div>
    </div>
  );

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-stone-50">
      <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center text-3xl">🏟️</div>
      <p className="font-semibold text-stone-600">{error}</p>
      <button
        onClick={() => navigate("/courts")}
        className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
      >
        ← Quay lại danh sách sân
      </button>
    </div>
  );

  const images = (() => {
    try { return JSON.parse(court.images) || []; }
    catch { return []; }
  })();

  return (
    <div className="min-h-screen bg-stone-50">

      {/* ── Hero image / banner ── */}
      <div className="w-full h-64 md:h-80 relative overflow-hidden">
        {images[0] ? (
          <img src={images[0]} alt={court.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-teal-300 flex items-center justify-center text-8xl">
            🏟️
          </div>
        )}
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

        {/* Back button */}
        <button
          onClick={() => navigate("/courts")}
          className="absolute top-4 left-4 flex items-center gap-2 bg-white/90 backdrop-blur-sm text-stone-700 font-semibold text-sm px-4 py-2 rounded-xl hover:bg-white transition-all shadow-sm"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Danh sách sân
        </button>

        {/* Price badge */}
        <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2 text-right shadow-sm">
          <div className="font-black text-emerald-600 text-xl leading-none">
            {Number(court.price).toLocaleString("vi-VN")}đ
          </div>
          <div className="text-xs text-stone-400 mt-0.5">/ giờ</div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left: Main info ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Court name + status */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h1 className="font-black text-stone-900 text-2xl leading-tight mb-2">{court.name}</h1>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Đang hoạt động
                  </span>
                </div>

                {/* Rating summary */}
                {avgRating > 0 && (
                  <div className="text-center shrink-0">
                    <div className="font-black text-3xl text-stone-900">{avgRating}</div>
                    <StarDisplay value={Math.round(avgRating)} size="text-sm" />
                    <div className="text-xs text-stone-400 mt-1">{reviews.length} đánh giá</div>
                  </div>
                )}
              </div>

              {/* Info chips */}
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-50 border border-stone-100 text-sm text-stone-600">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                  {court.location}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-50 border border-stone-100 text-sm text-stone-600">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                  {court.open_time?.slice(0, 5)} – {court.close_time?.slice(0, 5)}
                </span>
                {court.surface_type && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-100 text-sm text-emerald-700 font-medium">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>
                    </svg>
                    {court.surface_type}
                  </span>
                )}
              </div>

              {/* Description */}
              {court.description && (
                <div className="mt-4 pt-4 border-t border-stone-100">
                  <p className="text-sm text-stone-500 leading-relaxed">{court.description}</p>
                </div>
              )}
            </div>

            {/* ── Reviews ── */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6">
              <h2 className="font-black text-stone-900 text-lg mb-5">
                Đánh giá
                {reviews.length > 0 && (
                  <span className="ml-2 text-sm font-semibold text-stone-400">({reviews.length})</span>
                )}
              </h2>

              {/* Rating breakdown */}
              {reviews.length > 0 && (
                <div className="flex gap-6 mb-6 pb-6 border-b border-stone-100">
                  <div className="text-center">
                    <div className="font-black text-5xl text-stone-900 leading-none">{avgRating}</div>
                    <StarDisplay value={Math.round(avgRating)} size="text-base" />
                    <div className="text-xs text-stone-400 mt-1">{reviews.length} đánh giá</div>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    {ratingBreakdown.map(({ star, count }) => (
                      <RatingBar key={star} star={star} count={count} total={reviews.length} />
                    ))}
                  </div>
                </div>
              )}

              {/* Review list */}
              {reviews.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-center">
                  <div className="text-4xl mb-3">⭐</div>
                  <p className="font-semibold text-stone-500">Chưa có đánh giá nào</p>
                  <p className="text-sm text-stone-400 mt-1">Hãy là người đầu tiên đánh giá sân này</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map(r => (
                    <div key={r.id} className="flex gap-3">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-base shrink-0">
                        {r.user_name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div>
                            <span className="font-bold text-stone-900 text-sm">{r.user_name}</span>
                            <StarDisplay value={r.rating} size="text-sm" />
                          </div>
                          <span className="text-xs text-stone-400 shrink-0">
                            {new Date(r.created_at).toLocaleDateString("vi-VN")}
                          </span>
                        </div>
                        {r.comment && (
                          <p className="text-sm text-stone-500 leading-relaxed bg-stone-50 rounded-xl px-3 py-2 mt-1">
                            {r.comment}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Right: Sticky booking card ── */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
              <div className="mb-4">
                <div className="font-black text-emerald-600 text-3xl leading-none">
                  {Number(court.price).toLocaleString("vi-VN")}đ
                </div>
                <div className="text-sm text-stone-400 mt-0.5">mỗi giờ thuê sân</div>
              </div>

              {/* Court summary */}
              <div className="space-y-3 mb-5 pb-5 border-b border-stone-100">
                {[
                  { icon: "📍", label: court.location },
                  { icon: "⏰", label: `${court.open_time?.slice(0,5)} – ${court.close_time?.slice(0,5)}` },
                  ...(court.surface_type ? [{ icon: "🏸", label: court.surface_type }] : []),
                  ...(avgRating > 0    ? [{ icon: "⭐", label: `${avgRating}/5 (${reviews.length} đánh giá)` }] : []),
                ].map(({ icon, label }) => (
                  <div key={label} className="flex items-center gap-2 text-sm text-stone-500">
                    <span className="text-base">{icon}</span>
                    <span className="line-clamp-1">{label}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <button
                onClick={handleBook}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-base py-3.5 rounded-xl transition-colors shadow-md shadow-emerald-200 active:scale-[.98]"
              >
                Đặt sân ngay
              </button>

              {!isLoggedIn() && (
                <p className="text-xs text-stone-400 text-center mt-3">
                  Cần{" "}
                  <button
                    onClick={() => navigate("/login")}
                    className="text-emerald-600 font-semibold hover:underline"
                  >
                    đăng nhập
                  </button>
                  {" "}để đặt sân
                </p>
              )}

              {/* Share / Back */}
              <button
                onClick={() => navigate("/courts")}
                className="w-full mt-3 h-10 rounded-xl text-sm font-semibold text-stone-500 bg-stone-50 border border-stone-200 hover:bg-stone-100 transition-all"
              >
                ← Xem sân khác
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}