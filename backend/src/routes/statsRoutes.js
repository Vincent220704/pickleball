const express = require("express");
const router  = express.Router();

const { verifyToken, isAdmin } = require("../middleware/authMiddleware");
const { getDashboardStats }    = require("../controllers/statsController");

router.get("/dashboard", verifyToken, isAdmin, getDashboardStats);

module.exports = router;