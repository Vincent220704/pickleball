const { connection: db } = require("../config/db");
const bcrypt = require("bcrypt");

// ─── HELPER: Query dạng Promise ─────────────────────────────────────────────
const queryAsync = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.query(sql, params, (err, result) => (err ? reject(err) : resolve(result)))
  );

// ─── HELPER: Trả lỗi chuẩn ──────────────────────────────────────────────────
const sendError = (res, status, message, err = null) => {
  if (err) console.error(`[userController] ${message}:`, err);
  return res.status(status).json({ message });
};

// ─── HELPER: Validate role ───────────────────────────────────────────────────
const ALLOWED_ROLES = ["admin", "user"];
const isValidRole = (role) => ALLOWED_ROLES.includes(role);

// =============================
// 👥 GET ALL USERS
// super_admin → tất cả
// admin       → chỉ user thường
// =============================
const getUsers = async (req, res) => {
  try {
    let sql, params = [];

    if (req.user.role === "super_admin") {
      sql = `
        SELECT id, name, email, phone, avatar, role, status, created_at
        FROM users
        ORDER BY created_at DESC
      `;
    } else if (req.user.role === "admin") {
      sql = `
        SELECT id, name, email, phone, avatar, role, status, created_at
        FROM users
        WHERE role = 'user'
        ORDER BY created_at DESC
      `;
    } else {
      return sendError(res, 403, "Không có quyền truy cập");
    }

    const result = await queryAsync(sql, params);
    return res.json(result);
  } catch (err) {
    return sendError(res, 500, "Lỗi lấy danh sách user", err);
  }
};

// =============================
// ➕ CREATE USER
// super_admin → tạo admin/user
// admin       → chỉ tạo user
// =============================
const createUser = async (req, res) => {
  const { name, email, password, role, phone } = req.body;

  if (!name || !email || !password || !role) {
    return sendError(res, 400, "Thiếu dữ liệu bắt buộc (name, email, password, role)");
  }

  if (!isValidRole(role)) {
    return sendError(res, 400, "Role không hợp lệ. Chỉ được dùng: admin, user");
  }

  // Admin chỉ được tạo user thường
  if (req.user.role === "admin" && role === "admin") {
    return sendError(res, 403, "Admin không có quyền tạo admin khác");
  }

  // Chỉ super_admin và admin mới được tạo user
  if (!["super_admin", "admin"].includes(req.user.role)) {
    return sendError(res, 403, "Không có quyền tạo user");
  }

  try {
    const existing = await queryAsync("SELECT id FROM users WHERE email=?", [email]);
    if (existing.length > 0) return sendError(res, 400, "Email đã tồn tại");

    const hashed = await bcrypt.hash(password, 10);

    const result = await queryAsync(
      "INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)",
      [name, email, hashed, role, phone || null]
    );

    return res.status(201).json({
      message: "Tạo user thành công",
      user_id: result.insertId,
    });
  } catch (err) {
    return sendError(res, 500, "Lỗi tạo user", err);
  }
};

// =============================
// ✏️ UPDATE USER INFO
// super_admin → sửa bất kỳ ai
// admin       → sửa user thường
// =============================
const updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, phone, avatar, status } = req.body;

  // Không cho sửa chính mình qua API này (dùng profile API)
  if (parseInt(id) === req.user.id) {
    return sendError(res, 400, "Dùng API profile để cập nhật thông tin của bạn");
  }

  try {
    const targets = await queryAsync("SELECT id, role FROM users WHERE id=?", [id]);
    if (!targets.length) return sendError(res, 404, "Không tìm thấy user");

    const target = targets[0];

    // Admin chỉ được sửa user thường
    if (req.user.role === "admin" && target.role !== "user") {
      return sendError(res, 403, "Không có quyền chỉnh sửa tài khoản này");
    }

    // Chỉ super_admin và admin mới được dùng API này
    if (!["super_admin", "admin"].includes(req.user.role)) {
      return sendError(res, 403, "Không có quyền");
    }

    const fields = [];
    const params = [];

    if (name)             { fields.push("name=?");   params.push(name); }
    if (phone !== undefined) { fields.push("phone=?"); params.push(phone); }
    if (avatar)           { fields.push("avatar=?"); params.push(avatar); }
    if (status)           { fields.push("status=?"); params.push(status); }

    if (!fields.length) return sendError(res, 400, "Không có dữ liệu để cập nhật");

    params.push(id);
    await queryAsync(`UPDATE users SET ${fields.join(", ")} WHERE id=?`, params);

    return res.json({ message: "Cập nhật user thành công" });
  } catch (err) {
    return sendError(res, 500, "Lỗi cập nhật user", err);
  }
};

