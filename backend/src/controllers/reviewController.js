const { connection: db } = require("../config/db");

const queryAsync = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.query(sql, params, (err, result) => (err ? reject(err) : resolve(result)))
  );

const sendError = (res, status, message, err = null) => {
  if (err) console.error(`[reviewController] ${message}:`, err);
  return res.status(status).json({ message });
};

// =============================
// ⭐ GET REVIEWS (theo sân)
// =============================
exports.getReviews = async (req, res) => {
  const { court_id } = req.query;

  if (!court_id) return sendError(res, 400, "Thiếu court_id");

  try {
    const result = await queryAsync(
      `SELECT
        r.id, r.rating, r.comment, r.created_at,
        u.name AS user_name,
        u.avatar AS user_avatar
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.court_id = ?
       ORDER BY r.created_at DESC`,
      [court_id]
    );

    // Tính avg rating
    const avg = result.length
      ? (result.reduce((sum, r) => sum + r.rating, 0) / result.length).toFixed(1)
      : 0;

    return res.json({ reviews: result, avg_rating: Number(avg), total: result.length });
  } catch (err) {
    return sendError(res, 500, "Lỗi lấy đánh giá", err);
  }
};

// =============================
// ⭐ CREATE REVIEW
// Chỉ user đã booking approved mới được review
// =============================
exports.createReview = async (req, res) => {
  const { booking_id, rating, comment } = req.body;
  const user_id = req.user.id;

  if (!booking_id || !rating) {
    return sendError(res, 400, "Thiếu booking_id hoặc rating");
  }

  if (rating < 1 || rating > 5) {
    return sendError(res, 400, "Rating phải từ 1 đến 5");
  }

  try {
    // Kiểm tra booking tồn tại, thuộc user, đã approved
    const bookings = await queryAsync(
      `SELECT * FROM bookings 
       WHERE id = ? AND user_id = ? AND status = 'approved'`,
      [booking_id, user_id]
    );

    if (!bookings.length) {
      return sendError(res, 400, "Booking không hợp lệ hoặc chưa được duyệt");
    }

    const booking = bookings[0];

    // Kiểm tra đã review chưa
    const existing = await queryAsync(
      `SELECT id FROM reviews WHERE booking_id = ?`,
      [booking_id]
    );

    if (existing.length > 0) {
      return sendError(res, 400, "Bạn đã đánh giá booking này rồi");
    }

    const result = await queryAsync(
      `INSERT INTO reviews (court_id, user_id, booking_id, rating, comment)
       VALUES (?, ?, ?, ?, ?)`,
      [booking.court_id, user_id, booking_id, rating, comment || null]
    );

    return res.status(201).json({
      message:   "Đánh giá thành công",
      review_id: result.insertId,
    });
  } catch (err) {
    return sendError(res, 500, "Lỗi tạo đánh giá", err);
  }
};

// =============================
// ❌ DELETE REVIEW
// User xóa review của mình / admin xóa review của sân mình / super_admin xóa tất cả
// =============================
exports.deleteReview = async (req, res) => {
  const { id }  = req.params;
  const user    = req.user;

  try {
    const reviews = await queryAsync(
      `SELECT r.*, c.owner_id FROM reviews r
       JOIN courts c ON r.court_id = c.id
       WHERE r.id = ?`,
      [id]
    );

    if (!reviews.length) return sendError(res, 404, "Không tìm thấy đánh giá");

    const review    = reviews[0];
    const isOwner   = review.user_id   === user.id;
    const isAdmin   = review.owner_id  === user.id;
    const isSuperAdmin = user.role     === "super_admin";

    if (!isOwner && !isAdmin && !isSuperAdmin) {
      return sendError(res, 403, "Không có quyền xóa đánh giá này");
    }

    await queryAsync(`DELETE FROM reviews WHERE id = ?`, [id]);
    return res.json({ message: "Đã xóa đánh giá" });
  } catch (err) {
    return sendError(res, 500, "Lỗi xóa đánh giá", err);
  }
};

// =============================
// 📋 GET MY REVIEWS
// Lấy danh sách booking đã approved + chưa review
// =============================
exports.getReviewableBookings = async (req, res) => {
  const user_id = req.user.id;

  try {
    const result = await queryAsync(
      `SELECT
        b.id AS booking_id,
        b.date, b.start_time, b.end_time,
        c.id AS court_id,
        c.name AS court_name,
        r.id AS review_id,
        r.rating,
        r.comment
       FROM bookings b
       JOIN courts c ON b.court_id = c.id
       LEFT JOIN reviews r ON r.booking_id = b.id
       WHERE b.user_id = ? AND b.status = 'approved'
       ORDER BY b.date DESC`,
      [user_id]
    );

    return res.json(result);
  } catch (err) {
    return sendError(res, 500, "Lỗi lấy danh sách booking", err);
  }
};