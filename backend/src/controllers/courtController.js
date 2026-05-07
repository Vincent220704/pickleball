const { connection: db } = require("../config/db");


// ─── HELPER ──────────────────────────────────────────────────────────────────
const queryAsync = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.query(sql, params, (err, result) => (err ? reject(err) : resolve(result)))
  );

const sendError = (res, status, message, err = null) => {
  if (err) console.error(`[courtController] ${message}:`, err);
  return res.status(status).json({ message });
};

const slugify = (str) =>
  str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

// =============================
// ➕ CREATE COURT
// =============================
exports.createCourt = async (req, res) => {
  const { name, location, description, images, surface_type, price, open_time, close_time, status } = req.body;

  if (!name || !location || !price) {
    return sendError(res, 400, "Thiếu dữ liệu bắt buộc (name, location, price)");
  }

  if (!req.user?.id) return sendError(res, 401, "Chưa đăng nhập");

  const slug = `${slugify(name)}-${Date.now()}`;

  try {
    const result = await queryAsync(
      `INSERT INTO courts 
        (owner_id, name, slug, location, description, images, surface_type, price, open_time, close_time, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id, name, slug, location,
        description || null,
        images ? JSON.stringify(images) : null,
        surface_type || null, price,
        open_time  || "06:00:00",
        close_time || "22:00:00",
        status || "active",
      ]
    );

    return res.status(201).json({ message: "Tạo sân thành công", court_id: result.insertId, slug });
  } catch (err) {
    return sendError(res, 500, "Lỗi tạo sân", err);
  }
};

// =============================
// 📋 GET ALL COURTS
// Phân quyền:
// - Chưa login / user → tất cả sân (filter status từ query)
// - Admin             → chỉ sân của mình
// - Super_admin       → tất cả sân
// =============================
exports.getCourts = async (req, res) => {
  const { status, surface_type } = req.query;
  const role = req.user?.role;
  const userId = req.user?.id;

  let sql = `
    SELECT
      c.id, c.name, c.slug, c.location, c.description,
      c.images, c.surface_type, c.price,
      c.open_time, c.close_time, c.status,
      c.owner_id, u.name AS owner_name,
      c.created_at
    FROM courts c
    LEFT JOIN users u ON c.owner_id = u.id
    WHERE 1=1
  `;
  const params = [];

  // Admin chỉ thấy sân của mình
  if (role === "admin") {
    sql += ` AND c.owner_id = ?`;
    params.push(userId);
  }

  if (status) {
    sql += ` AND c.status = ?`;
    params.push(status);
  }

  if (surface_type) {
    sql += ` AND c.surface_type = ?`;
    params.push(surface_type);
  }

  sql += ` ORDER BY c.id DESC`;

  try {
    const result = await queryAsync(sql, params);
    return res.json(result);
  } catch (err) {
    return sendError(res, 500, "Lỗi lấy danh sách sân", err);
  }
};

// =============================
// 🔍 GET COURT DETAIL (by id hoặc slug)
// =============================
exports.getCourtDetail = async (req, res) => {
  const { id } = req.params;
  const isNumeric = /^\d+$/.test(id);

  const sql = `
    SELECT
      c.*,
      u.name AS owner_name,
      ROUND(AVG(r.rating), 1) AS avg_rating,
      COUNT(r.id)             AS review_count
    FROM courts c
    LEFT JOIN users   u ON c.owner_id = u.id
    LEFT JOIN reviews r ON r.court_id = c.id
    WHERE ${isNumeric ? "c.id" : "c.slug"} = ?
    GROUP BY c.id
  `;

  try {
    const result = await queryAsync(sql, [id]);
    if (!result.length) return sendError(res, 404, "Không tìm thấy sân");
    return res.json(result[0]);
  } catch (err) {
    return sendError(res, 500, "Lỗi lấy thông tin sân", err);
  }
};

// =============================
// ✏️ UPDATE COURT
// =============================
exports.updateCourt = async (req, res) => {
  const { id } = req.params;
  const { name, location, description, images, surface_type, price, open_time, close_time, status } = req.body;

  if (!req.user?.id) return sendError(res, 401, "Chưa đăng nhập");

  try {
    const courts = await queryAsync(`SELECT owner_id FROM courts WHERE id=?`, [id]);
    if (!courts.length) return sendError(res, 404, "Không tìm thấy sân");

    const isOwner = courts[0].owner_id === req.user.id;
    const isAdmin = ["admin", "super_admin"].includes(req.user.role);
    if (!isOwner && !isAdmin) return sendError(res, 403, "Không có quyền chỉnh sửa sân này");

    const fields = [];
    const params = [];

    if (name)                  { fields.push("name=?");         params.push(name);                  }
    if (location)              { fields.push("location=?");     params.push(location);              }
    if (description !== undefined) { fields.push("description=?"); params.push(description);        }
    if (images)                { fields.push("images=?");       params.push(JSON.stringify(images));}
    if (surface_type)          { fields.push("surface_type=?"); params.push(surface_type);          }
    if (price)                 { fields.push("price=?");        params.push(price);                 }
    if (open_time)             { fields.push("open_time=?");    params.push(open_time);             }
    if (close_time)            { fields.push("close_time=?");   params.push(close_time);            }
    if (status)                { fields.push("status=?");       params.push(status);                }

    if (!fields.length) return sendError(res, 400, "Không có dữ liệu để cập nhật");

    params.push(id);
    await queryAsync(`UPDATE courts SET ${fields.join(", ")} WHERE id=?`, params);

    return res.json({ message: "Cập nhật sân thành công" });
  } catch (err) {
    return sendError(res, 500, "Lỗi cập nhật sân", err);
  }
};

// =============================
// ❌ DELETE COURT
// =============================
exports.deleteCourt = async (req, res) => {
  const { id } = req.params;

  if (!req.user?.id) return sendError(res, 401, "Chưa đăng nhập");

  try {
    const courts = await queryAsync(`SELECT owner_id FROM courts WHERE id=?`, [id]);
    if (!courts.length) return sendError(res, 404, "Không tìm thấy sân");

    const isOwner = courts[0].owner_id === req.user.id;
    const isAdmin = ["admin", "super_admin"].includes(req.user.role);
    if (!isOwner && !isAdmin) return sendError(res, 403, "Không có quyền xóa sân này");

    await queryAsync(`DELETE FROM courts WHERE id=?`, [id]);
    return res.json({ message: "Xóa sân thành công" });
  } catch (err) {
    return sendError(res, 500, "Lỗi xóa sân", err);
  }
};