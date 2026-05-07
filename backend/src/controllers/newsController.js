const { connection: db } = require("../config/db");

const queryAsync = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.query(sql, params, (err, result) => (err ? reject(err) : resolve(result)))
  );

const sendError = (res, status, message, err = null) => {
  if (err) console.error(`[newsController] ${message}:`, err);
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
// 📰 GET ALL NEWS (public)
// =============================
exports.getNews = async (req, res) => {
  const { category_id, status = "published" } = req.query;
  const role = req.user?.role;

  let sql = `
    SELECT
      n.id, n.title, n.slug, n.thumbnail,
      n.summary, n.status, n.views,
      n.published_at, n.created_at,
      u.name AS author_name,
      c.name AS category_name
    FROM news n
    LEFT JOIN users           u ON n.author_id   = u.id
    LEFT JOIN news_categories c ON n.category_id = c.id
    WHERE 1=1
  `;
  const params = [];

  // Phân quyền
  if (role === "admin") {
    // Admin chỉ thấy bài của mình
    sql += ` AND n.author_id = ?`;
    params.push(req.user.id);
  } else if (role !== "super_admin") {
    // Public chỉ thấy bài published
    sql += ` AND n.status = 'published'`;
  }

  // Filter theo status (admin/super_admin)
  if (role === "super_admin" && status) {
    sql += ` AND n.status = ?`;
    params.push(status);
  }

  if (category_id) {
    sql += ` AND n.category_id = ?`;
    params.push(category_id);
  }

  sql += ` ORDER BY n.created_at DESC`;

  try {
    const result = await queryAsync(sql, params);
    return res.json(result);
  } catch (err) {
    return sendError(res, 500, "Lỗi lấy danh sách tin tức", err);
  }
};

// =============================
// 📰 GET NEWS DETAIL (by id hoặc slug)
// =============================
exports.getNewsDetail = async (req, res) => {
  const { id } = req.params;
  const isNumeric = /^\d+$/.test(id);

  try {
    const result = await queryAsync(
      `SELECT
        n.*,
        u.name AS author_name,
        c.name AS category_name
       FROM news n
       LEFT JOIN users           u ON n.author_id   = u.id
       LEFT JOIN news_categories c ON n.category_id = c.id
       WHERE ${isNumeric ? "n.id" : "n.slug"} = ?`,
      [id]
    );

    if (!result.length) return sendError(res, 404, "Không tìm thấy bài viết");

    // Tăng view
    await queryAsync(`UPDATE news SET views = views + 1 WHERE id = ?`, [result[0].id]);

    return res.json(result[0]);
  } catch (err) {
    return sendError(res, 500, "Lỗi lấy chi tiết tin tức", err);
  }
};

// =============================
// ➕ CREATE NEWS
// =============================
exports.createNews = async (req, res) => {
  const { title, thumbnail, summary, content, category_id } = req.body;

  if (!title || !content) {
    return sendError(res, 400, "Thiếu tiêu đề hoặc nội dung");
  }

  const slug = `${slugify(title)}-${Date.now()}`;

  try {
    const result = await queryAsync(
      `INSERT INTO news 
        (title, slug, thumbnail, summary, content, category_id, author_id, status, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'published', NOW())`,
      [
        title, slug,
        thumbnail   || null,
        summary     || null,
        content,
        category_id || null,
        req.user.id,
      ]
    );

    return res.status(201).json({
      message: "Đăng bài thành công",
      news_id: result.insertId,
      slug,
    });
  } catch (err) {
    return sendError(res, 500, "Lỗi tạo bài viết", err);
  }
};

// =============================
// ✏️ UPDATE NEWS
// =============================
exports.updateNews = async (req, res) => {
  const { id } = req.params;
  const { title, thumbnail, summary, content, category_id, status } = req.body;

  try {
    const news = await queryAsync(`SELECT author_id FROM news WHERE id = ?`, [id]);
    if (!news.length) return sendError(res, 404, "Không tìm thấy bài viết");

    const isOwner    = news[0].author_id === req.user.id;
    const isSuperAdmin = req.user.role === "super_admin";

    if (!isOwner && !isSuperAdmin) {
      return sendError(res, 403, "Không có quyền chỉnh sửa bài viết này");
    }

    const fields = [];
    const params = [];

    if (title)               { fields.push("title=?");       params.push(title);       }
    if (thumbnail !== undefined) { fields.push("thumbnail=?"); params.push(thumbnail); }
    if (summary !== undefined)   { fields.push("summary=?");   params.push(summary);   }
    if (content)             { fields.push("content=?");     params.push(content);     }
    if (category_id !== undefined) { fields.push("category_id=?"); params.push(category_id); }
    if (status)              { fields.push("status=?");      params.push(status);      }

    if (!fields.length) return sendError(res, 400, "Không có dữ liệu để cập nhật");

    params.push(id);
    await queryAsync(`UPDATE news SET ${fields.join(", ")} WHERE id = ?`, params);

    return res.json({ message: "Cập nhật bài viết thành công" });
  } catch (err) {
    return sendError(res, 500, "Lỗi cập nhật bài viết", err);
  }
};

// =============================
// ❌ DELETE NEWS
// =============================
exports.deleteNews = async (req, res) => {
  const { id } = req.params;

  try {
    const news = await queryAsync(`SELECT author_id FROM news WHERE id = ?`, [id]);
    if (!news.length) return sendError(res, 404, "Không tìm thấy bài viết");

    const isOwner      = news[0].author_id === req.user.id;
    const isSuperAdmin = req.user.role === "super_admin";

    if (!isOwner && !isSuperAdmin) {
      return sendError(res, 403, "Không có quyền xóa bài viết này");
    }

    await queryAsync(`DELETE FROM news WHERE id = ?`, [id]);
    return res.json({ message: "Xóa bài viết thành công" });
  } catch (err) {
    return sendError(res, 500, "Lỗi xóa bài viết", err);
  }
};

// =============================
// 📂 GET CATEGORIES
// =============================
exports.getCategories = async (req, res) => {
  try {
    const result = await queryAsync(
      `SELECT * FROM news_categories ORDER BY name ASC`
    );
    return res.json(result);
  } catch (err) {
    return sendError(res, 500, "Lỗi lấy danh mục", err);
  }
};

// =============================
// ➕ CREATE CATEGORY (super_admin)
// =============================
exports.createCategory = async (req, res) => {
  const { name } = req.body;
  if (!name) return sendError(res, 400, "Thiếu tên danh mục");

  const slug = slugify(name);

  try {
    const result = await queryAsync(
      `INSERT INTO news_categories (name, slug) VALUES (?, ?)`,
      [name, slug]
    );
    return res.status(201).json({ message: "Tạo danh mục thành công", id: result.insertId });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") return sendError(res, 400, "Danh mục đã tồn tại");
    return sendError(res, 500, "Lỗi tạo danh mục", err);
  }
};

// =============================
// ❌ DELETE CATEGORY (super_admin)
// =============================
exports.deleteCategory = async (req, res) => {
  const { id } = req.params;
  try {
    await queryAsync(`DELETE FROM news_categories WHERE id = ?`, [id]);
    return res.json({ message: "Xóa danh mục thành công" });
  } catch (err) {
    return sendError(res, 500, "Lỗi xóa danh mục", err);
  }
};



// =============================
// 📋 GET ALL NEWS (admin)
// =============================
exports.getAllNews = async (req, res) => {
  const { category_id, status } = req.query;
  const role = req.user?.role;

  let sql = `
    SELECT
      n.id, n.title, n.slug, n.thumbnail,
      n.summary, n.status, n.views,
      n.published_at, n.created_at,
      u.name AS author_name,
      c.name AS category_name
    FROM news n
    LEFT JOIN users           u ON n.author_id   = u.id
    LEFT JOIN news_categories c ON n.category_id = c.id
    WHERE 1=1
  `;
  const params = [];

  // Admin chỉ thấy bài của mình, super_admin thấy tất cả
  if (role === "admin") {
    sql += ` AND n.author_id = ?`;
    params.push(req.user.id);
  }

  if (status) {
    sql += ` AND n.status = ?`;
    params.push(status);
  }

  if (category_id) {
    sql += ` AND n.category_id = ?`;
    params.push(category_id);
  }

  sql += ` ORDER BY n.created_at DESC`;

  try {
    const result = await queryAsync(sql, params);
    return res.json(result);
  } catch (err) {
    return sendError(res, 500, "Lỗi lấy danh sách tin tức", err);
  }
};