const { connection: db } = require("../config/db");

const queryAsync = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.query(sql, params, (err, result) => (err ? reject(err) : resolve(result)))
  );

const sendError = (res, status, message, err = null) => {
  if (err) console.error(`[paymentController] ${message}:`, err);
  return res.status(status).json({ message });
};

const VALID_METHODS = ["momo", "banking", "vnpay"];

// =============================
// 💳 CREATE PAYMENT (giả lập)
// =============================
exports.createPayment = async (req, res) => {
  const { booking_id, method } = req.body;
  const user_id = req.user?.id;

  if (!booking_id || !method) {
    return sendError(res, 400, "Thiếu booking_id hoặc method");
  }

  if (!VALID_METHODS.includes(method)) {
    return sendError(res, 400, `Phương thức không hợp lệ. Chỉ chấp nhận: ${VALID_METHODS.join(", ")}`);
  }

  try {
    // Kiểm tra booking tồn tại và thuộc về user
    const bookings = await queryAsync(
      `SELECT * FROM bookings WHERE id = ? AND user_id = ?`,
      [booking_id, user_id]
    );

    if (!bookings.length) {
      return sendError(res, 404, "Không tìm thấy booking");
    }

    const booking = bookings[0];

    if (booking.payment_status === "paid") {
      return sendError(res, 400, "Booking này đã được thanh toán");
    }

    if (booking.status === "cancelled" || booking.status === "rejected") {
      return sendError(res, 400, "Booking đã bị huỷ hoặc từ chối");
    }

    // Kiểm tra đã có payment pending chưa
    const existing = await queryAsync(
      `SELECT id FROM payments WHERE booking_id = ? AND status = 'pending'`,
      [booking_id]
    );

    if (existing.length > 0) {
      return sendError(res, 400, "Đã có giao dịch đang xử lý cho booking này");
    }

    // Tạo transaction_id giả
    const transaction_id = `${method.toUpperCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    // Tạo payment record
    const result = await queryAsync(
      `INSERT INTO payments (booking_id, user_id, amount, method, transaction_id, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [booking_id, user_id, booking.total_price, method, transaction_id]
    );

    return res.status(201).json({
      message:        "Khởi tạo thanh toán thành công",
      payment_id:     result.insertId,
      transaction_id,
      amount:         booking.total_price,
      method,
    });
  } catch (err) {
    return sendError(res, 500, "Lỗi khởi tạo thanh toán", err);
  }
};

// =============================
// ✅ CONFIRM PAYMENT (giả lập xử lý xong)
// =============================
exports.confirmPayment = async (req, res) => {
  const { payment_id } = req.params;
  const user_id = req.user?.id;

  try {
    const payments = await queryAsync(
      `SELECT p.*, b.status AS booking_status
       FROM payments p
       JOIN bookings b ON p.booking_id = b.id
       WHERE p.id = ? AND p.user_id = ?`,
      [payment_id, user_id]
    );

    if (!payments.length) {
      return sendError(res, 404, "Không tìm thấy giao dịch");
    }

    const payment = payments[0];

    if (payment.status !== "pending") {
      return sendError(res, 400, "Giao dịch này không ở trạng thái chờ xử lý");
    }

    // Bắt đầu transaction
    await new Promise((resolve, reject) =>
      db.beginTransaction(err => err ? reject(err) : resolve())
    );

    try {
      // Cập nhật payment → success
      await queryAsync(
        `UPDATE payments SET status='success', paid_at=NOW() WHERE id=?`,
        [payment_id]
      );

      // Cập nhật booking → approved + paid
      await queryAsync(
        `UPDATE bookings SET status='approved', payment_status='paid' WHERE id=?`,
        [payment.booking_id]
      );

      await new Promise((resolve, reject) =>
        db.commit(err => err ? reject(err) : resolve())
      );

      return res.json({
        message:        "Thanh toán thành công",
        transaction_id: payment.transaction_id,
        amount:         payment.amount,
        method:         payment.method,
        paid_at:        new Date(),
      });
    } catch (e) {
      await new Promise(resolve => db.rollback(resolve));
      return sendError(res, 500, "Lỗi xác nhận thanh toán", e);
    }
  } catch (err) {
    return sendError(res, 500, "Lỗi xác nhận thanh toán", err);
  }
};

// =============================
// ❌ CANCEL PAYMENT
// =============================
exports.cancelPayment = async (req, res) => {
  const { payment_id } = req.params;
  const user_id = req.user?.id;

  try {
    const payments = await queryAsync(
      `SELECT * FROM payments WHERE id = ? AND user_id = ?`,
      [payment_id, user_id]
    );

    if (!payments.length) return sendError(res, 404, "Không tìm thấy giao dịch");

    if (payments[0].status !== "pending") {
      return sendError(res, 400, "Chỉ huỷ được giao dịch đang chờ xử lý");
    }

    await queryAsync(
      `UPDATE payments SET status='failed' WHERE id=?`,
      [payment_id]
    );

    return res.json({ message: "Đã huỷ giao dịch" });
  } catch (err) {
    return sendError(res, 500, "Lỗi huỷ giao dịch", err);
  }
};

// =============================
// 📋 GET PAYMENTS
// admin/super_admin → tất cả
// user → chỉ của mình
// =============================
exports.getPayments = async (req, res) => {
  const user = req.user;

  let sql = `
    SELECT
      p.id, p.booking_id, p.user_id,
      p.amount, p.method, p.transaction_id,
      p.status, p.paid_at, p.created_at,
      u.name  AS user_name,
      c.name  AS court_name,
      b.date  AS booking_date,
      b.start_time, b.end_time
    FROM payments p
    JOIN bookings b ON p.booking_id = b.id
    JOIN users   u ON p.user_id    = u.id
    JOIN courts  c ON b.court_id   = c.id
    WHERE 1=1
  `;
  const params = [];

  if (user.role === "admin") {
    // Admin chỉ thấy payment của sân mình quản lý
    sql += ` AND c.owner_id = ?`;
    params.push(user.id);
  } else if (user.role !== "super_admin") {
    // User thường chỉ thấy payment của mình
    sql += ` AND p.user_id = ?`;
    params.push(user.id);
  }

  sql += ` ORDER BY p.created_at DESC`;

  try {
    const result = await queryAsync(sql, params);
    return res.json(result);
  } catch (err) {
    return sendError(res, 500, "Lỗi lấy danh sách thanh toán", err);
  }
};


// =============================
// 🧹 AUTO CANCEL EXPIRED PAYMENTS
// =============================
exports.cancelExpiredPayments = async () => {
  try {
    await queryAsync(
      `UPDATE payments 
       SET status = 'failed'
       WHERE status = 'pending'
         AND created_at < DATE_SUB(NOW(), INTERVAL 15 MINUTE)`
    );
  } catch (err) {
    console.error("[Payment] Lỗi cancel expired payments:", err);
  }
};