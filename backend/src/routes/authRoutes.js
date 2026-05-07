const express = require("express");
const router  = express.Router();
const rateLimit = require("express-rate-limit");
const {
  register,
  login,
  forgotPassword,
  resetPassword,
  verifyEmail, // ✅ thêm
} = require("../controllers/authController");

// ─── Rate Limiters ───────────────────────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Quá nhiều lần đăng nhập, thử lại sau 15 phút" },
  standardHeaders: true,
  legacyHeaders: false,
});

const forgotLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: "Quá nhiều yêu cầu, thử lại sau 15 phút" },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Routes ──────────────────────────────────────────────────────────────────
router.post("/register",        register);
router.post("/login",           loginLimiter,   login);
router.post("/forgot-password", forgotLimiter,  forgotPassword);
router.post("/reset-password",  resetPassword);
router.get("/verify-email",     verifyEmail); // ✅ thêm

module.exports = router;