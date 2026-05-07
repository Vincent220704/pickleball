const express = require("express");
const router  = express.Router();

const { verifyToken, isAdmin, isSuperAdmin } = require("../middleware/authMiddleware");
const {
  getNews, getNewsDetail, getAllNews,
  createNews, updateNews, deleteNews,
  getCategories, createCategory, deleteCategory,
} = require("../controllers/newsController");

// ─── Public ──────────────────────────────────────────────────────────────────
router.get("/",           getNews);
router.get("/categories", getCategories); // ← phải trước /:id

// ─── Admin (đặt trước /:id để không bị match nhầm) ───────────────────────────
router.get  ("/admin/all",        verifyToken, isAdmin,      getAllNews);
router.post ("/categories",       verifyToken, isSuperAdmin, createCategory);

// ─── Public detail (sau cùng) ────────────────────────────────────────────────
router.get("/:id", getNewsDetail);

// ─── Admin + Super_admin ──────────────────────────────────────────────────────
router.post  ("/",            verifyToken, isAdmin,      createNews);
router.put   ("/:id",         verifyToken, isAdmin,      updateNews);
router.delete("/categories/:id", verifyToken, isSuperAdmin, deleteCategory);
router.delete("/:id",         verifyToken, isAdmin,      deleteNews);

module.exports = router;