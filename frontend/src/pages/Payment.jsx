import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";

const METHODS = [
  { key: "momo",    label: "MoMo",    emoji: "📱", color: "#ae2070", desc: "Ví điện tử MoMo"        },
  { key: "banking", label: "Banking", emoji: "🏦", color: "#1a73e8", desc: "Chuyển khoản ngân hàng" },
  { key: "vnpay",   label: "VNPay",   emoji: "💳", color: "#0063a3", desc: "Cổng thanh toán VNPay"  },
];

// ─── Màn hình giả lập theo từng phương thức ──────────────────────────────────
function MomoScreen({ amount, countdown }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{
        width: 160, height: 160, margin: "0 auto 16px",
        background: "#f0f0f0", borderRadius: 8,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 13, color: "#888", border: "2px dashed #ccc",
      }}>
        📱 QR Code MoMo
      </div>
      <p style={{ color: "#888", fontSize: 13, marginBottom: 8 }}>
        Mở app MoMo và quét mã QR để thanh toán
      </p>
      <p style={{ fontWeight: 700, fontSize: 18, color: "#ae2070" }}>
        {Number(amount).toLocaleString("vi-VN")}đ
      </p>
      <p style={{ color: "#888", fontSize: 13 }}>
        Tự động xác nhận sau <b style={{ color: "#e74c3c" }}>{countdown}s</b>
      </p>
    </div>
  );
}

function BankingScreen({ amount, countdown }) {
  return (
    <div>
      {[
        { label: "Ngân hàng",    value: "Vietcombank"          },
        { label: "Số tài khoản", value: "1234 5678 9012 3456"  },
        { label: "Chủ tài khoản",value: "PICKLEBALL BOOKING"   },
        { label: "Số tiền",      value: `${Number(amount).toLocaleString("vi-VN")}đ` },
        { label: "Nội dung",     value: `THANH TOAN BOOKING`   },
      ].map(({ label, value }) => (
        <div key={label} style={{
          display: "flex", justifyContent: "space-between",
          padding: "10px 0", borderBottom: "1px solid #f0f0f0",
          fontSize: 14,
        }}>
          <span style={{ color: "#888" }}>{label}</span>
          <span style={{ fontWeight: 600 }}>{value}</span>
        </div>
      ))}
      <p style={{ color: "#888", fontSize: 13, marginTop: 12, textAlign: "center" }}>
        Tự động xác nhận sau <b style={{ color: "#e74c3c" }}>{countdown}s</b>
      </p>
    </div>
  );
}

