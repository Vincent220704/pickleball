const { connection: db } = require("../config/db");

const queryAsync = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.query(sql, params, (err, result) =>
      err ? reject(err) : resolve(result)
    )
  );

// 🔔 tạo notification (dùng nội bộ)
const createNotification = async ({
  user_id,
  title,
  message = null,
  type = null,
  ref_id = null,
}) => {
  try {
    if (!user_id || !title) return;

    await queryAsync(
      `INSERT INTO notifications (user_id, title, message, type, ref_id)
       VALUES (?, ?, ?, ?, ?)`,
      [user_id, title, message, type, ref_id]
    );
  } catch (err) {
    console.error("❌ createNotification error:", err);
  }
};

module.exports = {
  createNotification,
};