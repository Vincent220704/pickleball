const express = require("express");
const router = express.Router();

const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  createNotification,
  deleteNotification,
} = require("../controllers/notificationController");

// cần middleware auth nếu có
const { verifyToken } = require("../middleware/authMiddleware");

// 🔔 lấy list
router.get("/", verifyToken, getNotifications);

// ✅ đọc 1 cái
router.put("/read/:id", verifyToken, markAsRead);

// 🔥 đọc tất cả
router.put("/read-all", verifyToken, markAllAsRead);

// ➕ tạo
router.post("/", verifyToken, createNotification);

// ❌ xóa
router.delete("/:id", verifyToken, deleteNotification);

module.exports = router;