function VNPayScreen({ amount, countdown }) {
  return (
    <div>
      <p style={{ color: "#888", fontSize: 13, marginBottom: 12 }}>
        Nhập thông tin thẻ để thanh toán
      </p>
      {[
        { label: "Số thẻ",       placeholder: "1234 5678 9012 3456" },
        { label: "Tên chủ thẻ",  placeholder: "NGUYEN VAN A"        },
        { label: "Ngày hết hạn", placeholder: "MM/YY"               },
        { label: "CVV",          placeholder: "***"                  },
      ].map(({ label, placeholder }) => (
        <div key={label} style={{ marginBottom: 10 }}>
          <label style={{ display: "block", fontSize: 13, color: "#666", marginBottom: 4 }}>
            {label}
          </label>
          <input
            placeholder={placeholder}
            disabled
            style={{
              width: "100%", padding: "8px 10px",
              borderRadius: 6, border: "1px solid #ddd",
              background: "#f8f8f8", boxSizing: "border-box",
            }}
          />
        </div>
      ))}
      <p style={{ fontWeight: 700, fontSize: 16, color: "#0063a3", margin: "12px 0 4px" }}>
        Tổng: {Number(amount).toLocaleString("vi-VN")}đ
      </p>
      <p style={{ color: "#888", fontSize: 13 }}>
        Tự động xác nhận sau <b style={{ color: "#e74c3c" }}>{countdown}s</b>
      </p>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function Payment() {
  const { booking_id } = useParams();
  const navigate        = useNavigate();

  const [booking,   setBooking]   = useState(null);
  const [method,    setMethod]    = useState("");
  const [step,      setStep]      = useState("select"); // select | paying | processing | success | failed
  const [paymentId, setPaymentId] = useState(null);
  const [countdown, setCountdown] = useState(30);
  const [error,     setError]     = useState("");
  const [loading,   setLoading]   = useState(false);

  // ── Load booking ──────────────────────────────────────────────────────────
  const loadBooking = useCallback(async () => {
    try {
      const res = await API.get("/bookings");
      const found = res.data.find(b => String(b.id) === String(booking_id));
      if (!found) return setError("Không tìm thấy booking");
      if (found.payment_status === "paid") return setError("Booking này đã được thanh toán");
      setBooking(found);
    } catch {
      setError("Không thể tải thông tin booking");
    }
  }, [booking_id]);

  useEffect(() => { loadBooking(); }, [loadBooking]);

  // ── Đếm ngược khi đang ở màn hình paying ─────────────────────────────────
  useEffect(() => {
    if (step !== "paying") return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleConfirmPayment();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [step]);

  // ── Step 1: Tạo payment ───────────────────────────────────────────────────
  const handlePay = async () => {
    if (!method) return setError("Vui lòng chọn phương thức thanh toán");
    setError("");
    setLoading(true);

    try {
      const res = await API.post("/payments", { booking_id, method });
      setPaymentId(res.data.payment_id);
      setCountdown(30);
      setStep("paying");
    } catch (err) {
      setError(err.response?.data?.message || "Khởi tạo thanh toán thất bại");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Xác nhận payment ─────────────────────────────────────────────
  const handleConfirmPayment = async () => {
    setStep("processing");
    try {
      await API.post(`/payments/${paymentId}/confirm`);
      setStep("success");
    } catch (err) {
      setStep("failed");
      setError(err.response?.data?.message || "Thanh toán thất bại");
    }
  };

  const selectedMethod = METHODS.find(m => m.key === method);

  // ── Render ────────────────────────────────────────────────────────────────
  if (!booking && !error) {
    return <div style={{ textAlign: "center", padding: 40 }}>Đang tải...</div>;
  }

  return (
    <div style={{ maxWidth: 480, margin: "40px auto", padding: "0 16px" }}>

      {/* ── SUCCESS ── */}
      {step === "success" && (
        <div style={{
          background: "#fff", borderRadius: 12,
          padding: 32, textAlign: "center", border: "1px solid #ddd",
        }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
          <h2 style={{ color: "#27ae60", margin: "0 0 8px" }}>Thanh toán thành công!</h2>
          <p style={{ color: "#888", marginBottom: 8 }}>Booking #{booking_id} đã được xác nhận</p>
          <p style={{ fontSize: 22, fontWeight: 700, color: "#3498db", marginBottom: 8 }}>
            {Number(booking?.total_price).toLocaleString("vi-VN")}đ
          </p>
          <p style={{ color: "#888", fontSize: 13, marginBottom: 24 }}>
            Phương thức: {selectedMethod?.emoji} {selectedMethod?.label}
          </p>
          <button
            onClick={() => navigate("/booking")}
            style={{
              padding: "10px 24px", background: "#3498db",
              color: "#fff", border: "none", borderRadius: 8,
              fontWeight: 600, cursor: "pointer", fontSize: 15,
            }}
          >
            Xem lịch sử booking
          </button>
        </div>
      )}

      {/* ── FAILED ── */}
      {step === "failed" && (
        <div style={{
          background: "#fff", borderRadius: 12,
          padding: 32, textAlign: "center", border: "1px solid #ddd",
        }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>❌</div>
          <h2 style={{ color: "#e74c3c", margin: "0 0 8px" }}>Thanh toán thất bại</h2>
          <p style={{ color: "#888", marginBottom: 24 }}>{error}</p>
          <button
            onClick={() => { setStep("select"); setError(""); setPaymentId(null); }}
            style={{
              padding: "10px 24px", background: "#3498db",
              color: "#fff", border: "none", borderRadius: 8,
              fontWeight: 600, cursor: "pointer",
            }}
          >
            Thử lại
          </button>
        </div>
      )}

      {/* ── PROCESSING ── */}
      {step === "processing" && (
        <div style={{
          background: "#fff", borderRadius: 12,
          padding: 32, textAlign: "center", border: "1px solid #ddd",
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
          <h2 style={{ margin: "0 0 8px" }}>Đang xác nhận...</h2>
          <p style={{ color: "#888" }}>Vui lòng không đóng trang này</p>
        </div>
      )}

      {/* ── PAYING ── */}
      {step === "paying" && (
        <div style={{
          background: "#fff", borderRadius: 12,
          padding: 24, border: "1px solid #ddd",
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            marginBottom: 20, paddingBottom: 16,
            borderBottom: "1px solid #f0f0f0",
          }}>
            <span style={{ fontSize: 28 }}>{selectedMethod?.emoji}</span>
            <div>
              <div style={{ fontWeight: 700, color: selectedMethod?.color }}>
                {selectedMethod?.label}
              </div>
              <div style={{ fontSize: 12, color: "#888" }}>Đang chờ thanh toán</div>
            </div>
          </div>

          {method === "momo"    && <MomoScreen    amount={booking?.total_price} countdown={countdown} />}
          {method === "banking" && <BankingScreen amount={booking?.total_price} countdown={countdown} />}
          {method === "vnpay"   && <VNPayScreen   amount={booking?.total_price} countdown={countdown} />}

          <button
            onClick={handleConfirmPayment}
            style={{
              width: "100%", padding: "12px",
              background: selectedMethod?.color,
              color: "#fff", border: "none", borderRadius: 8,
              fontWeight: 700, fontSize: 15, cursor: "pointer",
              marginTop: 20,
            }}
          >
            ✅ Đã thanh toán
          </button>

          <button
            onClick={() => { setStep("select"); setPaymentId(null); setCountdown(30); }}
            style={{
              width: "100%", padding: "10px",
              background: "#fff", color: "#888",
              border: "1px solid #ddd", borderRadius: 8,
              cursor: "pointer", marginTop: 8,
            }}
          >
            ← Chọn phương thức khác
          </button>
        </div>
      )}

      {/* ── SELECT ── */}
      {step === "select" && (
        <div style={{
          background: "#fff", borderRadius: 12,
          padding: 24, border: "1px solid #ddd",
        }}>
          <h2 style={{ margin: "0 0 20px" }}>💳 Thanh toán</h2>

          {/* Thông tin booking */}
          {booking && (
            <div style={{
              background: "#f8f9fa", borderRadius: 8,
              padding: "12px 16px", marginBottom: 20,
              border: "1px solid #eee",
            }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>🏟 {booking.court_name}</div>
              <div style={{ fontSize: 13, color: "#555" }}>
                📅 {booking.date} &nbsp;
                {`⏰ ${booking.start_time} - ${booking.end_time}`}
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#3498db", marginTop: 8 }}>
                {Number(booking.total_price).toLocaleString("vi-VN")}đ
              </div>
            </div>
          )}

          {/* Chọn phương thức */}
          <p style={{ fontWeight: 600, marginBottom: 12 }}>Chọn phương thức thanh toán:</p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
            {METHODS.map((m) => (
              <div
                key={m.key}
                onClick={() => setMethod(m.key)}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 16px", borderRadius: 8,
                  border: `2px solid ${method === m.key ? m.color : "#ddd"}`,
                  background: method === m.key ? `${m.color}10` : "#fff",
                  cursor: "pointer",
                }}
              >
                <span style={{ fontSize: 28 }}>{m.emoji}</span>
                <div>
                  <div style={{ fontWeight: 600, color: method === m.key ? m.color : "#333" }}>
                    {m.label}
                  </div>
                  <div style={{ fontSize: 12, color: "#888" }}>{m.desc}</div>
                </div>
                {method === m.key && (
                  <span style={{ marginLeft: "auto", color: m.color, fontWeight: 700 }}>✓</span>
                )}
              </div>
            ))}
          </div>

          {error && (
            <p style={{ color: "#e74c3c", fontSize: 13, margin: "0 0 12px" }}>⚠️ {error}</p>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => navigate("/booking")}
              style={{
                flex: 1, padding: "10px",
                background: "#fff", color: "#333",
                border: "1px solid #ddd", borderRadius: 8,
                fontWeight: 600, cursor: "pointer",
              }}
            >
              ← Quay lại
            </button>
            <button
              onClick={handlePay}
              disabled={loading || !method}
              style={{
                flex: 2, padding: "10px",
                background: loading || !method ? "#aaa" : "#3498db",
                color: "#fff", border: "none", borderRadius: 8,
                fontWeight: 600, fontSize: 15,
                cursor: loading || !method ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Đang xử lý..." : `Thanh toán ${Number(booking?.total_price).toLocaleString("vi-VN")}đ`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}