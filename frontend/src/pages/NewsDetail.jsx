import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";

export default function NewsDetail() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const [news,    setNews]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await API.get(`/news/${id}`);
        setNews(res.data);
      } catch {
        setError("Không tìm thấy bài viết");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}>Đang tải...</div>;
  if (error)   return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <p style={{ color: "#e74c3c" }}>⚠️ {error}</p>
      <button onClick={() => navigate("/news")}>← Quay lại</button>
    </div>
  );

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 20 }}>
      <button
        onClick={() => navigate("/news")}
        style={{
          background: "none", border: "none",
          color: "#3498db", cursor: "pointer",
          fontSize: 14, marginBottom: 16, padding: 0,
        }}
      >
        ← Quay lại tin tức
      </button>

      {/* Thumbnail */}
      {news.thumbnail && (
        <img
          src={news.thumbnail}
          alt={news.title}
          style={{ width: "100%", borderRadius: 10, marginBottom: 20, maxHeight: 400, objectFit: "cover" }}
        />
      )}

      {/* Category */}
      {news.category_name && (
        <span style={{
          fontSize: 12, fontWeight: 600, color: "#3498db",
          background: "#eaf4fb", padding: "2px 10px",
          borderRadius: 20, marginBottom: 12, display: "inline-block",
        }}>
          {news.category_name}
        </span>
      )}

      {/* Title */}
      <h1 style={{ fontSize: 24, margin: "12px 0 10px" }}>{news.title}</h1>

      {/* Meta */}
      <div style={{ fontSize: 13, color: "#aaa", display: "flex", gap: 16, marginBottom: 20 }}>
        <span>✍️ {news.author_name}</span>
        <span>👁 {news.views} lượt xem</span>
        <span>📅 {new Date(news.published_at || news.created_at).toLocaleDateString("vi-VN")}</span>
      </div>

      {/* Summary */}
      {news.summary && (
        <p style={{
          fontSize: 15, color: "#555", fontStyle: "italic",
          borderLeft: "4px solid #3498db", paddingLeft: 16,
          marginBottom: 20,
        }}>
          {news.summary}
        </p>
      )}

      {/* Content */}
      <div
        style={{ fontSize: 15, lineHeight: 1.8, color: "#333" }}
        dangerouslySetInnerHTML={{ __html: news.content }}
      />
    </div>
  );
}