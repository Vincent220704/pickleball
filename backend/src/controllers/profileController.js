const { connection: db } = require("../config/db");
const bcrypt = require("bcrypt");

const queryAsync = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.query(sql, params, (err, result) => (err ? reject(err) : resolve(result)))
  );

const sendError = (res, status, message, err = null) => {
  if (err) console.error(`[profileController] ${message}:`, err);
  return res.status(status).json({ message });
};

// =============================
// 👤 GET PROFILE
// =============================
exports.getProfile = async (req, res) => {
  try {
    const users = await queryAsync(
      `SELECT id, name, email, phone, avatar, role, status, created_at
       FROM users WHERE id = ?`,
      [req.user.id]
    );

    if (!users.length) return sendError(res, 404, "Không tìm thấy user");

    return res.json(users[0]);
  } catch (err) {
    return sendError(res, 500, "Lỗi lấy thông tin profile", err);
  }
};

// =============================
// ✏️ UPDATE PROFILE
// =============================
exports.updateProfile = async (req, res) => {
  const { name, phone, avatar } = req.body;

  if (!name) return sendError(res, 400, "Tên không được để trống");

  try {
    await queryAsync(
      `UPDATE users SET name=?, phone=?, avatar=? WHERE id=?`,
      [name, phone || null, avatar || null, req.user.id]
    );

    // Trả về thông tin mới
    const users = await queryAsync(
      `SELECT id, name, email, phone, avatar, role, status FROM users WHERE id=?`,
      [req.user.id]
    );

    return res.json({
      message: "Cập nhật thông tin thành công",
      user:    users[0],
    });
  } catch (err) {
    return sendError(res, 500, "Lỗi cập nhật profile", err);
  }
};

// =============================
// 🔑 CHANGE PASSWORD
// =============================
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return sendError(res, 400, "Thiếu mật khẩu hiện tại hoặc mật khẩu mới");
  }

  if (newPassword.length < 6) {
    return sendError(res, 400, "Mật khẩu mới phải có ít nhất 6 ký tự");
  }

  if (currentPassword === newPassword) {
    return sendError(res, 400, "Mật khẩu mới phải khác mật khẩu hiện tại");
  }

  try {
    const users = await queryAsync(
      `SELECT password FROM users WHERE id=?`,
      [req.user.id]
    );

    if (!users.length) return sendError(res, 404, "Không tìm thấy user");

    const isMatch = await bcrypt.compare(currentPassword, users[0].password);
    if (!isMatch) return sendError(res, 400, "Mật khẩu hiện tại không đúng");

    const hashed = await bcrypt.hash(newPassword, 10);
    await queryAsync(
      `UPDATE users SET password=? WHERE id=?`,
      [hashed, req.user.id]
    );

    return res.json({ message: "Đổi mật khẩu thành công" });
  } catch (err) {
    return sendError(res, 500, "Lỗi đổi mật khẩu", err);
  }
};