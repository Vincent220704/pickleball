require('dotenv').config();
const mysql = require('mysql2');

// ─────────────────────────────────────────
// KẾT NỐI MYSQL (chưa chọn DB)
// ─────────────────────────────────────────
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT,
  multipleStatements: true
});

// ─────────────────────────────────────────
// HELPER: query dưới dạng Promise
// ─────────────────────────────────────────
function query(sql) {
  return new Promise((resolve, reject) => {
    connection.query(sql, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

// ─────────────────────────────────────────
// TẠO TOÀN BỘ BẢNG (theo thứ tự có FK)
// ─────────────────────────────────────────
async function createTables() {

  // ════════════════════════════════════════
  // 👤 USERS
  // ════════════════════════════════════════
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id                  INT AUTO_INCREMENT PRIMARY KEY,
      name                VARCHAR(100) NOT NULL,
      email               VARCHAR(100) UNIQUE NOT NULL,
      password            VARCHAR(255) NOT NULL,
      phone               VARCHAR(20),
      avatar              VARCHAR(500),
      role                ENUM('user','admin','super_admin') DEFAULT 'user',
      status              ENUM('active','banned') DEFAULT 'active',
      reset_token         VARCHAR(255),
      reset_token_expire  BIGINT,
      is_verified         TINYINT(1) DEFAULT 0,
      created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  console.log('✅ Table: users');

  // ════════════════════════════════════════
  // 🏟 COURTS
  // ════════════════════════════════════════
  await query(`
    CREATE TABLE IF NOT EXISTS courts (
      id            INT AUTO_INCREMENT PRIMARY KEY,
      owner_id      INT NOT NULL,
      name          VARCHAR(100) NOT NULL,
      slug          VARCHAR(150) UNIQUE NOT NULL,
      location      VARCHAR(255),
      description   TEXT,
      images        JSON,
      surface_type  VARCHAR(50),
      price         INT NOT NULL,
      open_time     TIME NOT NULL DEFAULT '06:00:00',
      close_time    TIME NOT NULL DEFAULT '22:00:00',
      status        ENUM('active','inactive','maintenance') DEFAULT 'active',
      created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  console.log('✅ Table: courts');

  // ════════════════════════════════════════
  // 🕐 TIME SLOTS
  // ════════════════════════════════════════
  await query(`
    CREATE TABLE IF NOT EXISTS time_slots (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      court_id    INT NOT NULL,
      date        DATE NOT NULL,
      start_time  TIME NOT NULL,
      end_time    TIME NOT NULL,
      price       INT,
      status      ENUM('available','booked','blocked') DEFAULT 'available',
      FOREIGN KEY (court_id) REFERENCES courts(id) ON DELETE CASCADE,
      UNIQUE KEY no_duplicate_slot (court_id, date, start_time)
    )
  `);
  console.log('✅ Table: time_slots');

  // ════════════════════════════════════════
  // 📅 BOOKINGS
  // slot_id = slot đầu tiên
  // start_time/end_time = span toàn bộ các slot
  // ════════════════════════════════════════
  await query(`
    CREATE TABLE IF NOT EXISTS bookings (
      id              INT AUTO_INCREMENT PRIMARY KEY,
      user_id         INT NOT NULL,
      court_id        INT NOT NULL,
      slot_id         INT NOT NULL,
      date            DATE NOT NULL,
      start_time      TIME NOT NULL,
      end_time        TIME NOT NULL,
      total_price     INT NOT NULL,
      status          ENUM('pending','approved','rejected','cancelled') DEFAULT 'pending',
      payment_status  ENUM('unpaid','paid','refunded') DEFAULT 'unpaid',
      note            TEXT,
      cancelled_at    TIMESTAMP NULL,
      cancel_reason   TEXT,
      created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id)   REFERENCES users(id)       ON DELETE CASCADE,
      FOREIGN KEY (court_id)  REFERENCES courts(id)      ON DELETE CASCADE,
      FOREIGN KEY (slot_id)   REFERENCES time_slots(id)  ON DELETE CASCADE
    )
  `);
  console.log('✅ Table: bookings');

  // ════════════════════════════════════════
  // 🔗 BOOKING SLOTS — nhiều slot cho 1 booking
  // ════════════════════════════════════════
  await query(`
    CREATE TABLE IF NOT EXISTS booking_slots (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      booking_id  INT NOT NULL,
      slot_id     INT NOT NULL,
      price       INT NOT NULL,
      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
      FOREIGN KEY (slot_id)    REFERENCES time_slots(id) ON DELETE CASCADE,
      UNIQUE KEY no_duplicate (booking_id, slot_id)
    )
  `);
  console.log('✅ Table: booking_slots');

  // ════════════════════════════════════════
  // 💳 PAYMENTS
  // ════════════════════════════════════════
  await query(`
    CREATE TABLE IF NOT EXISTS payments (
      id              INT AUTO_INCREMENT PRIMARY KEY,
      booking_id      INT NOT NULL,
      user_id         INT NOT NULL,
      amount          INT NOT NULL,
      method          ENUM('cash','momo','banking','vnpay') NOT NULL,
      transaction_id  VARCHAR(255),
      status          ENUM('pending','success','failed','refunded') DEFAULT 'pending',
      note            TEXT,
      paid_at         TIMESTAMP NULL,
      created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE
    )
  `);
  console.log('✅ Table: payments');

  // ════════════════════════════════════════
  // ⭐ REVIEWS
  // ════════════════════════════════════════
  await query(`
    CREATE TABLE IF NOT EXISTS reviews (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      court_id    INT NOT NULL,
      user_id     INT NOT NULL,
      booking_id  INT NOT NULL,
      rating      TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
      comment     TEXT,
      created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (court_id)   REFERENCES courts(id)   ON DELETE CASCADE,
      FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
      UNIQUE KEY one_review_per_booking (booking_id)
    )
  `);
  console.log('✅ Table: reviews');

  // ════════════════════════════════════════
  // 📰 NEWS CATEGORIES
  // ════════════════════════════════════════
  await query(`
    CREATE TABLE IF NOT EXISTS news_categories (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      name        VARCHAR(100) NOT NULL,
      slug        VARCHAR(100) UNIQUE NOT NULL,
      created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('✅ Table: news_categories');

  // ════════════════════════════════════════
  // 📰 NEWS
  // ════════════════════════════════════════
  await query(`
    CREATE TABLE IF NOT EXISTS news (
      id            INT AUTO_INCREMENT PRIMARY KEY,
      title         VARCHAR(255) NOT NULL,
      slug          VARCHAR(255) UNIQUE NOT NULL,
      thumbnail     VARCHAR(500),
      summary       TEXT,
      content       LONGTEXT NOT NULL,
      category_id   INT,
      author_id     INT,
      status        ENUM('draft','published','archived') DEFAULT 'draft',
      views         INT DEFAULT 0,
      published_at  TIMESTAMP NULL,
      created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES news_categories(id) ON DELETE SET NULL,
      FOREIGN KEY (author_id)   REFERENCES users(id)           ON DELETE SET NULL
    )
  `);
  console.log('✅ Table: news');

  // ════════════════════════════════════════
  // 🔔 NOTIFICATIONS
  // ════════════════════════════════════════
  await query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      user_id     INT NOT NULL,
      title       VARCHAR(255) NOT NULL,
      message     TEXT,
      type        VARCHAR(50),
      ref_id      INT,
      is_read     BOOLEAN DEFAULT FALSE,
      created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  console.log('✅ Table: notifications');

  console.log('\n🎉 Tất cả bảng đã sẵn sàng!\n');
}

// ─────────────────────────────────────────
// KHỞI ĐỘNG
// ─────────────────────────────────────────
const dbReady = new Promise((resolve, reject) => {
  connection.connect(async (err) => {
    if (err) {
      console.error('❌ Kết nối MySQL thất bại:', err);
      return reject(err);
    }
    console.log('✅ Kết nối MySQL thành công!');

    try {
      await query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``);
      console.log(`✅ Database "${process.env.DB_NAME}" sẵn sàng`);

      await new Promise((res, rej) =>
        connection.changeUser({ database: process.env.DB_NAME }, e => e ? rej(e) : res())
      );
      console.log(`✅ Đã chọn database "${process.env.DB_NAME}"\n`);

      await createTables();
      resolve(connection);
    } catch (e) {
      console.error('❌ Lỗi khởi tạo DB:', e);
      reject(e);
    }
  });
});

module.exports = { connection, dbReady };