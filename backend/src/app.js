const express = require("express");
const cors    = require("cors");
const helmet  = require("helmet");
const morgan  = require("morgan");

require("dotenv").config();

const { dbReady } = require("./config/db");

const app = express();

// ─── Bảo mật & Logging ───────────────────────────────────────────────────────
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// ─── CORS ────────────────────────────────────────────────────────────────────
app.use(cors({
  origin:      process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true,
}));

// ─── Body Parser ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use("/api/auth",     require("./routes/authRoutes"));
app.use("/api/courts",   require("./routes/courtRoutes"));
app.use("/api/bookings", require("./routes/bookingRoutes"));
app.use("/api/users",    require("./routes/userRoutes"));
app.use("/api/stats", require("./routes/statsRoutes"));
app.use("/api/slots", require("./routes/slotRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));
app.use("/api/profile", require("./routes/profileRoutes"));
app.use("/api/news", require("./routes/newsRoutes"));
app.use("/api/reviews", require("./routes/reviewRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
// ─── Health check ────────────────────────────────────────────────────────────
app.get("/", (req, res) => res.json({ message: "API đang chạy ✅", env: process.env.NODE_ENV }));

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Không tìm thấy route: ${req.method} ${req.originalUrl}` });
});

// ─── Global Error Handler ────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("[GlobalError]", err);
  res.status(err.status || 500).json({
    message: err.message || "Lỗi server",
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
});

// ─── Chờ DB sẵn sàng trước khi export ───────────────────────────────────────
module.exports = { app, dbReady };