// =============================
// 🔄 UPDATE ROLE
// Chỉ super_admin
// =============================
const updateRole = async (req, res) => {
  if (req.user.role !== "super_admin") {
    return sendError(res, 403, "Chỉ super_admin mới có quyền đổi role");
  }

  const { id } = req.params;
  const { role } = req.body;

  if (!isValidRole(role)) {
    return sendError(res, 400, "Role không hợp lệ. Chỉ được dùng: admin, user");
  }

  // Không cho đổi role chính mình
  if (parseInt(id) === req.user.id) {
    return sendError(res, 400, "Không thể đổi role của chính mình");
  }

  try {
    const result = await queryAsync("UPDATE users SET role=? WHERE id=?", [role, id]);
    if (!result.affectedRows) return sendError(res, 404, "Không tìm thấy user");

    return res.json({ message: "Cập nhật role thành công" });
  } catch (err) {
    return sendError(res, 500, "Lỗi cập nhật role", err);
  }
};

// =============================
// 🔒 BAN / UNBAN USER
// super_admin → bất kỳ ai
// admin       → chỉ user thường
// =============================
const toggleBanUser = async (req, res) => {
  const { id } = req.params;

  if (parseInt(id) === req.user.id) {
    return sendError(res, 400, "Không thể tự khóa chính mình");
  }

  try {
    const targets = await queryAsync("SELECT id, role, status FROM users WHERE id=?", [id]);
    if (!targets.length) return sendError(res, 404, "Không tìm thấy user");

    const target = targets[0];

    if (req.user.role === "admin" && target.role !== "user") {
      return sendError(res, 403, "Không có quyền khóa tài khoản này");
    }

    if (!["super_admin", "admin"].includes(req.user.role)) {
      return sendError(res, 403, "Không có quyền");
    }

    const newStatus = target.status === "active" ? "banned" : "active";
    await queryAsync("UPDATE users SET status=? WHERE id=?", [newStatus, id]);

    return res.json({
      message: newStatus === "banned" ? "Đã khóa tài khoản" : "Đã mở khóa tài khoản",
      status: newStatus,
    });
  } catch (err) {
    return sendError(res, 500, "Lỗi thay đổi trạng thái user", err);
  }
};

// =============================
// 🔑 RESET PASSWORD
// Chỉ super_admin
// =============================
const resetPassword = async (req, res) => {
  if (req.user.role !== "super_admin") {
    return sendError(res, 403, "Chỉ super_admin mới có quyền reset password");
  }

  const { id } = req.params;
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    return sendError(res, 400, "Password mới phải có ít nhất 6 ký tự");
  }

  try {
    const hashed = await bcrypt.hash(newPassword, 10);
    const result = await queryAsync(
      "UPDATE users SET password=?, reset_token=NULL, reset_token_expire=NULL WHERE id=?",
      [hashed, id]
    );

    if (!result.affectedRows) return sendError(res, 404, "Không tìm thấy user");

    return res.json({ message: "Reset password thành công" });
  } catch (err) {
    return sendError(res, 500, "Lỗi reset password", err);
  }
};

// =============================
// ❌ DELETE USER
// Chỉ super_admin
// =============================
const deleteUser = async (req, res) => {
  if (req.user.role !== "super_admin") {
    return sendError(res, 403, "Chỉ super_admin mới có quyền xóa user");
  }

  const { id } = req.params;

  if (parseInt(id) === req.user.id) {
    return sendError(res, 400, "Không thể tự xóa chính mình");
  }

  try {
    const result = await queryAsync("DELETE FROM users WHERE id=?", [id]);
    if (!result.affectedRows) return sendError(res, 404, "Không tìm thấy user");

    return res.json({ message: "Xóa user thành công" });
  } catch (err) {
    return sendError(res, 500, "Lỗi xóa user", err);
  }
};

module.exports = {
  getUsers,
  createUser,
  updateUser,
  updateRole,
  toggleBanUser,
  resetPassword,
  deleteUser,
};