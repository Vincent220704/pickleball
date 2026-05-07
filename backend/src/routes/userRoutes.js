const express = require("express");
const router  = express.Router();

const { verifyToken, isAdmin, isSuperAdmin } = require("../middleware/authMiddleware");
const {
  getUsers,
  createUser,
  updateUser,
  updateRole,
  toggleBanUser,
  resetPassword,
  deleteUser,
} = require("../controllers/userController");

// ─── Super Admin only (đặt TRÊN /:id để không bị che) ────────────────────────
router.put   ("/role/:id",           verifyToken, isSuperAdmin, updateRole);
router.put   ("/reset-password/:id", verifyToken, isSuperAdmin, resetPassword);
router.delete("/:id",                verifyToken, isSuperAdmin, deleteUser);

// ─── Admin + Super Admin ──────────────────────────────────────────────────────
router.get  ("/",       verifyToken, isAdmin, getUsers);
router.post ("/",       verifyToken, isAdmin, createUser);
router.put  ("/:id",    verifyToken, isAdmin, updateUser);
router.patch("/:id/ban",verifyToken, isAdmin, toggleBanUser);

module.exports = router;