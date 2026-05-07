import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

export default function News() {
  const [news,       setNews]       = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState("");
  const [search,     setSearch]     = useState("");
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const navigate = useNavigate();

  const loadNews = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const url = categoryId ? `/news?category_id=${categoryId}` : "/news";
      const res = await API.get(url);
      setNews(res.data);
    } catch {
      setError("Không thể tải tin tức");
    } finally {
      setLoading(false);
    }
  }, [categoryId]);

  const loadCategories = useCallback(async () => {
    try {
      const res = await API.get("/news/categories");
      setCategories(res.data);
    } catch {}
  }, []);

  useEffect(() => { loadNews();       }, [loadNews]);
  useEffect(() => { loadCategories(); }, [loadCategories]);

  const filtered = news.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 20 }}>
      <h2>📰 Tin tức Pickleball</h2>

      {/* Filter */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="🔍 Tìm kiếm bài viết..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1, minWidth: 200, padding: "8px 12px",
            borderRadius: 6, border: "1px solid #ccc", fontSize: 14,
          }}
        />
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          style={{ padding: "8px", borderRadius: 6, border: "1px solid #ccc" }}
        >
          <option value="">Tất cả danh mục</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {error   && <p style={{ color: "#e74c3c" }}>⚠️ {error}</p>}
      {loading && <p>Đang tải...</p>}

      {!loading && filtered.length === 0 && (
        <p style={{ color: "#888" }}>Không có bài viết nào</p>
      )}

      {/* List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {filtered.map(n => (
          <div
            key={n.id}
            onClick={() => navigate(`/news/${n.slug || n.id}`)}
            style={{
              background: "#fff", borderRadius: 10,
              border: "1px solid #ddd", overflow: "hidden",
              cursor: "pointer", display: "flex", gap: 0,
            }}
          >
            {/* Thumbnail */}
            {n.thumbnail ? (
              <img
                src={n.thumbnail}
                alt={n.title}
                style={{ width: 180, objectFit: "cover", flexShrink: 0 }}
              />
            ) : (
              <div style={{
                width: 180, background: "#f0f0f0", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 40,
              }}>
                📰
              </div>
            )}

            {/* Content */}
            <div style={{ padding: 16, flex: 1 }}>
              {n.category_name && (
                <span style={{
                  fontSize: 11, fontWeight: 600, color: "#3498db",
                  background: "#eaf4fb", padding: "2px 8px",
                  borderRadius: 20, marginBottom: 8, display: "inline-block",
                }}>
                  {n.category_name}
                </span>
              )}
              <h3 style={{ margin: "6px 0 8px", fontSize: 16 }}>{n.title}</h3>
              {n.summary && (
                <p style={{ color: "#666", fontSize: 13, margin: "0 0 10px" }}>
                  {n.summary}
                </p>
              )}
              <div style={{ fontSize: 12, color: "#aaa", display: "flex", gap: 12 }}>
                <span>✍️ {n.author_name}</span>
                <span>👁 {n.views} lượt xem</span>
                <span>📅 {new Date(n.created_at).toLocaleDateString("vi-VN")}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}