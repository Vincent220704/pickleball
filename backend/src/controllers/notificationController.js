const { connection: db } = require("../config/db");

// Promise wrapper
const queryAsync = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.query(sql, params, (err, result) =>
      err ? reject(err) : resolve(result)
    )
  );

// Hàm lỗi chung
const sendError = (res, status, message, err = null) => {
  if (err) console.error(`[notificationController] ${message}:`, err);
  return res.status(status).json({ message });
};

// 🔔 GET NOTIFICATIONS
exports.getNotifications = async (req, res) => {
  const user_id = req.user.id;

  try {
    const result = await queryAsync(
      `SELECT *
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [user_id]
    );

    const unread = result.filter(n => !n.is_read).length;

    return res.json({
      notifications: result,
      total: result.length,
      unread,
    });
  } catch (err) {
    return sendError(res, 500, "Lỗi lấy notifications", err);
  }
};

// ✅ MARK AS READ
exports.markAsRead = async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;

  try {
    const result = await queryAsync(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE id = ? AND user_id = ?`,
      [id, user_id]
    );

    if (result.affectedRows === 0) {
      return sendError(res, 404, "Không tìm thấy notification");
    }

    return res.json({ message: "Đã đọc" });
  } catch (err) {
    return sendError(res, 500, "Lỗi update notification", err);
  }
};

// 🔥 MARK ALL AS READ
exports.markAllAsRead = async (req, res) => {
  const user_id = req.user.id;

  try {
    await queryAsync(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE user_id = ?`,
      [user_id]
    );

    return res.json({ message: "Đã đọc tất cả" });
  } catch (err) {
    return sendError(res, 500, "Lỗi update tất cả", err);
  }
};

// ➕ CREATE NOTIFICATION
exports.createNotification = async (req, res) => {
  const { user_id, title, message, type, ref_id } = req.body;

  if (!user_id || !title) {
    return sendError(res, 400, "Thiếu user_id hoặc title");
  }

  try {
    const result = await queryAsync(
      `INSERT INTO notifications (user_id, title, message, type, ref_id)
       VALUES (?, ?, ?, ?, ?)`,
      [user_id, title, message || null, type || null, ref_id || null]
    );

    return res.status(201).json({
      message: "Tạo notification thành công",
      id: result.insertId,
    });
  } catch (err) {
    return sendError(res, 500, "Lỗi tạo notification", err);
  }
};

// ❌ DELETE NOTIFICATION
exports.deleteNotification = async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;

  try {
    const result = await queryAsync(
      `DELETE FROM notifications
       WHERE id = ? AND user_id = ?`,
      [id, user_id]
    );

    if (result.affectedRows === 0) {
      return sendError(res, 404, "Không tìm thấy notification");
    }

    return res.json({ message: "Đã xóa notification" });
  } catch (err) {
    return sendError(res, 500, "Lỗi xóa notification", err);
  }
};