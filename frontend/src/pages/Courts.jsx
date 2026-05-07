import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

const STATUS = {
  active:      { label: "Hoạt động", dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  inactive:    { label: "Tạm ngưng", dot: "bg-amber-400",   text: "text-amber-700",   bg: "bg-amber-50 border-amber-200"   },
  maintenance: { label: "Bảo trì",   dot: "bg-rose-500",    text: "text-rose-700",    bg: "bg-rose-50 border-rose-200"     },
};

const SORT_OPTIONS = [
  { value: "default",    label: "Mặc định"      },
  { value: "price_asc",  label: "Giá thấp nhất" },
  { value: "price_desc", label: "Giá cao nhất"  },
  { value: "rating",     label: "Đánh giá cao"  },
];

export default function Courts() {
  const [courts,  setCourts]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [search,  setSearch]  = useState("");
  const [area,    setArea]    = useState("all");
  const [sort,    setSort]    = useState("default");
  const navigate = useNavigate();

  const fetchCourts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await API.get("/courts?status=active");
      setCourts(res.data);
    } catch {
      setError("Không thể tải danh sách sân");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCourts(); }, [fetchCourts]);

  // ── Lấy danh sách khu vực từ data thật ───────────────────────────────────
  const areas = ["all", ...new Set(
    courts
      .map(c => c.location?.split(",").pop()?.trim())
      .filter(Boolean)
  )];

  // ── Filter + Sort ─────────────────────────────────────────────────────────
  let filtered = courts.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
                        c.location.toLowerCase().includes(search.toLowerCase());
    const matchArea   = area === "all" || c.location?.includes(area);
    return matchSearch && matchArea;
  });

  if (sort === "price_asc")  filtered = [...filtered].sort((a, b) => a.price - b.price);
  if (sort === "price_desc") filtered = [...filtered].sort((a, b) => b.price - a.price);
  if (sort === "rating")     filtered = [...filtered].sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));

  const ACCENTS = [
    "from-emerald-400 to-teal-300",
    "from-sky-400 to-blue-300",
    "from-violet-400 to-purple-300",
    "from-amber-400 to-orange-300",
  ];

  return (
    <div className="min-h-screen bg-stone-50">

      {/* ── Header ── */}
      <div className="bg-white border-b border-stone-100">
        <div className="max-w-5xl mx-auto px-6 py-10">
          <span className="text-emerald-500 text-xs font-bold tracking-widest uppercase">Danh sách sân</span>
          <h1 className="font-black text-stone-900 text-3xl mt-1 mb-1">Sân Pickleball</h1>
          <p className="text-stone-400 text-sm">
            {courts.length > 0 ? `${courts.length} sân đang hoạt động` : "Đang tải..."}
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* ── Filters ── */}
        <div className="bg-white border border-stone-200 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row gap-3">

          {/* Search */}
          <div className="relative flex-1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Tìm theo tên hoặc địa chỉ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-3 text-sm text-stone-800 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/15 focus:border-emerald-400 hover:border-stone-300 transition-all placeholder:text-stone-300"
            />
          </div>

          {/* Area filter */}
          <div className="relative">
            <select
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="h-10 pl-3 pr-8 text-sm text-stone-700 bg-stone-50 border border-stone-200 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/15 focus:border-emerald-400 hover:border-stone-300 transition-all"
            >
              <option value="all">Tất cả khu vực</option>
              {areas.filter(a => a !== "all").map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>

          {/* Sort */}
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="h-10 pl-3 pr-8 text-sm text-stone-700 bg-stone-50 border border-stone-200 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/15 focus:border-emerald-400 hover:border-stone-300 transition-all"
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>

          {/* Reset */}
          {(search || area !== "all" || sort !== "default") && (
            <button
              onClick={() => { setSearch(""); setArea("all"); setSort("default"); }}
              className="h-10 px-4 text-sm font-semibold text-rose-500 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition-all whitespace-nowrap"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>

        {/* ── Result count ── */}
        {!loading && (
          <div className="flex items-center gap-2 mb-4">
            <p className="text-sm text-stone-400">
              Hiển thị <span className="font-semibold text-stone-700">{filtered.length}</span> sân
              {area !== "all" && <> tại <span className="font-semibold text-emerald-600">{area}</span></>}
            </p>
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="flex items-center gap-3 px-4 py-3 mb-5 rounded-xl text-sm font-medium border bg-rose-50 border-rose-200 text-rose-700">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        {/* ── Loading ── */}
        {loading && (
          <div className="flex items-center justify-center gap-2 text-sm text-stone-400 py-20">
            <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
            Đang tải danh sách sân...
          </div>
        )}

        {/* ── Empty ── */}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-stone-200 rounded-2xl bg-white">
            <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center mb-4 text-2xl">🏟️</div>
            <p className="font-semibold text-stone-500">Không tìm thấy sân nào</p>
            <p className="text-sm text-stone-400 mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          </div>
        )}

        {/* ── Court list ── */}
        <div className="flex flex-col gap-4">
          {filtered.map((c, idx) => {
            const s      = STATUS[c.status] || STATUS.active;
            const accent = ACCENTS[c.id % ACCENTS.length];

            return (
              <div
                key={c.id}
                className="bg-white border border-stone-200 rounded-2xl overflow-hidden hover:border-stone-300 hover:shadow-lg hover:shadow-stone-100 transition-all duration-200 group"
              >
                <div className="flex">
                  {/* Thumbnail */}
                  <div className={`w-40 shrink-0 bg-gradient-to-br ${accent} flex items-center justify-center text-5xl`}>
                    🏟️
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-5 flex justify-between gap-4">
                    <div className="min-w-0 flex-1">

                      {/* Name + Status */}
                      <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                        <h3 className="font-black text-stone-900 text-lg leading-tight group-hover:text-emerald-600 transition-colors">
                          {c.name}
                        </h3>
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${s.bg} ${s.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                          {s.label}
                        </span>
                      </div>

                      {/* Info chips */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-50 border border-stone-100 text-xs text-stone-500">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                          </svg>
                          {c.location}
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-50 border border-stone-100 text-xs text-stone-500">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                          </svg>
                          {c.open_time?.slice(0, 5)} – {c.close_time?.slice(0, 5)}
                        </span>
                        {c.surface_type && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-100 text-xs text-emerald-700 font-medium">
                            {c.surface_type}
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      {c.description && (
                        <p className="text-sm text-stone-400 line-clamp-2">{c.description}</p>
                      )}
                    </div>

                    {/* Right: price + rating + CTA */}
                    <div className="flex flex-col items-end justify-between shrink-0 min-w-[120px]">
                      <div className="text-right">
                        <div className="font-black text-emerald-600 text-xl leading-none">
                          {Number(c.price).toLocaleString("vi-VN")}đ
                        </div>
                        <div className="text-xs text-stone-400 mt-0.5">/ giờ</div>
                        {c.avg_rating > 0 && (
                          <div className="flex items-center gap-1 justify-end mt-2">
                            <span className="text-amber-400 text-sm">★</span>
                            <span className="text-sm font-semibold text-stone-700">{c.avg_rating}</span>
                            <span className="text-xs text-stone-400">({c.review_count})</span>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => navigate(`/courts/${c.id}`)}
                        className="mt-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-colors shadow-sm shadow-emerald-200 whitespace-nowrap"
                      >
                        Xem & Đặt sân
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}