const { getPool, sql } = require('../config/db');
const { admin } = require('../config/firebase');

const INVALID_TOKEN_CODES = new Set([
  'messaging/invalid-registration-token',
  'messaging/registration-token-not-registered',
]);

function stringifyData(data = {}) {
  return Object.fromEntries(
    Object.entries(data)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => [key, String(value)]),
  );
}

function buildMessage(token, { title, body, data = {} }) {
  return {
    token,
    notification: { title, body },
    data: stringifyData(data),
    android: { priority: 'high', notification: { channelId: 'default' } },
    apns: { payload: { aps: { sound: 'default' } } },
  };
}

async function clearToken(pool, userId) {
  await pool.request()
    .input('userId', sql.Int, userId)
    .query('UPDATE Users SET FcmToken = NULL WHERE UserId = @userId');
}

/**
 * Send a notification to a user who has registered a mobile FCM token.
 */
async function sendToUser(userId, notification) {
  const pool = await getPool();
  const result = await pool.request()
    .input('userId', sql.Int, userId)
    .query('SELECT FcmToken FROM Users WHERE UserId = @userId');

  const token = result.recordset[0]?.FcmToken;
  if (!token) return null;

  try {
    return await admin.messaging().send(buildMessage(token, notification));
  } catch (error) {
    if (INVALID_TOKEN_CODES.has(error.code)) {
      await clearToken(pool, userId);
    }
    console.error('FCM send error:', error.message);
    return null;
  }
}

/**
 * Broadcast a notification to customers in FCM batches of at most 500.
 */
async function broadcastToAllCustomers(notification) {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT UserId, FcmToken
    FROM Users
    WHERE Role = 'Customer' AND FcmToken IS NOT NULL
  `);
  const tokens = result.recordset;
  const batchSize = 500;

  for (let offset = 0; offset < tokens.length; offset += batchSize) {
    const batch = tokens.slice(offset, offset + batchSize);
    const response = await admin.messaging().sendEach(
      batch.map((row) => buildMessage(row.FcmToken, notification)),
    );

    const invalidUserIds = response.responses
      .map((item, index) => (!item.success && INVALID_TOKEN_CODES.has(item.error?.code)
        ? batch[index].UserId
        : null))
      .filter(Boolean);

    if (invalidUserIds.length) {
      const request = pool.request();
      const parameterNames = invalidUserIds.map((userId, index) => {
        const name = `userId${index}`;
        request.input(name, sql.Int, userId);
        return `@${name}`;
      });
      await request.query(`
        UPDATE Users SET FcmToken = NULL
        WHERE UserId IN (${parameterNames.join(', ')})
      `);
    }
  }
}

const ORDER_NOTIFICATIONS = {
  Confirmed: (orderId) => ({
    title: '✅ Đơn hàng được xác nhận',
    body: `Đơn #${orderId} đã được xác nhận và đang chuẩn bị.`,
    data: { screen: 'OrderDetail', orderId },
  }),
  Shipping: (orderId) => ({
    title: '🚚 Đơn hàng đang giao',
    body: `Đơn #${orderId} đang trên đường đến bạn!`,
    data: { screen: 'OrderDetail', orderId },
  }),
  Shipped: (orderId) => ({
    title: '📦 Giao hàng thành công',
    body: `Đơn #${orderId} đã được giao. Cảm ơn bạn đã mua sắm!`,
    data: { screen: 'OrderDetail', orderId },
  }),
  Cancelled: (orderId) => ({
    title: '❌ Đơn hàng bị hủy',
    body: `Đơn #${orderId} đã bị hủy. Liên hệ hỗ trợ nếu cần.`,
    data: { screen: 'OrderDetail', orderId },
  }),
};

const PRODUCT_NOTIFICATIONS = {
  discount: (productName, discountPercent) => ({
    title: '🔥 Sách đang giảm giá!',
    body: `"${productName}" đang giảm ${discountPercent}% — Mua ngay!`,
    data: { screen: 'Home' },
  }),
  newArrival: (productName) => ({
    title: '📚 Sách mới vừa về!',
    body: `"${productName}" vừa được thêm vào kho. Xem ngay!`,
    data: { screen: 'Home' },
  }),
};

module.exports = {
  sendToUser,
  broadcastToAllCustomers,
  ORDER_NOTIFICATIONS,
  PRODUCT_NOTIFICATIONS,
};
