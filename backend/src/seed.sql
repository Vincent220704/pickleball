-- ============================================================
-- 🌱 SEED DATA — Pickleball Booking System
-- Chạy file này trong phpMyAdmin tab SQL
-- ⚠️  Chạy sau khi db.js đã tạo xong tất cả bảng
-- ============================================================

-- ════════════════════════════════════════
-- 👤 USERS
-- password của tất cả account: Test@123456
-- hash bcrypt rounds=10
-- ════════════════════════════════════════
INSERT INTO users (name, email, password, phone, role, status) VALUES
-- super_admin
('Super Admin',    'superadmin@pickle.vn', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0900000001', 'super_admin', 'active'),
-- admin
('Nguyễn Văn Admin',  'admin1@pickle.vn',  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0900000002', 'admin', 'active'),
('Trần Thị Admin',    'admin2@pickle.vn',  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0900000003', 'admin', 'active'),
-- user
('Lê Văn An',         'an@gmail.com',      '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0911111111', 'user',  'active'),
('Phạm Thị Bình',     'binh@gmail.com',    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0922222222', 'user',  'active'),
('Hoàng Minh Cường',  'cuong@gmail.com',   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0933333333', 'user',  'active'),
('Ngô Thị Dung',      'dung@gmail.com',    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0944444444', 'user',  'active'),
('Vũ Quốc Đạt',       'dat@gmail.com',     '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0955555555', 'user',  'active');

-- ════════════════════════════════════════
-- 🏟 COURTS (owner_id = 2 hoặc 3 = admin)
-- ════════════════════════════════════════
INSERT INTO courts (owner_id, name, slug, location, description, surface_type, price, open_time, close_time, status) VALUES
(2, 'Sân Pickleball Đà Nẵng 1', 'san-da-nang-1', '123 Nguyễn Văn Linh, Đà Nẵng', 'Sân tiêu chuẩn quốc tế, mái che, đèn LED cao cấp', 'indoor',   150000, '06:00:00', '22:00:00', 'active'),
(2, 'Sân Pickleball Đà Nẵng 2', 'san-da-nang-2', '456 Lê Duẩn, Đà Nẵng',         'Sân ngoài trời view biển, thoáng mát',               'outdoor',  120000, '06:00:00', '21:00:00', 'active'),
(3, 'Sân Pickleball Hội An',    'san-hoi-an',    '789 Cửa Đại, Hội An',           'Sân trong khu resort, không gian xanh',               'outdoor',  130000, '07:00:00', '21:00:00', 'active'),
(3, 'Sân Pickleball Huế',       'san-hue',       '101 Hùng Vương, Huế',           'Sân mái vòm hiện đại, gần trung tâm',                 'indoor',   140000, '06:00:00', '22:00:00', 'active'),
(2, 'Sân Pickleball Tam Kỳ',    'san-tam-ky',    '202 Trần Phú, Tam Kỳ',          'Sân mới khai trương, giá ưu đãi',                     'concrete', 100000, '06:00:00', '21:00:00', 'active');

-- ════════════════════════════════════════
-- 🕐 TIME SLOTS (tạo cho 3 ngày tới)
-- court_id 1..5, mỗi sân 6 slot/ngày
-- ════════════════════════════════════════
INSERT INTO time_slots (court_id, date, start_time, end_time, price, status) VALUES
-- Sân 1
(1, CURDATE(), '06:00:00', '07:30:00', NULL, 'booked'),
(1, CURDATE(), '07:30:00', '09:00:00', NULL, 'booked'),
(1, CURDATE(), '09:00:00', '10:30:00', NULL, 'available'),
(1, CURDATE(), '15:00:00', '16:30:00', NULL, 'available'),
(1, CURDATE(), '16:30:00', '18:00:00', NULL, 'booked'),
(1, CURDATE(), '18:00:00', '19:30:00', 180000, 'available'),  -- giờ vàng giá cao hơn

(1, DATE_ADD(CURDATE(),INTERVAL 1 DAY), '06:00:00', '07:30:00', NULL, 'available'),
(1, DATE_ADD(CURDATE(),INTERVAL 1 DAY), '07:30:00', '09:00:00', NULL, 'available'),
(1, DATE_ADD(CURDATE(),INTERVAL 1 DAY), '09:00:00', '10:30:00', NULL, 'available'),
(1, DATE_ADD(CURDATE(),INTERVAL 1 DAY), '18:00:00', '19:30:00', 180000, 'available'),

(1, DATE_ADD(CURDATE(),INTERVAL 2 DAY), '06:00:00', '07:30:00', NULL, 'available'),
(1, DATE_ADD(CURDATE(),INTERVAL 2 DAY), '18:00:00', '19:30:00', 180000, 'available'),

-- Sân 2
(2, CURDATE(), '06:00:00', '07:30:00', NULL, 'booked'),
(2, CURDATE(), '07:30:00', '09:00:00', NULL, 'available'),
(2, CURDATE(), '09:00:00', '10:30:00', NULL, 'available'),
(2, CURDATE(), '16:30:00', '18:00:00', NULL, 'booked'),
(2, CURDATE(), '18:00:00', '19:30:00', 150000, 'available'),

(2, DATE_ADD(CURDATE(),INTERVAL 1 DAY), '06:00:00', '07:30:00', NULL, 'available'),
(2, DATE_ADD(CURDATE(),INTERVAL 1 DAY), '18:00:00', '19:30:00', 150000, 'available'),

-- Sân 3
(3, CURDATE(), '07:00:00', '08:30:00', NULL, 'booked'),
(3, CURDATE(), '08:30:00', '10:00:00', NULL, 'available'),
(3, CURDATE(), '16:00:00', '17:30:00', NULL, 'booked'),
(3, CURDATE(), '17:30:00', '19:00:00', 160000, 'available'),

(3, DATE_ADD(CURDATE(),INTERVAL 1 DAY), '07:00:00', '08:30:00', NULL, 'available'),
(3, DATE_ADD(CURDATE(),INTERVAL 1 DAY), '17:30:00', '19:00:00', 160000, 'available'),

-- Sân 4
(4, CURDATE(), '06:00:00', '07:30:00', NULL, 'booked'),
(4, CURDATE(), '07:30:00', '09:00:00', NULL, 'available'),
(4, CURDATE(), '18:00:00', '19:30:00', 170000, 'available'),

(4, DATE_ADD(CURDATE(),INTERVAL 1 DAY), '06:00:00', '07:30:00', NULL, 'available'),
(4, DATE_ADD(CURDATE(),INTERVAL 1 DAY), '18:00:00', '19:30:00', 170000, 'available'),

-- Sân 5
(5, CURDATE(), '06:00:00', '07:30:00', NULL, 'available'),
(5, CURDATE(), '07:30:00', '09:00:00', NULL, 'booked'),
(5, CURDATE(), '18:00:00', '19:30:00', 120000, 'available'),

(5, DATE_ADD(CURDATE(),INTERVAL 1 DAY), '06:00:00', '07:30:00', NULL, 'available'),
(5, DATE_ADD(CURDATE(),INTERVAL 1 DAY), '18:00:00', '19:30:00', 120000, 'available');

-- ════════════════════════════════════════
-- 📅 BOOKINGS (20 bookings)
-- slot_id tương ứng với các slot status='booked'
-- ════════════════════════════════════════
INSERT INTO bookings (user_id, court_id, slot_id, date, start_time, end_time, total_price, status, payment_status, note) VALUES
-- Slot 1 (court 1, hôm nay 06:00)
(4, 1, 1,  CURDATE(), '06:00:00', '07:30:00', 150000, 'approved',  'paid',   'Đặt thường xuyên'),
-- Slot 2 (court 1, hôm nay 07:30)
(5, 1, 2,  CURDATE(), '07:30:00', '09:00:00', 150000, 'approved',  'paid',   NULL),
-- Slot 5 (court 1, hôm nay 16:30)
(6, 1, 5,  CURDATE(), '16:30:00', '18:00:00', 150000, 'approved',  'unpaid', 'Nhóm 4 người'),
-- Slot 13 (court 2, hôm nay 06:00)
(7, 2, 13, CURDATE(), '06:00:00', '07:30:00', 120000, 'approved',  'paid',   NULL),
-- Slot 16 (court 2, hôm nay 16:30)
(8, 2, 16, CURDATE(), '16:30:00', '18:00:00', 120000, 'pending',   'unpaid', NULL),
-- Slot 20 (court 3, hôm nay 07:00)
(4, 3, 20, CURDATE(), '07:00:00', '08:30:00', 130000, 'approved',  'paid',   NULL),
-- Slot 22 (court 3, hôm nay 16:00)
(5, 3, 22, CURDATE(), '16:00:00', '17:30:00', 130000, 'rejected',  'unpaid', NULL),
-- Slot 26 (court 4, hôm nay 06:00)
(6, 4, 26, CURDATE(), '06:00:00', '07:30:00', 140000, 'approved',  'paid',   'Đặt cho câu lạc bộ'),
-- Slot 31 (court 5, hôm nay 07:30)
(7, 5, 32, CURDATE(), '07:30:00', '09:00:00', 100000, 'approved',  'paid',   NULL),
-- Thêm bookings với status đa dạng
(8, 1, 1,  DATE_SUB(CURDATE(),INTERVAL 3 DAY), '06:00:00', '07:30:00', 150000, 'approved',  'paid',   NULL),
(4, 2, 13, DATE_SUB(CURDATE(),INTERVAL 5 DAY), '06:00:00', '07:30:00', 120000, 'approved',  'paid',   NULL),
(5, 3, 20, DATE_SUB(CURDATE(),INTERVAL 2 DAY), '07:00:00', '08:30:00', 130000, 'cancelled', 'refunded','Bận đột xuất'),
(6, 4, 26, DATE_SUB(CURDATE(),INTERVAL 7 DAY), '06:00:00', '07:30:00', 140000, 'approved',  'paid',   NULL),
(7, 5, 32, DATE_SUB(CURDATE(),INTERVAL 1 DAY), '07:30:00', '09:00:00', 100000, 'approved',  'paid',   NULL),
(8, 1, 2,  DATE_SUB(CURDATE(),INTERVAL 4 DAY), '07:30:00', '09:00:00', 150000, 'approved',  'paid',   NULL),
(4, 2, 16, DATE_SUB(CURDATE(),INTERVAL 6 DAY), '16:30:00', '18:00:00', 120000, 'rejected',  'unpaid', NULL),
(5, 3, 22, DATE_SUB(CURDATE(),INTERVAL 8 DAY), '16:00:00', '17:30:00', 130000, 'approved',  'paid',   NULL),
(6, 4, 26, DATE_SUB(CURDATE(),INTERVAL 9 DAY), '06:00:00', '07:30:00', 140000, 'approved',  'paid',   NULL),
(7, 1, 5,  DATE_SUB(CURDATE(),INTERVAL 2 DAY), '16:30:00', '18:00:00', 150000, 'pending',   'unpaid', 'Chờ xác nhận'),
(8, 5, 32, DATE_SUB(CURDATE(),INTERVAL 3 DAY), '07:30:00', '09:00:00', 100000, 'approved',  'paid',   NULL);

-- ════════════════════════════════════════
-- 💳 PAYMENTS (cho các booking đã paid)
-- ════════════════════════════════════════
INSERT INTO payments (booking_id, user_id, amount, method, transaction_id, status, paid_at) VALUES
(1,  4, 150000, 'momo',    'MOMO20240001', 'success', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(2,  5, 150000, 'banking', 'BANK20240002', 'success', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(4,  7, 120000, 'momo',    'MOMO20240003', 'success', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(6,  4, 130000, 'vnpay',   'VNPAY2024001', 'success', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(8,  6, 140000, 'cash',    NULL,           'success', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(9,  7, 100000, 'momo',    'MOMO20240004', 'success', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(10, 8, 150000, 'banking', 'BANK20240005', 'success', DATE_SUB(NOW(), INTERVAL 3 DAY)),
(11, 4, 120000, 'momo',    'MOMO20240006', 'success', DATE_SUB(NOW(), INTERVAL 5 DAY)),
(12, 5, 130000, 'vnpay',   'VNPAY2024002', 'refunded',DATE_SUB(NOW(), INTERVAL 2 DAY)),
(13, 6, 140000, 'cash',    NULL,           'success', DATE_SUB(NOW(), INTERVAL 7 DAY)),
(14, 7, 100000, 'momo',    'MOMO20240007', 'success', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(15, 8, 150000, 'banking', 'BANK20240008', 'success', DATE_SUB(NOW(), INTERVAL 4 DAY)),
(17, 5, 130000, 'momo',    'MOMO20240009', 'success', DATE_SUB(NOW(), INTERVAL 8 DAY)),
(18, 6, 140000, 'cash',    NULL,           'success', DATE_SUB(NOW(), INTERVAL 9 DAY)),
(20, 8, 100000, 'vnpay',   'VNPAY2024003', 'success', DATE_SUB(NOW(), INTERVAL 3 DAY));

-- ════════════════════════════════════════
-- ⭐ REVIEWS (chỉ booking approved + paid)
-- ════════════════════════════════════════
INSERT INTO reviews (court_id, user_id, booking_id, rating, comment) VALUES
(1, 4, 1,  5, 'Sân đẹp, nhân viên nhiệt tình, chắc chắn sẽ quay lại!'),
(1, 5, 2,  4, 'Sân tốt nhưng bãi đỗ xe hơi chật'),
(2, 7, 4,  5, 'View đẹp, thoáng mát, rất thích hợp buổi sáng'),
(3, 4, 6,  4, 'Không gian xanh mát, giá hợp lý'),
(4, 6, 8,  5, 'Sân mới, sạch sẽ, ánh sáng tốt'),
(5, 7, 9,  3, 'Sân ổn nhưng mặt sân hơi trơn sau mưa'),
(1, 8, 10, 4, 'Chất lượng đều, đáng đồng tiền'),
(2, 4, 11, 5, 'Rất hài lòng, sẽ giới thiệu bạn bè'),
(4, 6, 13, 4, 'Nhân viên thân thiện, sân sạch'),
(5, 8, 20, 4, 'Giá rẻ nhất khu vực, chất lượng ổn');

-- ════════════════════════════════════════
-- 📰 NEWS CATEGORIES
-- ════════════════════════════════════════
INSERT INTO news_categories (name, slug) VALUES
('Tin tức',        'tin-tuc'),
('Giải đấu',       'giai-dau'),
('Hướng dẫn',      'huong-dan'),
('Khuyến mãi',     'khuyen-mai'),
('Sức khỏe',       'suc-khoe');

-- ════════════════════════════════════════
-- 📰 NEWS (author_id = 2 hoặc 3 = admin)
-- ════════════════════════════════════════
INSERT INTO news (title, slug, thumbnail, summary, content, category_id, author_id, status, views, published_at) VALUES
(
  'Pickleball – Môn thể thao hot nhất 2025',
  'pickleball-mon-the-thao-hot-nhat-2025',
  'https://placehold.co/800x400?text=Pickleball+2025',
  'Pickleball đang bùng nổ tại Việt Nam với hàng nghìn người chơi mới mỗi tháng.',
  '<h2>Pickleball là gì?</h2><p>Pickleball là môn thể thao kết hợp giữa tennis, cầu lông và bóng bàn. Sân nhỏ hơn tennis, dễ học, phù hợp mọi lứa tuổi.</p><h2>Tại sao hot?</h2><p>Chi phí thấp, dễ chơi, cộng đồng thân thiện — đó là lý do pickleball bùng nổ tại Việt Nam năm 2025.</p>',
  1, 2, 'published', 1250, DATE_SUB(NOW(), INTERVAL 10 DAY)
),
(
  'Giải Pickleball Mở Rộng Đà Nẵng 2025',
  'giai-pickleball-mo-rong-da-nang-2025',
  'https://placehold.co/800x400?text=Giai+Da+Nang+2025',
  'Giải đấu lớn nhất miền Trung sẽ diễn ra vào tháng 6/2025 tại Đà Nẵng.',
  '<h2>Thông tin giải đấu</h2><p>Thời gian: 15-16/06/2025. Địa điểm: Sân Pickleball Đà Nẵng 1. Giải thưởng lên đến 50 triệu đồng.</p><h2>Đăng ký</h2><p>Liên hệ hotline 0900000002 để đăng ký tham dự.</p>',
  2, 2, 'published', 890,  DATE_SUB(NOW(), INTERVAL 7 DAY)
),
(
  'Hướng dẫn chọn vợt Pickleball cho người mới',
  'huong-dan-chon-vot-pickleball-cho-nguoi-moi',
  'https://placehold.co/800x400?text=Chon+Vot+Pickleball',
  'Chọn vợt đúng sẽ giúp bạn tiến bộ nhanh hơn. Dưới đây là những tiêu chí quan trọng.',
  '<h2>Trọng lượng</h2><p>Người mới nên chọn vợt nhẹ 200-220g để dễ kiểm soát.</p><h2>Chất liệu</h2><p>Composite là lựa chọn tốt nhất cho người mới — bền, giá hợp lý.</p>',
  3, 3, 'published', 2100, DATE_SUB(NOW(), INTERVAL 5 DAY)
),
(
  'Khuyến mãi tháng 6 – Giảm 20% tất cả khung giờ sáng',
  'khuyen-mai-thang-6-giam-20-phan-tram',
  'https://placehold.co/800x400?text=Khuyen+Mai+Thang+6',
  'Đặt sân khung giờ 6:00 - 9:00 trong tháng 6 được giảm ngay 20%.',
  '<h2>Chương trình khuyến mãi</h2><p>Áp dụng: 01/06 - 30/06/2025. Giảm 20% tất cả sân trong khung giờ 6:00 - 9:00 sáng. Không giới hạn số lần đặt.</p>',
  4, 2, 'published', 3400, DATE_SUB(NOW(), INTERVAL 3 DAY)
),
(
  '5 lợi ích sức khỏe của Pickleball',
  '5-loi-ich-suc-khoe-cua-pickleball',
  'https://placehold.co/800x400?text=Suc+Khoe+Pickleball',
  'Pickleball không chỉ vui mà còn mang lại nhiều lợi ích tuyệt vời cho sức khỏe.',
  '<h2>1. Tăng cường tim mạch</h2><p>30 phút pickleball tương đương 45 phút đi bộ nhanh.</p><h2>2. Cải thiện phản xạ</h2><p>Bóng di chuyển nhanh giúp não và mắt phối hợp tốt hơn.</p>',
  5, 3, 'published', 1780, DATE_SUB(NOW(), INTERVAL 1 DAY)
),
(
  'Khai trương Sân Pickleball Tam Kỳ',
  'khai-truong-san-pickleball-tam-ky',
  'https://placehold.co/800x400?text=Khai+Truong+Tam+Ky',
  'Sân mới nhất của hệ thống chính thức hoạt động từ tháng 5/2025.',
  '<h2>Sân mới hiện đại</h2><p>Sân Pickleball Tam Kỳ tọa lạc tại 202 Trần Phú, với mặt sân bê tông cao cấp, hệ thống đèn LED, phòng thay đồ tiện nghi.</p>',
  1, 2, 'draft', 0, NULL
);

-- ════════════════════════════════════════
-- 🔔 NOTIFICATIONS
-- ════════════════════════════════════════
INSERT INTO notifications (user_id, title, message, type, ref_id, is_read) VALUES
(4, 'Đặt sân thành công',       'Booking sân Pickleball Đà Nẵng 1 ngày hôm nay đã được xác nhận.',          'booking_approved', 1,  true),
(5, 'Đặt sân thành công',       'Booking sân Pickleball Đà Nẵng 1 đã được duyệt.',                          'booking_approved', 2,  true),
(6, 'Booking chờ thanh toán',   'Booking sân Pickleball Đà Nẵng 1 đã duyệt, vui lòng thanh toán.',          'booking_approved', 3,  false),
(7, 'Đặt sân thành công',       'Booking sân Pickleball Đà Nẵng 2 đã được xác nhận.',                       'booking_approved', 4,  true),
(8, 'Booking đang chờ duyệt',   'Booking sân Pickleball Đà Nẵng 2 đang chờ admin xác nhận.',                'booking_pending',  5,  false),
(5, 'Booking bị từ chối',       'Rất tiếc, booking sân Pickleball Hội An ngày hôm nay đã bị từ chối.',      'booking_rejected', 7,  true),
(7, 'Booking đang chờ duyệt',   'Booking sân Pickleball Đà Nẵng 1 đang được xử lý.',                        'booking_pending',  19, false),
(4, 'Thanh toán thành công',    'Thanh toán 150,000đ cho booking sân Pickleball Đà Nẵng 1 thành công.',     'payment_success',  1,  true),
(5, 'Thanh toán thành công',    'Thanh toán 150,000đ qua banking thành công.',                               'payment_success',  2,  true),
(5, 'Hoàn tiền thành công',     'Hoàn tiền 130,000đ cho booking đã huỷ. Vui lòng kiểm tra tài khoản.',      'payment_refunded', 12, false),
(4, 'Tin tức mới',              'Khuyến mãi tháng 6 – Giảm 20% khung giờ sáng. Đặt ngay!',                 'news_published',   4,  false),
(5, 'Tin tức mới',              'Giải Pickleball Mở Rộng Đà Nẵng 2025 sắp diễn ra. Đăng ký ngay!',         'news_published',   2,  true),
(6, 'Tin tức mới',              'Khuyến mãi tháng 6 – Giảm 20% khung giờ sáng. Đặt ngay!',                 'news_published',   4,  false),
(7, 'Tin tức mới',              'Hướng dẫn chọn vợt Pickleball cho người mới.',                             'news_published',   3,  true),
(8, 'Chào mừng bạn!',          'Chào mừng bạn đến với Pickleball Booking. Đặt sân ngay hôm nay!',          'welcome',          NULL, true);
