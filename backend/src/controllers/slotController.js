const { connection: db } = require("../config/db");

const queryAsync = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.query(sql, params, (err, result) => (err ? reject(err) : resolve(result)))
  );

const sendError = (res, status, message, err = null) => {
  if (err) console.error(`[slotController] ${message}:`, err);
  return res.status(status).json({ message });
};

// ─── HELPER: Check quyền sở hữu sân ─────────────────────────────────────────
const checkCourtOwner = async (court_id, user) => {
  if (user.role === "super_admin") return true;
  const courts = await queryAsync(
    `SELECT id FROM courts WHERE id = ? AND owner_id = ?`,
    [court_id, user.id]
  );
  return courts.length > 0;
};

// ─── HELPER: Chuyển HH:MM:SS sang phút ──────────────────────────────────────
const toMinutes = (time) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

const toTimeStr = (minutes) => {
  const h = String(Math.floor(minutes / 60)).padStart(2, "0");
  const m = String(minutes % 60).padStart(2, "0");
  return `${h}:${m}:00`;
};

// ─── HELPER: Tạo danh sách ngày giữa 2 mốc ──────────────────────────────────
const getDateRange = (dateFrom, dateTo) => {
  const dates = [];
  const start = new Date(dateFrom);
  const end   = new Date(dateTo);

  while (start <= end) {
    dates.push(start.toISOString().split("T")[0]);
    start.setDate(start.getDate() + 1);
  }
  return dates;
};

// =============================
// 📋 GET SLOTS (theo sân + ngày)
// =============================
exports.getSlots = async (req, res) => {
  const { court_id, date } = req.query;

  if (!court_id || !date) {
    return sendError(res, 400, "Thiếu court_id hoặc date");
  }

  try {
    if (req.user?.role === "admin") {
      const isOwner = await checkCourtOwner(court_id, req.user);
      if (!isOwner) return sendError(res, 403, "Không có quyền xem slot của sân này");
    }

    const slots = await queryAsync(
      `SELECT id, court_id, date, start_time, end_time, price, status
       FROM time_slots
       WHERE court_id = ? AND date = ?
       ORDER BY start_time ASC`,
      [court_id, date]
    );

    return res.json(slots);
  } catch (err) {
    return sendError(res, 500, "Lỗi lấy danh sách slot", err);
  }
};

// =============================
// ➕ CREATE SLOT (admin tạo thủ công)
// =============================
exports.createSlot = async (req, res) => {
  const { court_id, date, start_time, end_time, price } = req.body;

  if (!court_id || !date || !start_time || !end_time) {
    return sendError(res, 400, "Thiếu dữ liệu bắt buộc");
  }

  if (start_time >= end_time) {
    return sendError(res, 400, "Giờ bắt đầu phải nhỏ hơn giờ kết thúc");
  }

  try {
    const isOwner = await checkCourtOwner(court_id, req.user);
    if (!isOwner) return sendError(res, 403, "Không có quyền tạo slot cho sân này");

    const overlap = await queryAsync(
      `SELECT id FROM time_slots
       WHERE court_id = ? AND date = ?
         AND status != 'blocked'
         AND start_time < ? AND end_time > ?`,
      [court_id, date, end_time, start_time]
    );

    if (overlap.length > 0) {
      return sendError(res, 400, "Khung giờ này bị trùng với slot đã tồn tại");
    }

    const result = await queryAsync(
      `INSERT INTO time_slots (court_id, date, start_time, end_time, price, status)
       VALUES (?, ?, ?, ?, ?, 'available')`,
      [court_id, date, start_time, end_time, price || null]
    );

    return res.status(201).json({ message: "Tạo slot thành công", slot_id: result.insertId });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") return sendError(res, 400, "Slot này đã tồn tại");
    return sendError(res, 500, "Lỗi tạo slot", err);
  }
};

