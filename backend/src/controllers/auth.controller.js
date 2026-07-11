const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getPool, sql } = require('../config/db');
const { withControllerLog } = require('../utils/controllerLogger');

async function registerHandler(req, res) {
  try {
    const { fullName, email, password, phoneNumber, address = null, cityId = null, wardId = null } = req.body;
    const pool = await getPool();

    // Kiểm tra email trùng trước để trả về thông báo thân thiện cho ứng dụng mobile.
    const existing = await pool.request()
      .input('email', sql.NVarChar, email)
      .query('SELECT TOP 1 UserId FROM Users WHERE Email = @email');

    if (existing.recordset.length > 0) {
      return res.status(409).json({ message: 'Email đã được sử dụng' });
    }

    const hash = await bcrypt.hash(password, 11);
    const result = await pool.request()
      .input('fullName', sql.NVarChar, fullName)
      .input('email', sql.NVarChar, email)
      .input('hash', sql.NVarChar, hash)
      .input('phoneNumber', sql.NVarChar, phoneNumber)
      .input('address', sql.NVarChar, address)
      .input('cityId', sql.Int, cityId)
      .input('wardId', sql.Int, wardId)
      .query(`
        INSERT INTO Users (FullName, Email, PasswordHash, Role, PhoneNumber, Address, IsLocked, CityId, WardId, CreatedDate)
        OUTPUT INSERTED.UserId
        VALUES (@fullName, @email, @hash, 'Customer', @phoneNumber, @address, 0, @cityId, @wardId, GETUTCDATE())
      `);

    return res.status(201).json({ message: 'Đăng ký thành công', userId: result.recordset[0].UserId });
  } catch (error) {
    return res.status(500).json({ message: 'Registration failed' });
  }
}

async function loginHandler(req, res) {
  try {
    const { email, password } = req.body;
    const pool = await getPool();

    const result = await pool.request()
      .input('email', sql.NVarChar, email)
      .query('SELECT TOP 1 * FROM Users WHERE Email = @email');

    const user = result.recordset[0];
    if (!user) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
    }

    if (user.IsLocked) {
      return res.status(403).json({ message: 'Tài khoản đã bị khóa' });
    }

    const isValid = await bcrypt.compare(password, user.PasswordHash);
    if (!isValid) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
    }

    const token = jwt.sign(
      { userId: user.UserId, email: user.Email, role: user.Role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
    );

    return res.status(200).json({
      token,
      user: {
        userId: user.UserId,
        fullName: user.FullName,
        email: user.Email,
        role: user.Role,
        phoneNumber: user.PhoneNumber,
        address: user.Address,
        cityId: user.CityId,
        wardId: user.WardId,
        profileImageUrl: user.ProfileImageUrl,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Login failed' });
  }
}

module.exports = {
  register: withControllerLog('auth.register', registerHandler),
  login: withControllerLog('auth.login', loginHandler),
};
