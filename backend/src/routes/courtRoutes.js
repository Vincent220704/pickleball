const express = require("express");
const router  = express.Router();

const { verifyToken, isAdmin } = require("../middleware/authMiddleware");
const {
  createCourt,
  getCourts,
  getCourtDetail,
  updateCourt,
  deleteCourt,
} = require("../controllers/courtController");

// ─── Public ──────────────────────────────────────────────────────────────────
router.get("/",       getCourts);
router.get("/manage", verifyToken, isAdmin, getCourts); // ← phải trước /:id
router.get("/:id",    getCourtDetail);

// ─── Admin ───────────────────────────────────────────────────────────────────
router.post  ("/",    verifyToken, isAdmin, createCourt);
router.put   ("/:id", verifyToken,          updateCourt);
router.delete("/:id", verifyToken,          deleteCourt);

module.exports = router;