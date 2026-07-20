const bcrypt = require('bcrypt');
const { randomUUID } = require('crypto');
const path = require('path');
const { getPool, sql } = require('../config/db');
const { bucket } = require('../config/firebase');
const { withControllerLog } = require('../utils/controllerLogger');

async function hasProfileImageColumn(pool) {
  const result = await pool.request().query("SELECT COL_LENGTH('dbo.Users', 'ProfileImageUrl') AS length");
  return result.recordset[0]?.length !== null;
}

async function getUserProfile(pool, userId) {
  const hasImageColumn = await hasProfileImageColumn(pool);
  const profileImageSelect = hasImageColumn ? 'u.ProfileImageUrl' : 'CAST(NULL AS NVARCHAR(500)) AS ProfileImageUrl';

  // Keep profile reads compatible with older local databases while the avatar
  // column migration is pending.
  const result = await pool.request()
    .input('userId', sql.Int, userId)
    .query(`
      SELECT u.UserId, u.FullName, u.Email, u.Role, u.PhoneNumber, u.Address, u.CityId, u.WardId, u.CreatedDate,
             ${profileImageSelect}, c.CityName, w.WardName
      FROM Users u
      LEFT JOIN Cities c ON u.CityId = c.CityId
      LEFT JOIN Wards w ON u.WardId = w.WardId
      WHERE u.UserId = @userId;
    `);

  return result.recordset[0] || null;
}

function uploadAvatar(file, userId) {
  if (!file) {
    throw new Error('Avatar file is required');
  }

  if (!bucket) {
    throw new Error('Firebase Storage is not configured');
  }

  return new Promise((resolve, reject) => {
    const extension = path.extname(file.originalname || '.jpg') || '.jpg';
    const fileName = `profiles/${userId}-${randomUUID()}${extension}`;
    const remoteFile = bucket.file(fileName);

    const stream = remoteFile.createWriteStream({
      metadata: { contentType: file.mimetype },
      resumable: false,
    });

    stream.on('error', reject);
    stream.on('finish', async () => {
      try {
        await remoteFile.makePublic();
        resolve(`https://storage.googleapis.com/${bucket.name}/${fileName}`);
      } catch (error) {
        reject(error);
      }
    });

    stream.end(file.buffer);
  });
}

async function getMeHandler(req, res) {
  try {
    const pool = await getPool();
    const user = await getUserProfile(pool, req.user.userId);

    return res.json(user);
  } catch (error) {
    console.error('Load profile failed:', error);
    return res.status(500).json({ message: 'Failed to load profile' });
  }
}

async function updateMeHandler(req, res) {
  try {
    const pool = await getPool();
    const { fullName, phoneNumber, address, cityId = null, wardId = null, profileImageUrl = null } = req.body;
    const hasImageColumn = await hasProfileImageColumn(pool);

    const request = pool.request()
      .input('userId', sql.Int, req.user.userId)
      .input('fullName', sql.NVarChar, fullName)
      .input('phoneNumber', sql.NVarChar, phoneNumber)
      .input('address', sql.NVarChar, address)
      .input('cityId', sql.Int, cityId)
      .input('wardId', sql.Int, wardId);

    if (hasImageColumn) {
      request.input('profileImageUrl', sql.NVarChar(500), profileImageUrl);
    }

    // The avatar write is included only when the database has been migrated.
    await request.query(`
      UPDATE Users
      SET FullName = @fullName,
          PhoneNumber = @phoneNumber,
          Address = @address,
          CityId = @cityId,
          WardId = @wardId
          ${hasImageColumn ? ', ProfileImageUrl = COALESCE(@profileImageUrl, ProfileImageUrl)' : ''}
      WHERE UserId = @userId;
    `);

    const updated = await getUserProfile(pool, req.user.userId);

    return res.json({ message: 'Cap nhat thanh cong', user: updated });
  } catch (error) {
    console.error('Update profile failed:', error);
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
      return res.status(400).json({ message: 'Mat khau cu khong dung' });
    }

    const hash = await bcrypt.hash(newPassword, 11);
    await pool.request()
      .input('userId', sql.Int, req.user.userId)
      .input('hash', sql.NVarChar, hash)
      .query('UPDATE Users SET PasswordHash = @hash WHERE UserId = @userId');

    return res.json({ message: 'Doi mat khau thanh cong' });
  } catch (error) {
    console.error('Update password failed:', error);
    return res.status(500).json({ message: 'Failed to update password' });
  }
}

async function updateAvatarHandler(req, res) {
  try {
    const pool = await getPool();
    const hasImageColumn = await hasProfileImageColumn(pool);

    if (!hasImageColumn) {
      return res.status(400).json({
        message: 'Database is missing ProfileImageUrl column. Run ALTER TABLE dbo.Users ADD ProfileImageUrl NVARCHAR(500) NULL.',
      });
    }

    const profileImageUrl = await uploadAvatar(req.file, req.user.userId);

    await pool.request()
      .input('userId', sql.Int, req.user.userId)
      .input('profileImageUrl', sql.NVarChar(500), profileImageUrl)
      .query('UPDATE Users SET ProfileImageUrl = @profileImageUrl WHERE UserId = @userId');

    const updated = await getUserProfile(pool, req.user.userId);

    return res.json({ message: 'Cap nhat anh dai dien thanh cong', user: updated });
  } catch (error) {
    console.error('Update avatar failed:', error);
    return res.status(500).json({ message: 'Failed to update avatar' });
  }
}

async function updateFcmTokenHandler(req, res) {
  const fcmToken = typeof req.body.fcmToken === 'string' ? req.body.fcmToken.trim() : '';
  if (!fcmToken) {
    return res.status(400).json({ message: 'fcmToken is required' });
  }

  try {
    const pool = await getPool();
    await pool.request()
      .input('userId', sql.Int, req.user.userId)
      .input('fcmToken', sql.NVarChar(512), fcmToken)
      .query('UPDATE Users SET FcmToken = @fcmToken WHERE UserId = @userId');
    return res.json({ message: 'Token updated' });
  } catch (error) {
    console.error('Update FCM token failed:', error);
    return res.status(500).json({ message: 'Failed to update FCM token' });
  }
}

async function deleteFcmTokenHandler(req, res) {
  try {
    const pool = await getPool();
    await pool.request()
      .input('userId', sql.Int, req.user.userId)
      .query('UPDATE Users SET FcmToken = NULL WHERE UserId = @userId');
    return res.json({ message: 'Token deleted' });
  } catch (error) {
    console.error('Delete FCM token failed:', error);
    return res.status(500).json({ message: 'Failed to delete FCM token' });
  }
}

module.exports = {
  getMe: withControllerLog('user.getMe', getMeHandler),
  updateMe: withControllerLog('user.updateMe', updateMeHandler),
  updatePassword: withControllerLog('user.updatePassword', updatePasswordHandler),
  updateAvatar: withControllerLog('user.updateAvatar', updateAvatarHandler),
  updateFcmToken: withControllerLog('user.updateFcmToken', updateFcmTokenHandler),
  deleteFcmToken: withControllerLog('user.deleteFcmToken', deleteFcmTokenHandler),
};
