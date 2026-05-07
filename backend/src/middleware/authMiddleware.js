const jwt = require('jsonwebtoken');

// ─── HELPER: Trả lỗi chuẩn ──────────────────────────────────────────────────
const sendError = (res, status, message) =>
  res.status(status).json({ message });

// ─── Danh sách role hợp lệ theo cấp bậc ────────────────────────────────────
const ROLE_LEVELS = {
  user:        1,
  admin:       2,
  super_admin: 3,
};

// =============================
// 🔐 VERIFY TOKEN
// =============================
exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return sendError(res, 403, 'Không có token hoặc sai định dạng (Bearer <token>)');
  }

  const token = authHeader.slice(7);

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    const message =
      err.name === 'TokenExpiredError' ? 'Token đã hết hạn' : 'Token không hợp lệ';
    return sendError(res, 401, message);
  }
};

// =============================
// 🔒 REQUIRE ROLE (factory)
// Dùng: requireRole('admin')
//       requireRole('super_admin')
// =============================
exports.requireRole = (minRole) => (req, res, next) => {
  if (!req.user) return sendError(res, 401, 'Chưa đăng nhập');

  const userLevel = ROLE_LEVELS[req.user.role] ?? 0;
  const minLevel  = ROLE_LEVELS[minRole]       ?? 999;

  if (userLevel < minLevel) {
    return sendError(res, 403, `Yêu cầu quyền tối thiểu: ${minRole}`);
  }

  next();
};

// =============================
// 🔒 SHORTCUTS (giữ tương thích ngược)
// =============================
exports.isAdmin      = exports.requireRole('admin');
exports.isSuperAdmin = exports.requireRole('super_admin');