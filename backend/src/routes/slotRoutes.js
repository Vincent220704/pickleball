const express = require("express");
const router  = express.Router();

const { verifyToken, isAdmin } = require("../middleware/authMiddleware");
const {
  getSlots,
  createSlot,
  generateSlots,
  toggleBlockSlot,
  deleteSlot,
} = require("../controllers/slotController");
const { deleteBulkSlots } = require('../controllers/slotController');

// ─── Public (user đăng nhập) ──────────────────────────────────────────────────
router.get("/", verifyToken, getSlots);

// ─── Admin ────────────────────────────────────────────────────────────────────
router.post("/",            verifyToken, isAdmin, createSlot);
router.post("/generate",    verifyToken, isAdmin, generateSlots);
router.patch("/:id/block",  verifyToken, isAdmin, toggleBlockSlot);
router.delete("/bulk", verifyToken, isAdmin, deleteBulkSlots);
router.delete("/:id",       verifyToken, isAdmin, deleteSlot);

module.exports = router;