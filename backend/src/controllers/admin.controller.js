const { getPool, sql } = require('../config/db');
const { withControllerLog } = require('../utils/controllerLogger');
const { sendToUser, ORDER_NOTIFICATIONS } = require('../services/notificationService');

const clean = (value) => {
  const result = String(value ?? '').trim();
  return result || null;
};

async function getDashboardHandler(_req, res) {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT COUNT(*) todayOrders FROM Orders
      WHERE CAST(OrderDate AS DATE) = CAST(GETUTCDATE() AS DATE);
      SELECT COALESCE(SUM(TotalAmount), 0) todayRevenue FROM Orders
      WHERE CAST(OrderDate AS DATE) = CAST(GETUTCDATE() AS DATE)
        AND (PaymentStatus = 'Paid' OR Status = 'Completed');
      SELECT COUNT(*) pendingOrders FROM Orders WHERE Status = 'Pending';
      SELECT ProductId productId, ProductName productName, Stock stock
      FROM Products WHERE IsDiscontinued = 0 AND Stock < 10 ORDER BY Stock, ProductName;
      SELECT CAST(OrderDate AS DATE) date, COALESCE(SUM(TotalAmount), 0) revenue
      FROM Orders WHERE PaymentStatus = 'Paid'
        AND OrderDate >= DATEADD(day, -30, GETUTCDATE())
      GROUP BY CAST(OrderDate AS DATE) ORDER BY date ASC;
      SELECT Status status, COUNT(*) count FROM Orders GROUP BY Status;
      SELECT TOP 5 p.ProductId productId, p.ProductName productName,
        SUM(od.Quantity) totalSold, SUM(od.Quantity * od.UnitPrice) revenue
      FROM OrderDetails od JOIN Orders o ON od.OrderId = o.OrderId
      JOIN Products p ON od.ProductId = p.ProductId
      WHERE o.PaymentStatus = 'Paid' OR o.Status = 'Completed'
      GROUP BY p.ProductId, p.ProductName ORDER BY totalSold DESC;
      SELECT c.CategoryName categoryName,
        COALESCE(SUM(od.Quantity * od.UnitPrice), 0) revenue
      FROM Categories c JOIN Products p ON c.CategoryId = p.CategoryId
      JOIN OrderDetails od ON p.ProductId = od.ProductId
      JOIN Orders o ON od.OrderId = o.OrderId
      WHERE o.PaymentStatus = 'Paid' OR o.Status = 'Completed'
      GROUP BY c.CategoryId, c.CategoryName ORDER BY revenue DESC;
    `);
    return res.json({
      todayOrders: result.recordsets[0]?.[0]?.todayOrders || 0,
      todayRevenue: result.recordsets[1]?.[0]?.todayRevenue || 0,
      pendingOrders: result.recordsets[2]?.[0]?.pendingOrders || 0,
      lowStockProducts: result.recordsets[3] || [],
      revenueByDay: result.recordsets[4] || [],
      ordersByStatus: result.recordsets[5] || [],
      topProducts: result.recordsets[6] || [],
      revenueByCategory: result.recordsets[7] || [],
    });
  } catch (error) {
    console.error('Dashboard failed:', error);
    return res.status(500).json({ message: 'Failed to load dashboard' });
  }
}

async function getCustomersHandler(req, res) {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const search = clean(req.query.search);
    const pool = await getPool();
    const result = await pool.request()
      .input('search', sql.NVarChar, search).input('page', sql.Int, page).input('limit', sql.Int, limit)
      .query(`
        SELECT u.UserId, u.FullName, u.Email, u.PhoneNumber, u.IsLocked, u.CreatedDate,
          COUNT(o.OrderId) totalOrders, COALESCE(SUM(o.TotalAmount), 0) totalSpent
        FROM Users u LEFT JOIN Orders o ON u.UserId = o.UserId
        WHERE u.Role = 'Customer' AND (@search IS NULL OR u.FullName LIKE N'%' + @search + N'%'
          OR u.Email LIKE N'%' + @search + N'%' OR u.PhoneNumber LIKE N'%' + @search + N'%')
        GROUP BY u.UserId, u.FullName, u.Email, u.PhoneNumber, u.IsLocked, u.CreatedDate
        ORDER BY u.CreatedDate DESC
        OFFSET (@page - 1) * @limit ROWS FETCH NEXT @limit ROWS ONLY;
        SELECT COUNT(*) total FROM Users u WHERE u.Role = 'Customer'
          AND (@search IS NULL OR u.FullName LIKE N'%' + @search + N'%'
          OR u.Email LIKE N'%' + @search + N'%' OR u.PhoneNumber LIKE N'%' + @search + N'%');
      `);
    const total = result.recordsets[1]?.[0]?.total || 0;
    return res.json({ customers: result.recordsets[0] || [], total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) });
  } catch (error) {
    console.error('Customers failed:', error);
    return res.status(500).json({ message: 'Failed to load customers' });
  }
}

async function getCustomerByIdHandler(req, res) {
  try {
    const pool = await getPool();
    const result = await pool.request().input('id', sql.Int, Number(req.params.id)).query(`
      SELECT u.UserId, u.FullName, u.Email, u.PhoneNumber, u.Address, u.IsLocked,
        u.CityId, u.WardId, u.CreatedDate, c.CityName, w.WardName,
        COUNT(o.OrderId) totalOrders, COALESCE(SUM(o.TotalAmount), 0) totalSpent
      FROM Users u LEFT JOIN Cities c ON u.CityId = c.CityId
      LEFT JOIN Wards w ON u.WardId = w.WardId LEFT JOIN Orders o ON u.UserId = o.UserId
      WHERE u.UserId = @id AND u.Role = 'Customer'
      GROUP BY u.UserId, u.FullName, u.Email, u.PhoneNumber, u.Address, u.IsLocked,
        u.CityId, u.WardId, u.CreatedDate, c.CityName, w.WardName;
      SELECT TOP 10 OrderId, OrderDate, TotalAmount, Status, PaymentStatus,
        RecipientName, PhoneNumber, ShippingAddress
      FROM Orders WHERE UserId = @id ORDER BY OrderDate DESC;
    `);
    const customer = result.recordsets[0]?.[0];
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    return res.json({ ...customer, recentOrders: result.recordsets[1] || [] });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load customer' });
  }
}

async function updateCustomerLockHandler(req, res) {
  if (typeof req.body.isLocked !== 'boolean') return res.status(400).json({ message: 'isLocked must be boolean' });
  try {
    const pool = await getPool();
    const result = await pool.request().input('id', sql.Int, Number(req.params.id))
      .input('isLocked', sql.Bit, req.body.isLocked)
      .query(`UPDATE Users SET IsLocked = @isLocked OUTPUT INSERTED.IsLocked
        WHERE UserId = @id AND Role = 'Customer'`);
    if (!result.recordset[0]) return res.status(404).json({ message: 'Customer not found' });
    return res.json({ message: 'Cập nhật thành công', isLocked: Boolean(result.recordset[0].IsLocked) });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update customer' });
  }
}

async function getOrdersHandler(req, res) {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const pool = await getPool();
    const request = pool.request()
      .input('role', sql.NVarChar, req.user.role).input('appUserId', sql.Int, req.user.userId)
      .input('status', sql.NVarChar, clean(req.query.status)).input('channel', sql.NVarChar, clean(req.query.channel))
      .input('dateFrom', sql.Date, clean(req.query.dateFrom)).input('dateTo', sql.Date, clean(req.query.dateTo))
      .input('search', sql.NVarChar, clean(req.query.search)).input('page', sql.Int, page).input('limit', sql.Int, limit);
    const filter = `(@role <> 'Sale' OR o.Channel = 'Online' OR o.AppUserId = @appUserId)
      AND (@status IS NULL OR o.Status = @status) AND (@channel IS NULL OR o.Channel = @channel)
      AND (@dateFrom IS NULL OR o.OrderDate >= @dateFrom)
      AND (@dateTo IS NULL OR o.OrderDate < DATEADD(day, 1, @dateTo))
      AND (@search IS NULL OR o.RecipientName LIKE N'%' + @search + N'%' OR o.PhoneNumber LIKE N'%' + @search + N'%')`;
    const result = await request.query(`
      SELECT o.*, c.CityName, w.WardName FROM Orders o
      LEFT JOIN Cities c ON o.CityId = c.CityId LEFT JOIN Wards w ON o.WardId = w.WardId
      WHERE ${filter} ORDER BY o.OrderDate DESC
      OFFSET (@page - 1) * @limit ROWS FETCH NEXT @limit ROWS ONLY;
      SELECT COUNT(*) total FROM Orders o WHERE ${filter};
    `);
    const orders = result.recordsets[0] || [];
    if (orders.length) {
      const ids = orders.map((o) => Number(o.OrderId)).filter(Number.isFinite).join(',');
      const details = await pool.request().query(`SELECT od.OrderId, od.ProductId, od.Quantity, od.UnitPrice,
        p.ProductName FROM OrderDetails od LEFT JOIN Products p ON od.ProductId = p.ProductId
        WHERE od.OrderId IN (${ids})`);
      const grouped = details.recordset.reduce((all, item) => {
        (all[item.OrderId] ||= []).push(item); return all;
      }, {});
      orders.forEach((order) => { order.items = grouped[order.OrderId] || []; });
    }
    const total = result.recordsets[1]?.[0]?.total || 0;
    return res.json({ orders, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) });
  } catch (error) {
    console.error('Admin orders failed:', error);
    return res.status(500).json({ message: 'Failed to load orders' });
  }
}

async function updateOrderStatusHandler(req, res) {
  const status = clean(req.body.status);
  const allowed = ['Pending', 'Confirmed', 'Shipping', 'Shipped', 'Completed', 'Cancelled'];
  if (!allowed.includes(status)) return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
  try {
    const pool = await getPool();
    const currentResult = await pool.request().input('id', sql.Int, Number(req.params.id))
      .query('SELECT TOP 1 Status FROM Orders WHERE OrderId = @id');
    const current = currentResult.recordset[0]?.Status;
    if (!current) return res.status(404).json({ message: 'Order not found' });
    const transitions = { Sale: { Pending: ['Confirmed'] }, NVKho: { Confirmed: ['Shipping'], Shipping: ['Shipped'] } };
    if (req.user.role !== 'Admin' && !transitions[req.user.role]?.[current]?.includes(status)) {
      return res.status(403).json({ message: 'Bạn không có quyền thực hiện chuyển trạng thái này' });
    }
    const result = await pool.request().input('id', sql.Int, Number(req.params.id))
      .input('current', sql.NVarChar, current).input('status', sql.NVarChar, status)
      .query('UPDATE Orders SET Status = @status OUTPUT INSERTED.OrderId, INSERTED.Status, INSERTED.UserId WHERE OrderId = @id AND Status = @current');
    if (!result.recordset[0]) return res.status(409).json({ message: 'Trạng thái đơn hàng vừa thay đổi, vui lòng tải lại' });
    const updatedOrder = result.recordset[0];
    const notification = ORDER_NOTIFICATIONS[updatedOrder.Status];
    if (notification && updatedOrder.UserId) {
      sendToUser(updatedOrder.UserId, notification(updatedOrder.OrderId))
        .catch((error) => console.error('Order notification failed:', error));
    }
    return res.json({ message: 'Cập nhật trạng thái thành công', ...updatedOrder });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update order status' });
  }
}

module.exports = {
  getDashboard: withControllerLog('admin.dashboard', getDashboardHandler),
  getCustomers: withControllerLog('admin.customers', getCustomersHandler),
  getCustomerById: withControllerLog('admin.customerDetail', getCustomerByIdHandler),
  updateCustomerLock: withControllerLog('admin.customerLock', updateCustomerLockHandler),
  getOrders: withControllerLog('admin.orders', getOrdersHandler),
  updateOrderStatus: withControllerLog('admin.orderStatus', updateOrderStatusHandler),
};
