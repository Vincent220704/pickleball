import { useEffect, useState, useCallback } from "react";
import API from "../services/api";

const STATUS = {
  success:  { bg: "#EAF3DE", text: "#3B6D11", dot: "#639922", label: "Thành công" },
  pending:  { bg: "#FAEEDA", text: "#854F0B", dot: "#BA7517", label: "Chờ xử lý"  },
  failed:   { bg: "#FCEBEB", text: "#A32D2D", dot: "#E24B4A", label: "Thất bại"   },
  refunded: { bg: "#F1EFE8", text: "#5F5E5A", dot: "#888780", label: "Hoàn tiền"  },
};

const METHOD = { momo: "MoMo", banking: "Banking", vnpay: "VNPay" };

const TABS = [
  { key: "all",      label: "Tất cả",     color: "#534AB7" },
  { key: "success",  label: "Thành công", color: "#3B6D11" },
  { key: "pending",  label: "Chờ xử lý", color: "#854F0B" },
  { key: "failed",   label: "Thất bại",  color: "#A32D2D" },
  { key: "refunded", label: "Hoàn tiền", color: "#5F5E5A" },
];

const PER_PAGE = 10;

function fmtDate(val) {
  if (!val) return "—";
  const d = new Date(val);
  if (isNaN(d)) return val;
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function fmtTime(val) {
  if (!val) return "";
  const d = new Date(val);
  if (isNaN(d)) return val;
  return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false });
}

// Cột cân bằng: khách hàng vừa đủ, các cột fixed width rõ ràng
const COL = "minmax(180px,1fr) 120px 160px 130px minmax(140px,1fr) 130px";

