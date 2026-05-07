const { connection: db } = require("../config/db");
const { createNotification } = require("../utils/notificationHelper"); // 🔔 thêm dòng này

// ─── HELPER: query dạng Promise ──────────────────────────────────────────────
const queryAsync = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.query(sql, params, (err, result) => (err ? reject(err) : resolve(result)))
  );

// =============================
// 🔥 CREATE BOOKING (multi-slot)
// =============================
const createBooking = (req, res) => {
  const { slot_ids, note } = req.body;
  const user_id = req.user?.id;

  if (!slot_ids || !Array.isArray(slot_ids) || slot_ids.length === 0) {
    return res.status(400).json({ message: 'Thiếu slot_ids' });
  }

  if (!user_id) {
    return res.status(401).json({ message: 'Chưa đăng nhập' });
  }

  db.beginTransaction(async (err) => {
    if (err) return res.status(500).json(err);

    try {
      const placeholders = slot_ids.map(() => '?').join(',');
      const slots = await queryAsync(
        `SELECT ts.*, c.price AS court_price
         FROM time_slots ts
         JOIN courts c ON ts.court_id = c.id
         WHERE ts.id IN (${placeholders}) AND ts.status = 'available'
         ORDER BY ts.date, ts.start_time
         FOR UPDATE`,
        slot_ids
      );

      if (slots.length !== slot_ids.length) {
        return db.rollback(() =>
          res.status(400).json({ message: '❌ Một hoặc nhiều slot không còn trống' })
        );
      }

      const courtIds = [...new Set(slots.map(s => s.court_id))];
      const dates    = [...new Set(slots.map(s => String(s.date)))];
      if (courtIds.length > 1 || dates.length > 1) {
        return db.rollback(() =>
          res.status(400).json({ message: '❌ Các slot phải cùng sân và cùng ngày' })
        );
      }

      for (let i = 1; i < slots.length; i++) {
        if (slots[i].start_time !== slots[i - 1].end_time) {
          return db.rollback(() =>
            res.status(400).json({ message: '❌ Các slot phải liên tiếp nhau' })
          );
        }
      }

      const total_price = slots.reduce((sum, s) => sum + (s.price ?? s.court_price), 0);

      const firstSlot = slots[0];
      const lastSlot  = slots[slots.length - 1];

      await queryAsync(
        `UPDATE time_slots SET status='booked' WHERE id IN (${placeholders})`,
        slot_ids
      );

      const bookingResult = await queryAsync(
        `INSERT INTO bookings
          (user_id, court_id, slot_id, date, start_time, end_time, total_price, status, payment_status, note)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', 'unpaid', ?)`,
        [
          user_id,
          firstSlot.court_id,
          firstSlot.id,
          firstSlot.date,
          firstSlot.start_time,
          lastSlot.end_time,
          total_price,
          note || null,
        ]
      );

      const booking_id = bookingResult.insertId;

      // 🔔 notification: pending
      await createNotification({
        user_id,
        title: "Booking đã tạo",
        message: "Booking của bạn đang chờ admin duyệt",
        type: "booking_pending",
        ref_id: booking_id
      });

      for (const slot of slots) {
        await queryAsync(
          `INSERT INTO booking_slots (booking_id, slot_id, price) VALUES (?, ?, ?)`,
          [booking_id, slot.id, slot.price ?? slot.court_price]
        );
      }

      db.commit((err) => {
        if (err) return db.rollback(() => res.status(500).json(err));

        return res.json({
          message:     '✅ Đặt sân thành công (chờ duyệt)',
          booking_id,
          total_price,
          slots_count: slots.length,
          start_time:  firstSlot.start_time,
          end_time:    lastSlot.end_time,
        });
      });

    } catch (e) {
      db.rollback(() => res.status(500).json(e));
    }
  });
};

