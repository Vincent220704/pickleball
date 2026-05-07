const { connection: db } = require("../config/db");

const queryAsync = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.query(sql, params, (err, result) => (err ? reject(err) : resolve(result)))
  );

const sendError = (res, status, message, err = null) => {
  if (err) console.error(`[statsController] ${message}:`, err);
  return res.status(status).json({ message });
};

// ─── Helper: build date range từ preset hoặc from/to ─────────────────────────
// preset: "7d" | "30d" | "thisMonth" | "custom"
// from, to: "YYYY-MM-DD"
const buildDateRange = (preset, from, to) => {
  switch (preset) {
    case "7d":
      return {
        sql: `b.created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY) AND b.created_at < CURDATE() + INTERVAL 1 DAY`,
        groupBy: `DATE(b.created_at)`,
        labelFmt: `DATE_FORMAT(b.created_at, '%d/%m')`,
      };
    case "30d":
      return {
        sql: `b.created_at >= DATE_SUB(CURDATE(), INTERVAL 29 DAY) AND b.created_at < CURDATE() + INTERVAL 1 DAY`,
        groupBy: `DATE(b.created_at)`,
        labelFmt: `DATE_FORMAT(b.created_at, '%d/%m')`,
      };
    case "thisMonth":
      return {
        sql: `MONTH(b.created_at) = MONTH(NOW()) AND YEAR(b.created_at) = YEAR(NOW())`,
        groupBy: `DATE(b.created_at)`,
        labelFmt: `DATE_FORMAT(b.created_at, '%d/%m')`,
      };
    case "custom":
      return {
        sql: `DATE(b.created_at) = '${from}'`,
        groupBy: `HOUR(b.created_at)`,
        labelFmt: `CONCAT(LPAD(HOUR(b.created_at),2,'0'), 'h')`,
      };
    default: // mặc định 7 ngày
      return {
        sql: `b.created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY) AND b.created_at < CURDATE() + INTERVAL 1 DAY`,
        groupBy: `DATE(b.created_at)`,
        labelFmt: `DATE_FORMAT(b.created_at, '%d/%m')`,
      };
  }
};

// =============================
// 📊 SUPER ADMIN — toàn hệ thống
// =============================
const getSuperAdminStats = async (preset = "7d", from, to) => {
  const totalBookings   = await queryAsync(`SELECT COUNT(*) AS total FROM bookings`);
  const pendingBookings = await queryAsync(`SELECT COUNT(*) AS total FROM bookings WHERE status='pending'`);
  const totalRevenue    = await queryAsync(`SELECT COALESCE(SUM(total_price),0) AS total FROM bookings WHERE status='approved' AND payment_status='paid'`);
  const monthRevenue    = await queryAsync(`
    SELECT COALESCE(SUM(total_price),0) AS total FROM bookings
    WHERE status='approved' AND payment_status='paid'
      AND MONTH(created_at)=MONTH(NOW()) AND YEAR(created_at)=YEAR(NOW())
  `);
  const totalCourts = await queryAsync(`SELECT COUNT(*) AS total FROM courts WHERE status='active'`);
  const totalUsers  = await queryAsync(`SELECT COUNT(*) AS total FROM users WHERE role='user'`);
  const totalAdmins = await queryAsync(`SELECT COUNT(*) AS total FROM users WHERE role='admin'`);

  // Doanh thu theo filter
  const range = buildDateRange(preset, from, to);
  const revenueByDay = await queryAsync(`
    SELECT
      ${range.labelFmt} AS day,
      COALESCE(SUM(b.total_price), 0) AS revenue
    FROM bookings b
    WHERE b.status='approved' AND b.payment_status='paid'
      AND ${range.sql}
    GROUP BY ${range.groupBy}
    ORDER BY ${range.groupBy} ASC
  `);

  // Top 5 sân
  const topCourts = await queryAsync(`
    SELECT
      c.name,
      COUNT(b.id)                     AS total_bookings,
      COALESCE(SUM(b.total_price), 0) AS revenue
    FROM bookings b
    JOIN courts c ON b.court_id = c.id
    WHERE b.status = 'approved'
    GROUP BY b.court_id
    ORDER BY total_bookings DESC
    LIMIT 5
  `);

  // Booking theo status
  const bookingsByStatus = await queryAsync(`
    SELECT status, COUNT(*) AS total FROM bookings GROUP BY status
  `);

  // 5 booking pending mới nhất
  const pendingList = await queryAsync(`
    SELECT b.id, b.date, b.start_time, b.end_time, b.total_price,
           u.name AS user_name, c.name AS court_name
    FROM bookings b
    JOIN users  u ON b.user_id  = u.id
    JOIN courts c ON b.court_id = c.id
    WHERE b.status = 'pending'
    ORDER BY b.created_at DESC
    LIMIT 5
  `);

  return {
    role: "super_admin",
    preset,
    summary: {
      totalBookings:   totalBookings[0].total,
      pendingBookings: pendingBookings[0].total,
      totalRevenue:    totalRevenue[0].total,
      monthRevenue:    monthRevenue[0].total,
      totalCourts:     totalCourts[0].total,
      totalUsers:      totalUsers[0].total,
      totalAdmins:     totalAdmins[0].total,
    },
    revenueByDay,
    topCourts,
    bookingsByStatus,
    pendingList,
  };
};