// =============================
// 🔄 AUTO GENERATE SLOTS
// Hỗ trợ tạo cho nhiều ngày: date_from → date_to
// Hoặc tạo 1 ngày: chỉ truyền date
// =============================
exports.generateSlots = async (req, res) => {
  const { court_id, date, date_from, date_to, duration = 60 } = req.body;

  // Hỗ trợ cả 2 cách gọi: 1 ngày (date) hoặc khoảng ngày (date_from + date_to)
  const from = date_from || date;
  const to   = date_to   || date;

  if (!court_id || !from) {
    return sendError(res, 400, "Thiếu court_id hoặc ngày");
  }

  if (new Date(from) > new Date(to)) {
    return sendError(res, 400, "Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc");
  }

  // Giới hạn tối đa 31 ngày để tránh tạo quá nhiều
  const dateList = getDateRange(from, to);
  if (dateList.length > 31) {
    return sendError(res, 400, "Chỉ được tạo tối đa 31 ngày trong 1 lần");
  }

  try {
    const isOwner = await checkCourtOwner(court_id, req.user);
    if (!isOwner) return sendError(res, 403, "Không có quyền tạo slot cho sân này");

    const courts = await queryAsync(
      `SELECT open_time, close_time, price FROM courts WHERE id = ?`,
      [court_id]
    );

    if (!courts.length) return sendError(res, 404, "Không tìm thấy sân");

    const { open_time, close_time, price } = courts[0];
    const openMin  = toMinutes(open_time);
    const closeMin = toMinutes(close_time);
    const dur      = Number(duration);

    if (dur <= 0 || openMin >= closeMin) {
      return sendError(res, 400, "Thông số không hợp lệ");
    }

    // Build tất cả slot cho tất cả ngày
    const allSlots = [];
    for (const d of dateList) {
      let current = openMin;
      while (current + dur <= closeMin) {
        const next = current + dur;
        const slotPrice = Math.round(price * dur / 60); // tính giá theo thời lượng thực tế
        allSlots.push([court_id, d, toTimeStr(current), toTimeStr(next), slotPrice]);
        current = next;
      }
    }

    if (!allSlots.length) {
      return sendError(res, 400, "Không thể tạo slot với thông số này");
    }

    let created = 0;
    let skipped = 0;

    for (const slot of allSlots) {
      const [cId, d, start, end, slotPrice] = slot;

      // Kiểm tra overlap trước khi insert
      const overlap = await queryAsync(
        `SELECT id FROM time_slots
        WHERE court_id = ? AND date = ?
          AND start_time < ? AND end_time > ?`,
        [cId, d, end, start]
      );

      if (overlap.length > 0) {
        skipped++;
        continue;
      }

      try {
        const result = await queryAsync(
          `INSERT IGNORE INTO time_slots (court_id, date, start_time, end_time, price, status)
          VALUES (?, ?, ?, ?, ?, 'available')`,
          slot
        );
        if (result.affectedRows > 0) created++;
        else skipped++;
      } catch { skipped++; }
    }

    const dayCount = dateList.length;
    return res.json({
      message: `Tạo ${created} slot thành công cho ${dayCount} ngày${skipped > 0 ? `, bỏ qua ${skipped} slot trùng` : ""}`,
      date_from: from,
      date_to:   to,
      days:      dayCount,
      court_id,
      created,
      skipped,
    });
  } catch (err) {
    return sendError(res, 500, "Lỗi generate slots", err);
  }
};

// =============================
// 🔒 BLOCK / UNBLOCK SLOT
// =============================
exports.toggleBlockSlot = async (req, res) => {
  const { id } = req.params;

  try {
    const slots = await queryAsync(
      `SELECT id, status, court_id FROM time_slots WHERE id = ?`,
      [id]
    );

    if (!slots.length) return sendError(res, 404, "Không tìm thấy slot");

    const slot = slots[0];
    const isOwner = await checkCourtOwner(slot.court_id, req.user);
    if (!isOwner) return sendError(res, 403, "Không có quyền thao tác slot này");

    if (slot.status === "booked") {
      return sendError(res, 400, "Không thể block slot đã được đặt");
    }

    const newStatus = slot.status === "blocked" ? "available" : "blocked";
    await queryAsync(`UPDATE time_slots SET status = ? WHERE id = ?`, [newStatus, id]);

    return res.json({
      message: newStatus === "blocked" ? "Đã chặn slot" : "Đã mở slot",
      status:  newStatus,
    });
  } catch (err) {
    return sendError(res, 500, "Lỗi thay đổi trạng thái slot", err);
  }
};

// =============================
// ❌ DELETE SLOT
// =============================
exports.deleteSlot = async (req, res) => {
  const { id } = req.params;

  try {
    const slots = await queryAsync(
      `SELECT status, court_id FROM time_slots WHERE id = ?`,
      [id]
    );

    if (!slots.length) return sendError(res, 404, "Không tìm thấy slot");

    const isOwner = await checkCourtOwner(slots[0].court_id, req.user);
    if (!isOwner) return sendError(res, 403, "Không có quyền xóa slot này");

    if (slots[0].status === "booked") {
      return sendError(res, 400, "Không thể xóa slot đã được đặt");
    }

    await queryAsync(`DELETE FROM time_slots WHERE id = ?`, [id]);
    return res.json({ message: "Xóa slot thành công" });
  } catch (err) {
    return sendError(res, 500, "Lỗi xóa slot", err);
  }
};

// =============================
// 🗑 DELETE BULK — xóa hàng loạt
// theo sân + ngày hoặc khoảng ngày
// chỉ xóa slot available + blocked, giữ lại booked
// =============================
exports.deleteBulkSlots = async (req, res) => {
  const { court_id, date, date_from, date_to } = req.body;

  const from = date_from || date;
  const to   = date_to   || date;

  if (!court_id || !from) {
    return sendError(res, 400, "Thiếu court_id hoặc ngày");
  }

  if (new Date(from) > new Date(to)) {
    return sendError(res, 400, "Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc");
  }

  try {
    const isOwner = await checkCourtOwner(court_id, req.user);
    if (!isOwner) return sendError(res, 403, "Không có quyền xóa slot của sân này");

    const result = await queryAsync(
      `DELETE FROM time_slots
       WHERE court_id = ?
         AND date BETWEEN ? AND ?
         AND status != 'booked'`,
      [court_id, from, to]
    );

    return res.json({
      message: `Đã xóa ${result.affectedRows} slot (giữ lại slot đã được đặt)`,
      deleted:   result.affectedRows,
      date_from: from,
      date_to:   to,
    });
  } catch (err) {
    return sendError(res, 500, "Lỗi xóa hàng loạt slot", err);
  }
};