// =============================
// 🔥 CANCEL BOOKING
// =============================
const cancelBooking = (req, res) => {
  const { id } = req.params;
  const { cancel_reason = null } = req.body || {};
  const user_id = req.user?.id;

  db.query(
    `SELECT * FROM bookings WHERE id=? AND user_id=?`,
    [id, user_id],
    (err, result) => {
      if (err) return res.status(500).json(err);
      if (result.length === 0) return res.status(404).json({ message: 'Không tìm thấy booking' });

      const booking = result[0];

      if (booking.status === 'approved') {
        return res.status(400).json({ message: 'Không thể huỷ booking đã được duyệt' });
      }
      if (booking.status === 'cancelled') {
        return res.status(400).json({ message: 'Booking đã bị huỷ rồi' });
      }

      db.beginTransaction(async (err) => {
        if (err) return res.status(500).json(err);

        try {
          const bookingSlots = await queryAsync(
            `SELECT slot_id FROM booking_slots WHERE booking_id=?`, [id]
          );

          await queryAsync(
            `UPDATE bookings SET status='cancelled', cancelled_at=NOW(), cancel_reason=? WHERE id=?`,
            [cancel_reason, id]
          );

          if (bookingSlots.length > 0) {
            const slotIds = bookingSlots.map(s => s.slot_id);
            const ph = slotIds.map(() => '?').join(',');
            await queryAsync(`UPDATE time_slots SET status='available' WHERE id IN (${ph})`, slotIds);
          } else {
            await queryAsync(`UPDATE time_slots SET status='available' WHERE id=?`, [booking.slot_id]);
          }

          // 🔔 notification: cancelled
          await createNotification({
            user_id,
            title: "Đã huỷ booking",
            message: "Booking đã được huỷ thành công",
            type: "booking_cancelled",
            ref_id: id
          });

          db.commit((err) => {
            if (err) return db.rollback(() => res.status(500).json(err));
            return res.json({ message: '✅ Huỷ booking thành công' });
          });

        } catch (e) {
          db.rollback(() => res.status(500).json(e));
        }
      });
    }
  );
};

// =============================
// 🔥 APPROVE BOOKING
// =============================
const approveBooking = (req, res) => {
  const { id } = req.params;

  db.query(`SELECT * FROM bookings WHERE id=?`, [id], (err, result) => {
    if (err) return res.status(500).json(err);
    if (result.length === 0) return res.status(404).json({ message: 'Không tìm thấy booking' });
    if (result[0].status !== 'pending') {
      return res.status(400).json({ message: 'Chỉ duyệt được booking đang pending' });
    }

    const booking = result[0];

    db.query(`UPDATE bookings SET status='approved' WHERE id=?`, [id], async (err) => {
      if (err) return res.status(500).json(err);

      // 🔔 notification: approved
      await createNotification({
        user_id: booking.user_id,
        title: "Đặt sân thành công",
        message: "Booking của bạn đã được duyệt",
        type: "booking_approved",
        ref_id: id
      });

      return res.json({ message: '✅ Đã duyệt booking' });
    });
  });
};