const css = `
  .ap * { box-sizing: border-box; margin: 0; padding: 0 }
  .ap {
    font-family: system-ui, -apple-system, sans-serif;
    padding: 28px 32px;
    background: #f6f7fb;
    min-height: 100vh;
    color: #0f172a;
  }

  .ap .ap-title {
    font-size: 20px;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: #0f172a;
    margin-bottom: 24px;
  }

  /* ── Tabs ── */
  .ap .ap-tabs {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 12px;
    margin-bottom: 20px;
  }
  .ap .ap-tab {
    background: #fff;
    border: 1px solid #e8edf3;
    border-radius: 14px;
    padding: 18px 20px;
    cursor: pointer;
    transition: all .15s;
  }
  .ap .ap-tab:hover { border-color: #a5b4fc; box-shadow: 0 2px 8px rgba(83,74,183,.08) }
  .ap .ap-tab.active {
    border: 2px solid #534AB7;
    background: #fafaff;
    box-shadow: 0 2px 12px rgba(83,74,183,.12);
  }
  .ap .ap-tab-label {
    font-size: 11px;
    color: #94a3b8;
    margin-bottom: 10px;
    text-transform: uppercase;
    letter-spacing: .7px;
    font-weight: 600;
  }
  .ap .ap-tab-value {
    font-size: 32px;
    font-weight: 700;
    line-height: 1;
    letter-spacing: -0.02em;
  }
  .ap .ap-tab-sub {
    font-size: 12px;
    color: #64748b;
    margin-top: 6px;
    font-weight: 500;
  }

  /* ── Search ── */
  .ap .ap-toolbar { display: flex; gap: 10px; margin-bottom: 16px }
  .ap .ap-search-wrap { position: relative; flex: 1 }
  .ap .ap-search-icon {
    position: absolute; left: 14px; top: 50%;
    transform: translateY(-50%);
    pointer-events: none; color: #94a3b8;
  }
  .ap .ap-search {
    width: 100%;
    padding: 12px 14px 12px 40px;
    border: 1px solid #e8edf3;
    border-radius: 10px;
    background: #fff;
    font-size: 14px;
    color: #0f172a;
    outline: none;
    transition: border-color .15s, box-shadow .15s;
    font-family: inherit;
  }
  .ap .ap-search:focus {
    border-color: #534AB7;
    box-shadow: 0 0 0 3px rgba(83,74,183,.1);
  }
  .ap .ap-search::placeholder { color: #c4cdd9; font-size: 14px }

  /* ── Card ── */
  .ap .ap-card {
    background: #fff;
    border: 1px solid #e8edf3;
    border-radius: 14px;
    overflow: hidden;
  }

  /* Header */
  .ap .ap-thead {
    display: grid;
    grid-template-columns: ${COL};
    padding: 0 8px;
    background: #f8fafc;
    border-bottom: 1px solid #eef2f7;
  }
  .ap .ap-th {
    padding: 13px 16px;
    font-size: 11px;
    font-weight: 700;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: .7px;
    white-space: nowrap;
  }
  .ap .ap-th.right { text-align: right }

  /* Row */
  .ap .ap-row {
    display: grid;
    grid-template-columns: ${COL};
    padding: 0 8px;
    border-bottom: 1px solid #f4f6f9;
    align-items: center;
    transition: background .12s;
    cursor: default;
  }
  .ap .ap-row:last-child { border-bottom: none }
  .ap .ap-row:hover { background: #f7f8ff }
  .ap .ap-cell { padding: 16px 16px; overflow: hidden; min-width: 0 }

  /* Cell content */
  .ap .ap-user {
    font-size: 15px;
    font-weight: 600;
    color: #0f172a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 4px;
  }
  .ap .ap-court {
    font-size: 13px;
    color: #64748b;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-weight: 400;
  }
  .ap .ap-method {
    font-size: 14px;
    color: #1e293b;
    font-weight: 500;
  }
  .ap .ap-date {
    font-size: 14px;
    color: #1e293b;
    font-weight: 600;
    white-space: nowrap;
    margin-bottom: 3px;
  }
  .ap .ap-time {
    font-size: 13px;
    color: #64748b;
    font-weight: 400;
  }
  .ap .ap-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 600;
    padding: 6px 12px;
    border-radius: 20px;
    white-space: nowrap;
  }
  .ap .ap-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0 }
  .ap .ap-tx {
    font-family: monospace;
    font-size: 13px;
    color: #64748b;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: block;
  }
  .ap .ap-amount {
    font-size: 15px;
    font-weight: 700;
    color: #534AB7;
    text-align: right;
    white-space: nowrap;
  }

  /* Footer */
  .ap .ap-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 20px;
    border-top: 1px solid #f4f6f9;
    background: #f8fafc;
  }
  .ap .ap-info { font-size: 13px; color: #64748b; font-weight: 500 }
  .ap .ap-pages { display: flex; gap: 5px }
  .ap .ap-pg {
    min-width: 34px;
    height: 34px;
    padding: 0 10px;
    font-size: 13px;
    border: 1px solid #e8edf3;
    border-radius: 8px;
    background: #fff;
    color: #475569;
    cursor: pointer;
    transition: all .12s;
    font-family: inherit;
    font-weight: 500;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .ap .ap-pg:hover:not(:disabled) { border-color: #a5b4fc; color: #534AB7; background: #f5f4ff }
  .ap .ap-pg.active { background: #534AB7; color: #fff; border-color: #534AB7; font-weight: 700 }
  .ap .ap-pg:disabled { opacity: .3; cursor: default }

  .ap .ap-empty { text-align: center; padding: 64px; font-size: 15px; color: #94a3b8 }
  .ap .ap-spinner {
    display: inline-block; width: 16px; height: 16px;
    border: 2px solid #e2e8f0; border-top-color: #534AB7;
    border-radius: 50%; animation: ap-spin .7s linear infinite;
    margin-right: 8px; vertical-align: middle;
  }
  @keyframes ap-spin { to { transform: rotate(360deg) } }

  /* ── Responsive ── */
  @media (max-width: 1024px) {
    .ap { padding: 20px }
    .ap .ap-tabs { grid-template-columns: repeat(3, 1fr) }
    .ap .ap-thead,
    .ap .ap-row {
      grid-template-columns: minmax(160px,1fr) 110px 150px 125px 130px;
    }
    .ap .ap-hide-md { display: none }
  }

  @media (max-width: 768px) {
    .ap { padding: 16px }
    .ap .ap-tabs { grid-template-columns: repeat(2, 1fr) }
    .ap .ap-tab-value { font-size: 26px }
    .ap .ap-thead { display: none }
    .ap .ap-row {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 16px;
      align-items: flex-start;
    }
    .ap .ap-cell { padding: 0; width: 100% }
    .ap .ap-hide-md { display: block }
    .ap .ap-amount { text-align: left; font-size: 16px }
    .ap .ap-mobile-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }
  }
`;

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [search,   setSearch]   = useState("");
  const [page,     setPage]     = useState(1);

  const loadPayments = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await API.get("/payments");
      setPayments(res.data);
    } catch {
      setError("Không thể tải danh sách thanh toán");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPayments(); }, [loadPayments]);

  const countOf = (key) =>
    key === "all" ? payments.length : payments.filter(p => p.status === key).length;

  const revenue = payments
    .filter(p => p.status === "success")
    .reduce((s, p) => s + Number(p.amount), 0);

  const filtered = payments
    .filter(p => activeTab === "all" || p.status === activeTab)
    .filter(p => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        p.user_name?.toLowerCase().includes(q) ||
        p.court_name?.toLowerCase().includes(q) ||
        p.transaction_id?.toLowerCase().includes(q)
      );
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage   = Math.min(page, totalPages);
  const slice      = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);
  const from       = filtered.length === 0 ? 0 : (safePage - 1) * PER_PAGE + 1;
  const to         = Math.min(safePage * PER_PAGE, filtered.length);

  const handleTab = (key) => { setActiveTab(key); setSearch(""); setPage(1); };
  const handleSearch = (q) => { setSearch(q); setPage(1); };
  const goPage = (p) => { if (p >= 1 && p <= totalPages) setPage(p); };

  return (
    <>
      <style>{css}</style>
      <div className="ap">

        <div className="ap-title">Quản lý thanh toán</div>

        <div className="ap-tabs">
          {TABS.map(({ key, label, color }) => (
            <div
              key={key}
              className={`ap-tab${activeTab === key ? " active" : ""}`}
              onClick={() => handleTab(key)}
            >
              <div className="ap-tab-label">{label}</div>
              <div className="ap-tab-value" style={{ color }}>{countOf(key)}</div>
              {key === "all" && (
                <div className="ap-tab-sub">{(revenue / 1_000_000).toFixed(1)}M ₫ doanh thu</div>
              )}
            </div>
          ))}
        </div>

        {error && <p style={{ color: "#A32D2D", marginBottom: 14, fontSize: 14 }}>{error}</p>}

        <div className="ap-toolbar">
          <div className="ap-search-wrap">
            <svg className="ap-search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input
              className="ap-search"
              placeholder="Tìm theo tên, sân, mã giao dịch..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="ap-card">
          {loading ? (
            <div className="ap-empty"><span className="ap-spinner" />Đang tải...</div>
          ) : (
            <>
              <div className="ap-thead">
                <div className="ap-th">Khách hàng / Sân</div>
                <div className="ap-th">Phương thức</div>
                <div className="ap-th">Lịch đặt</div>
                <div className="ap-th">Trạng thái</div>
                <div className="ap-th ap-hide-md">Mã giao dịch</div>
                <div className="ap-th right">Số tiền</div>
              </div>

              {slice.length === 0 ? (
                <div className="ap-empty">Không có giao dịch nào</div>
              ) : slice.map((p) => {
                const s = STATUS[p.status] || STATUS.refunded;
                return (
                  <div className="ap-row" key={p.id}>
                    <div className="ap-cell">
                      <div className="ap-user">{p.user_name}</div>
                      <div className="ap-court">{p.court_name}</div>
                    </div>
                    <div className="ap-cell">
                      <span className="ap-method">{METHOD[p.method] || p.method}</span>
                    </div>
                    <div className="ap-cell">
                      <div className="ap-date">{fmtDate(p.booking_date)}</div>
                      <div className="ap-time">{fmtTime(p.start_time)} – {fmtTime(p.end_time)}</div>
                    </div>
                    <div className="ap-cell">
                      <span className="ap-badge" style={{ background: s.bg, color: s.text }}>
                        <span className="ap-dot" style={{ background: s.dot }} />
                        {s.label}
                      </span>
                    </div>
                    <div className="ap-cell ap-hide-md">
                      <span className="ap-tx">{p.transaction_id}</span>
                    </div>
                    <div className="ap-cell">
                      <div className="ap-amount">{Number(p.amount).toLocaleString("vi-VN")}đ</div>
                    </div>
                  </div>
                );
              })}

              <div className="ap-footer">
                <div className="ap-info">
                  {filtered.length === 0
                    ? "Không có kết quả"
                    : `${from}–${to} / ${filtered.length} giao dịch`}
                </div>
                <div className="ap-pages">
                  <button className="ap-pg" onClick={() => goPage(safePage - 1)} disabled={safePage === 1}>‹</button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(i => (
                    <button
                      key={i}
                      className={`ap-pg${i === safePage ? " active" : ""}`}
                      onClick={() => goPage(i)}
                    >
                      {i}
                    </button>
                  ))}
                  <button className="ap-pg" onClick={() => goPage(safePage + 1)} disabled={safePage === totalPages}>›</button>
                </div>
              </div>
            </>
          )}
        </div>

      </div>
    </>
  );
}