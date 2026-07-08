const bcrypt = require('bcrypt');
const { getPool, sql } = require('../config/db');
const { withControllerLog } = require('../utils/controllerLogger');

async function getMeHandler(req, res) {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('userId', sql.Int, req.user.userId)
      .query(`
        SELECT u.UserId, u.FullName, u.Email, u.Role, u.PhoneNumber, u.Address, u.CityId, u.WardId, u.CreatedDate,
               c.CityName, w.WardName
        FROM Users u
        LEFT JOIN Cities c ON u.CityId = c.CityId
        LEFT JOIN Wards w ON u.WardId = w.WardId
        WHERE u.UserId = @userId;
      `);

    return res.json(result.recordset[0] || null);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load profile' });
  }
}

async function updateMeHandler(req, res) {
  try {
    const pool = await getPool();
    const { fullName, phoneNumber, address, cityId = null, wardId = null } = req.body;

    await pool.request()
      .input('userId', sql.Int, req.user.userId)
      .input('fullName', sql.NVarChar, fullName)
      .input('phoneNumber', sql.NVarChar, phoneNumber)
      .input('address', sql.NVarChar, address)
      .input('cityId', sql.Int, cityId)
      .input('wardId', sql.Int, wardId)
      .query(`
        UPDATE Users
        SET FullName = @fullName, PhoneNumber = @phoneNumber, Address = @address, CityId = @cityId, WardId = @wardId
        WHERE UserId = @userId;
      `);

    const updated = await pool.request()
      .input('userId', sql.Int, req.user.userId)
      .query('SELECT TOP 1 * FROM Users WHERE UserId = @userId');

    return res.json({ message: 'Cập nhật thành công', user: updated.recordset[0] });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update profile' });
  }
}

async function updatePasswordHandler(req, res) {
  try {
    const pool = await getPool();
    const { oldPassword, newPassword } = req.body;

    const result = await pool.request()
      .input('userId', sql.Int, req.user.userId)
      .query('SELECT TOP 1 * FROM Users WHERE UserId = @userId');

    const user = result.recordset[0];
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isValid = await bcrypt.compare(oldPassword, user.PasswordHash);
    if (!isValid) {
      return res.status(400).json({ message: 'Mật khẩu cũ không đúng' });
    }

    const hash = await bcrypt.hash(newPassword, 11);
    await pool.request()
      .input('userId', sql.Int, req.user.userId)
      .input('hash', sql.NVarChar, hash)
      .query('UPDATE Users SET PasswordHash = @hash WHERE UserId = @userId');

    return res.json({ message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update password' });
  }
}

module.exports = {
  getMe: withControllerLog('user.getMe', getMeHandler),
  updateMe: withControllerLog('user.updateMe', updateMeHandler),
  updatePassword: withControllerLog('user.updatePassword', updatePasswordHandler),
};