// =============================
// 🔥 REJECT BOOKING
// =============================
const rejectBooking = (req, res) => {
  const { id } = req.params;
  const { cancel_reason } = req.body;

  db.query(`SELECT * FROM bookings WHERE id=?`, [id], (err, result) => {
    if (err) return res.status(500).json(err);
    if (result.length === 0) return res.status(404).json({ message: 'Không tìm thấy booking' });
    if (result[0].status !== 'pending') {
      return res.status(400).json({ message: 'Chỉ từ chối được booking đang pending' });
    }

    const booking = result[0];

    db.beginTransaction(async (err) => {
      if (err) return res.status(500).json(err);

      try {
        const bookingSlots = await queryAsync(
          `SELECT slot_id FROM booking_slots WHERE booking_id=?`, [id]
        );

        await queryAsync(
          `UPDATE bookings SET status='rejected', cancelled_at=NOW(), cancel_reason=? WHERE id=?`,
          [cancel_reason || null, id]
        );

        if (bookingSlots.length > 0) {
          const slotIds = bookingSlots.map(s => s.slot_id);
          const ph = slotIds.map(() => '?').join(',');
          await queryAsync(`UPDATE time_slots SET status='available' WHERE id IN (${ph})`, slotIds);
        } else {
          await queryAsync(`UPDATE time_slots SET status='available' WHERE id=?`, [booking.slot_id]);
        }

        // 🔔 notification: rejected
        await createNotification({
          user_id: booking.user_id,
          title: "Booking bị từ chối",
          message: "Rất tiếc, booking của bạn đã bị từ chối",
          type: "booking_rejected",
          ref_id: id
        });

        db.commit((err) => {
          if (err) return db.rollback(() => res.status(500).json(err));
          return res.json({ message: '❌ Đã từ chối booking' });
        });

      } catch (e) {
        db.rollback(() => res.status(500).json(e));
      }
    });
  });
};

// =============================
// 🔥 GET BOOKINGS
// =============================
const getBookings = (req, res) => {
  const user = req.user;

  const baseSql = `
    SELECT 
      b.id, b.user_id, b.court_id, b.slot_id,
      c.name  AS court_name,
      u.name  AS user_name,
      DATE_FORMAT(b.date, '%Y-%m-%d') AS date,
      b.start_time, b.end_time, b.total_price,
      b.status, b.payment_status, b.note,
      b.cancelled_at, b.cancel_reason, b.created_at,
      COUNT(bs.id) AS slot_count
    FROM bookings b
    LEFT JOIN courts        c  ON b.court_id = c.id
    LEFT JOIN users         u  ON b.user_id  = u.id
    LEFT JOIN booking_slots bs ON b.id       = bs.booking_id
  `;

  if (user.role === 'admin' || user.role === 'super_admin') {
    db.query(baseSql + ` GROUP BY b.id ORDER BY b.created_at DESC`, (err, result) => {
      if (err) return res.status(500).json(err);
      return res.json(result);
    });
  } else {
    db.query(
      baseSql + ` WHERE b.user_id=? GROUP BY b.id ORDER BY b.created_at DESC`,
      [user.id],
      (err, result) => {
        if (err) return res.status(500).json(err);
        return res.json(result);
      }
    );
  }
};

// =============================
// 🔥 GET BY DATE
// =============================
const getBookingsByDate = (req, res) => {
  const { date } = req.query;
  const user = req.user;

  if (!date) return res.status(400).json({ message: 'Thiếu ngày' });

  const baseSql = `
    SELECT 
      b.id, b.user_id, b.court_id, b.slot_id,
      c.name  AS court_name,
      u.name  AS user_name,
      DATE_FORMAT(b.date, '%Y-%m-%d') AS date,
      b.start_time, b.end_time, b.total_price,
      b.status, b.payment_status, b.note, b.created_at,
      COUNT(bs.id) AS slot_count
    FROM bookings b
    LEFT JOIN courts        c  ON b.court_id = c.id
    LEFT JOIN users         u  ON b.user_id  = u.id
    LEFT JOIN booking_slots bs ON b.id       = bs.booking_id
    WHERE b.date = ?
  `;

  if (user.role === 'admin' || user.role === 'super_admin') {
    db.query(baseSql + ` GROUP BY b.id ORDER BY b.start_time ASC`, [date], (err, result) => {
      if (err) return res.status(500).json(err);
      return res.json(result);
    });
  } else {
    db.query(
      baseSql + ` AND b.user_id=? GROUP BY b.id ORDER BY b.start_time ASC`,
      [date, user.id],
      (err, result) => {
        if (err) return res.status(500).json(err);
        return res.json(result);
      }
    );
  }
};

module.exports = {
  createBooking,
  cancelBooking,
  approveBooking,
  rejectBooking,
  getBookings,
  getBookingsByDate,
};