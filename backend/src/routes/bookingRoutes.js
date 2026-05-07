const express = require('express');
const router  = express.Router();

const {
  createBooking,
  cancelBooking,
  approveBooking,
  rejectBooking,
  getBookings,
  getBookingsByDate,
} = require('../controllers/bookingController');

const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// ─── User ────────────────────────────────────────────────────────────────────
router.get ('/',          verifyToken,          getBookings);
router.get ('/by-date',  verifyToken,          getBookingsByDate);
router.post('/',          verifyToken,          createBooking);
router.put ('/cancel/:id',verifyToken,          cancelBooking);

// ─── Admin ───────────────────────────────────────────────────────────────────
router.put('/approve/:id', verifyToken, isAdmin, approveBooking);
router.put('/reject/:id',  verifyToken, isAdmin, rejectBooking);

module.exports = router;