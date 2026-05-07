const express = require("express");
const router  = express.Router();

const { verifyToken, isAdmin } = require("../middleware/authMiddleware");
const {
  createPayment,
  confirmPayment,
  cancelPayment,
  getPayments,
} = require("../controllers/paymentController");

// ─── User ────────────────────────────────────────────────────────────────────
router.post("/"                    , verifyToken, createPayment);
router.post("/:payment_id/confirm" , verifyToken, confirmPayment);
router.post("/:payment_id/cancel"  , verifyToken, cancelPayment);

// ─── Admin + User ─────────────────────────────────────────────────────────────
router.get("/"                     , verifyToken, getPayments);

module.exports = router;