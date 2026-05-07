const { app, dbReady } = require("./src/app");
const { cancelExpiredPayments } = require("./src/controllers/paymentController");
const notificationRoutes = require("./src/routes/notificationRoutes");

const PORT = process.env.PORT || 5000;
app.use("/api/notifications", notificationRoutes);

dbReady.then(() => {
  app.listen(PORT, () => console.log(`🚀 Server chạy tại http://localhost:${PORT}`));

  // Chạy ngay khi khởi động
  cancelExpiredPayments();

  // Chạy mỗi 5 phút
  setInterval(cancelExpiredPayments, 5 * 60 * 1000);
}).catch((err) => {
  console.error("❌ Không thể khởi động server:", err);
  process.exit(1);
});