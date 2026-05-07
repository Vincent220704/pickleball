const express = require("express");
const router  = express.Router();

const { verifyToken, isAdmin } = require("../middleware/authMiddleware");
const {
  getReviews,
  createReview,
  deleteReview,
  getReviewableBookings,
} = require("../controllers/reviewController");

// ─── Public ──────────────────────────────────────────────────────────────────
router.get("/",           getReviews);

// ─── Private ─────────────────────────────────────────────────────────────────
router.get ("/my-bookings", verifyToken, getReviewableBookings);
router.post("/",            verifyToken, createReview);
router.delete("/:id",       verifyToken, deleteReview);

module.exports = router;