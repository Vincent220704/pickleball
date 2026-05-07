const nodemailer = require("nodemailer");

// ─── Tạo transporter một lần duy nhất (tránh tạo lại mỗi lần gọi) ───────────
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  pool: true,          // dùng connection pool thay vì mở/đóng mỗi lần
  maxConnections: 5,
  maxMessages: 100,
});

// ─── Verify kết nối khi khởi động (log 1 lần) ───────────────────────────────
transporter.verify((err) => {
  if (err) console.error("❌ Mail transporter lỗi:", err.message);
  else     console.log("✅ Mail transporter sẵn sàng");
});

// ─── Hàm gửi mail ────────────────────────────────────────────────────────────
const sendEmail = async (to, subject, html) => {
  if (!to || !subject || !html) {
    throw new Error("sendEmail: thiếu tham số (to, subject, html)");
  }

  const info = await transporter.sendMail({
    from:    `"Pickleball" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });

  console.log(`📩 Mail gửi tới ${to} — ID: ${info.messageId}`);
  return info;
};

module.exports = sendEmail;