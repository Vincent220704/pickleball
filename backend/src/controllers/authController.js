const { connection: db } = require("../config/db");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');


// =============================
// 🔥 REGISTER
// =============================
exports.register = async (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Thiếu dữ liệu' });
  }

  db.query(
    'SELECT * FROM users WHERE email=?',
    [email],
    async (err, result) => {
      if (err) return res.status(500).json(err);

      if (result.length > 0) {
        return res.status(400).json({ message: 'Email đã tồn tại' });
      }

      const hashed = await bcrypt.hash(password, 10);

      // 🔥 Tạo token xác nhận email
      const rawToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

      db.query(
        'INSERT INTO users (name, email, password, phone, role, is_verified, reset_token) VALUES (?, ?, ?, ?, "user", 0, ?)',
        [name, email, hashed, phone || null, hashedToken],
        async (err, insertResult) => {
          if (err) return res.status(500).json(err);

          const verifyLink = `http://localhost:5000/api/auth/verify-email?token=${rawToken}`;

          try {
            await sendEmail(
              email,
              '✅ Xác nhận tài khoản',
              `
                <h2>Xác nhận tài khoản</h2>
                <p>Chào <b>${name}</b>, cảm ơn bạn đã đăng ký!</p>
                <p>Nhấn vào nút bên dưới để xác nhận email:</p>
                <a href="${verifyLink}" style="
                  display:inline-block;
                  padding:10px 20px;
                  background:#4f46e5;
                  color:#fff;
                  text-decoration:none;
                  border-radius:5px;
                ">
                  Xác nhận email
                </a>
                <p>Link hết hạn sau 24 giờ</p>
              `
            );

            return res.json({ message: 'Đăng ký thành công, vui lòng kiểm tra email để xác nhận tài khoản' });
          } catch (error) {
            console.log(error);
            return res.status(500).json({ message: 'Gửi email thất bại' });
          }
        }
      );
    }
  );
};

// =============================
// 🔥 VERIFY EMAIL
// =============================
exports.verifyEmail = (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ message: 'Thiếu token' });
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  db.query(
    'SELECT * FROM users WHERE reset_token=?',
    [hashedToken],
    (err, result) => {
      if (err) return res.status(500).json(err);

      if (result.length === 0) {
        return res.status(400).json({ message: 'Token không hợp lệ' });
      }

      const user = result[0];

      if (user.is_verified) {
        return res.status(400).json({ message: 'Tài khoản đã được xác nhận trước đó' });
      }

      db.query(
        'UPDATE users SET is_verified=1, reset_token=NULL WHERE id=?',
        [user.id],
        (err) => {
          if (err) return res.status(500).json(err);

          // 🔥 Chuyển thẳng về trang login sau khi xác nhận
          return res.redirect('http://localhost:3000/login?verified=1');
        }
      );
    }
  );
};

// =============================
// 🔥 LOGIN
// =============================
exports.login = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Thiếu dữ liệu' });
  }

  db.query(
    'SELECT * FROM users WHERE email=?',
    [email],
    async (err, result) => {
      if (err) return res.status(500).json(err);

      if (result.length === 0) {
        return res.status(400).json({ message: 'Sai email hoặc mật khẩu' });
      }

      const user = result[0];

      // 🔥 Kiểm tra tài khoản bị banned
      if (user.status === 'banned') {
        return res.status(403).json({ message: 'Tài khoản đã bị khóa' });
      }

      // 🔥 Kiểm tra đã xác nhận email chưa
      if (!user.is_verified) {
        return res.status(403).json({ message: 'Vui lòng xác nhận email trước khi đăng nhập' });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(400).json({ message: 'Sai email hoặc mật khẩu' });
      }

      const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );

      // 🔥 Ẩn password trước khi trả về client
      const { password: _, reset_token, reset_token_expire, ...safeUser } = user;

      res.json({
        message: 'Đăng nhập thành công',
        token,
        user: safeUser
      });
    }
  );
};

// =============================
// 🔥 FORGOT PASSWORD
// =============================
exports.forgotPassword = (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Thiếu email' });
  }

  db.query(
    'SELECT * FROM users WHERE email=?',
    [email],
    async (err, result) => {
      if (err) return res.status(500).json(err);

      if (result.length === 0) {
        return res.json({ message: 'Nếu email tồn tại, bạn sẽ nhận được mail' });
      }

      const user = result[0];

      const rawToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
      const expire = Date.now() + 15 * 60 * 1000;

      db.query(
        'UPDATE users SET reset_token=?, reset_token_expire=? WHERE id=?',
        [hashedToken, expire, user.id],
        async (err) => {
          if (err) return res.status(500).json(err);

          const resetLink = `http://localhost:3000/reset-password?token=${rawToken}`;

          try {
            await sendEmail(
              email,
              '🔐 Reset mật khẩu',
              `
                <h2>Reset mật khẩu</h2>
                <p>Bạn vừa yêu cầu đổi mật khẩu</p>
                <a href="${resetLink}" style="
                  display:inline-block;
                  padding:10px 20px;
                  background:#007bff;
                  color:#fff;
                  text-decoration:none;
                  border-radius:5px;
                ">
                  Reset Password
                </a>
                <p>Link hết hạn sau 15 phút</p>
              `
            );

            return res.json({ message: 'Đã gửi email (nếu tồn tại)' });
          } catch (error) {
            console.log(error);
            return res.status(500).json({ message: 'Gửi email thất bại' });
          }
        }
      );
    }
  );
};

// =============================
// 🔥 RESET PASSWORD
// =============================
exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ message: 'Thiếu dữ liệu' });
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  db.query(
    'SELECT * FROM users WHERE reset_token=?',
    [hashedToken],
    async (err, result) => {
      if (err) return res.status(500).json(err);

      if (result.length === 0) {
        return res.status(400).json({ message: 'Token không hợp lệ' });
      }

      const user = result[0];

      if (Date.now() > user.reset_token_expire) {
        return res.status(400).json({ message: 'Token đã hết hạn' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      db.query(
        `UPDATE users 
         SET password=?, reset_token=NULL, reset_token_expire=NULL 
         WHERE id=?`,
        [hashedPassword, user.id],
        (err) => {
          if (err) return res.status(500).json(err);

          res.json({ message: 'Đổi mật khẩu thành công' });
        }
      );
    }
  );
};