// =============================
// 📊 ADMIN — chỉ sân của mình
// =============================
const getAdminStats = async (adminId, preset = "7d", from, to) => {
  const totalBookings   = await queryAsync(
    `SELECT COUNT(*) AS total FROM bookings b JOIN courts c ON b.court_id=c.id WHERE c.owner_id=?`,
    [adminId]
  );
  const pendingBookings = await queryAsync(
    `SELECT COUNT(*) AS total FROM bookings b JOIN courts c ON b.court_id=c.id WHERE c.owner_id=? AND b.status='pending'`,
    [adminId]
  );
  const totalRevenue    = await queryAsync(
    `SELECT COALESCE(SUM(b.total_price),0) AS total FROM bookings b JOIN courts c ON b.court_id=c.id WHERE c.owner_id=? AND b.status='approved' AND b.payment_status='paid'`,
    [adminId]
  );
  const monthRevenue    = await queryAsync(
    `SELECT COALESCE(SUM(b.total_price),0) AS total FROM bookings b JOIN courts c ON b.court_id=c.id
     WHERE c.owner_id=? AND b.status='approved' AND b.payment_status='paid'
       AND MONTH(b.created_at)=MONTH(NOW()) AND YEAR(b.created_at)=YEAR(NOW())`,
    [adminId]
  );
  const totalCourts = await queryAsync(
    `SELECT COUNT(*) AS total FROM courts WHERE owner_id=? AND status='active'`,
    [adminId]
  );

  // Doanh thu theo filter
  const range = buildDateRange(preset, from, to);
  const revenueByDay = await queryAsync(
    `SELECT
       ${range.labelFmt} AS day,
       COALESCE(SUM(b.total_price), 0) AS revenue
     FROM bookings b
     JOIN courts c ON b.court_id = c.id
     WHERE c.owner_id=? AND b.status='approved' AND b.payment_status='paid'
       AND ${range.sql}
     GROUP BY ${range.groupBy}
     ORDER BY ${range.groupBy} ASC`,
    [adminId]
  );

  // Slot hôm nay
  const todaySlotsResult = await queryAsync(
    `SELECT
       COUNT(*)                     AS total,
       SUM(ts.status='available')   AS available,
       SUM(ts.status='booked')      AS booked,
       SUM(ts.status='blocked')     AS blocked
     FROM time_slots ts
     JOIN courts c ON ts.court_id = c.id
     WHERE c.owner_id=? AND ts.date=CURDATE()`,
    [adminId]
  );

  // Booking pending
  const pendingList = await queryAsync(
    `SELECT b.id, b.date, b.start_time, b.end_time, b.total_price,
            u.name AS user_name, c.name AS court_name
     FROM bookings b
     JOIN courts c ON b.court_id = c.id
     JOIN users  u ON b.user_id  = u.id
     WHERE c.owner_id=? AND b.status='pending'
     ORDER BY b.created_at DESC
     LIMIT 5`,
    [adminId]
  );

  return {
    role: "admin",
    preset,
    summary: {
      totalBookings:   totalBookings[0].total,
      pendingBookings: pendingBookings[0].total,
      totalRevenue:    totalRevenue[0].total,
      monthRevenue:    monthRevenue[0].total,
      totalCourts:     totalCourts[0].total,
    },
    todaySlots: todaySlotsResult[0],
    revenueByDay,
    pendingList,
  };
};

// =============================
// 📊 GET DASHBOARD STATS
// =============================
exports.getDashboardStats = async (req, res) => {
  try {
    const { role, id } = req.user;
    // preset: "7d" | "30d" | "thisMonth" | "custom"
    // from: "YYYY-MM-DD" (chỉ dùng khi preset="custom")
    const { preset = "7d", from, to } = req.query;

    if (role === "super_admin") {
      const data = await getSuperAdminStats(preset, from, to);
      return res.json(data);
    }

    if (role === "admin") {
      const data = await getAdminStats(id, preset, from, to);
      return res.json(data);
    }

    return sendError(res, 403, "Không có quyền truy cập");
  } catch (err) {
    return sendError(res, 500, "Lỗi lấy thống kê", err);
  }
};