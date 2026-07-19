const { getPool, sql } = require('../config/db');
const { withControllerLog } = require('../utils/controllerLogger');

function parseDateBoundary(value, fallback, { endExclusive = false } = {}) {
  if (!value) {
    return fallback;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return fallback;
  }

  // Date-only filters from the mobile form are user-facing inclusive dates;
  // the SQL query uses an exclusive upper bound for stable paging.
  if (endExclusive && /^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    parsed.setDate(parsed.getDate() + 1);
  }

  return parsed;
}

async function createOrderHandler(req, res) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  try {
    const { recipientName, phoneNumber, shippingAddress, notes = null, cityId = null, wardId = null, paymentMethod, items = [] } = req.body;
    let { email = null } = req.body;
    const userId = req.user.userId;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Giỏ hàng trống' });
    }

    if (!email) {
      const userResult = await pool.request()
        .input('userId', sql.Int, userId)
        .query('SELECT TOP 1 Email FROM Users WHERE UserId = @userId');

      email = userResult.recordset[0]?.Email || '';
    }

    await transaction.begin();

    let totalAmount = 0;
    for (const item of items) {
      const stockResult = await new sql.Request(transaction)
        .input('productId', sql.Int, item.productId)
        .query('SELECT TOP 1 ProductName, Stock, Price, IsAvailable FROM Products WHERE ProductId = @productId');

      const product = stockResult.recordset[0];
      if (!product || !product.IsAvailable) {
        await transaction.rollback();
        return res.status(400).json({ error: 'Sản phẩm không khả dụng' });
      }

      if (product.Stock < item.quantity) {
        await transaction.rollback();
        return res.status(400).json({ error: `Sản phẩm "${product.ProductName}" chỉ còn ${product.Stock} cuốn trong kho` });
      }

      const quantity = Number(item.quantity || 0);
      const unitPrice = Number(item.unitPrice ?? item.price ?? product.Price ?? 0);

      if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitPrice) || unitPrice <= 0) {
        await transaction.rollback();
        return res.status(400).json({ message: 'Dữ liệu sản phẩm trong giỏ hàng không hợp lệ' });
      }

      totalAmount += quantity * unitPrice;
    }

    const orderResult = await new sql.Request(transaction)
      .input('userId', sql.Int, userId)
      .input('totalAmount', sql.Decimal(18, 2), totalAmount)
      .input('recipientName', sql.NVarChar, recipientName)
      .input('phoneNumber', sql.NVarChar, phoneNumber)
      .input('email', sql.NVarChar, email)
      .input('shippingAddress', sql.NVarChar(sql.MAX), shippingAddress)
      .input('notes', sql.NVarChar(sql.MAX), notes)
      .input('paymentMethod', sql.NVarChar, paymentMethod)
      .input('cityId', sql.Int, cityId)
      .input('wardId', sql.Int, wardId)
      .query(`
        INSERT INTO Orders (
          UserId, OrderDate, TotalAmount, Status, RecipientName,
          PhoneNumber, Email, ShippingAddress, Notes, PaymentMethod,
          PaymentStatus, CityId, WardId, Channel
        )
        OUTPUT INSERTED.OrderId
        VALUES (
          @userId, GETUTCDATE(), @totalAmount, 'Pending', @recipientName,
          @phoneNumber, @email, @shippingAddress, @notes, @paymentMethod,
          'Pending', @cityId, @wardId, 'Mobile'
        );
      `);

    const orderId = orderResult.recordset[0].OrderId;

    for (const item of items) {
      const unitPrice = Number(item.unitPrice ?? item.price);

      await new sql.Request(transaction)
        .input('orderId', sql.Int, orderId)
        .input('productId', sql.Int, item.productId)
        .input('quantity', sql.Int, item.quantity)
        .input('unitPrice', sql.Decimal(18, 2), unitPrice)
        .query('INSERT INTO OrderDetails (OrderId, ProductId, Quantity, UnitPrice) VALUES (@orderId, @productId, @quantity, @unitPrice)');

      await new sql.Request(transaction)
        .input('productId', sql.Int, item.productId)
        .input('quantity', sql.Int, item.quantity)
        .query('UPDATE Products SET Stock = Stock - @quantity, SoldCount = SoldCount + @quantity WHERE ProductId = @productId');
    }

    await transaction.commit();
    return res.status(201).json({ orderId, totalAmount, status: 'Pending' });
  } catch (error) {
    console.error('Create order failed:', error);
    try {
      await transaction.rollback();
    } catch (_rollbackError) {
      // Transaction may not have started or may already be closed.
    }
    return res.status(500).json({ message: 'Failed to create order' });
  }
}

async function getMyOrdersHandler(req, res) {
  try {
    const pool = await getPool();
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
    const status = req.query.status || null;
    const search = req.query.search ? String(req.query.search).trim() : null;

    // By default, the order list is scoped to the current month so the mobile
    // screen stays fast and avoids pulling a full historical ledger.
    const now = new Date();
    const defaultDateFrom = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const defaultDateTo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    const dateFrom = parseDateBoundary(req.query.dateFrom, defaultDateFrom);
    const dateTo = parseDateBoundary(req.query.dateTo, defaultDateTo, { endExclusive: true });

    const request = pool.request()
      .input('userId', sql.Int, req.user.userId)
      .input('status', sql.NVarChar, status)
      .input('search', sql.NVarChar, search)
      .input('dateFrom', sql.DateTime2, dateFrom)
      .input('dateTo', sql.DateTime2, dateTo)
      .input('page', sql.Int, page)
      .input('limit', sql.Int, limit);

    const result = await request.query(`
        WITH FilteredOrders AS (
          SELECT o.*, c.CityName, w.WardName
          FROM Orders o
          LEFT JOIN Cities c ON o.CityId = c.CityId
          LEFT JOIN Wards w ON o.WardId = w.WardId
          WHERE o.UserId = @userId
            AND (@status IS NULL OR o.Status = @status)
            AND o.OrderDate >= @dateFrom
            AND o.OrderDate < @dateTo
            AND (
              @search IS NULL
              OR CAST(o.OrderId AS NVARCHAR(20)) LIKE N'%' + @search + N'%'
              OR o.RecipientName LIKE N'%' + @search + N'%'
              OR o.PhoneNumber LIKE N'%' + @search + N'%'
              OR o.Email LIKE N'%' + @search + N'%'
            )
        )
        SELECT *
        FROM FilteredOrders
        ORDER BY OrderDate DESC
        OFFSET (@page - 1) * @limit ROWS FETCH NEXT @limit ROWS ONLY;

        WITH FilteredOrders AS (
          SELECT o.OrderId
          FROM Orders o
          WHERE o.UserId = @userId
            AND (@status IS NULL OR o.Status = @status)
            AND o.OrderDate >= @dateFrom
            AND o.OrderDate < @dateTo
            AND (
              @search IS NULL
              OR CAST(o.OrderId AS NVARCHAR(20)) LIKE N'%' + @search + N'%'
              OR o.RecipientName LIKE N'%' + @search + N'%'
              OR o.PhoneNumber LIKE N'%' + @search + N'%'
              OR o.Email LIKE N'%' + @search + N'%'
            )
        )
        SELECT COUNT(*) AS total FROM FilteredOrders;
      `);

    const total = result.recordsets[1]?.[0]?.total || 0;

    return res.json({
      orders: result.recordsets[0],
      total,
      page,
      limit,
      totalPages: Math.max(Math.ceil(total / limit), 1),
      dateFrom: dateFrom.toISOString(),
      dateTo: dateTo.toISOString(),
    });
  } catch (error) {
    console.error('Load orders failed:', error);
    return res.status(500).json({ message: 'Failed to load orders' });
  }
}

async function getOrderByIdHandler(req, res) {
  try {
    const pool = await getPool();
    const orderId = Number(req.params.id);

    const orderResult = await pool.request()
      .input('orderId', sql.Int, orderId)
      .query('SELECT TOP 1 * FROM Orders WHERE OrderId = @orderId');

    const order = orderResult.recordset[0];
    const canRead = order && (
      req.user.role === 'Admin'
      || req.user.role === 'NVKho'
      || (req.user.role === 'Sale' && (order.Channel === 'Online' || order.AppUserId === req.user.userId))
      || (req.user.role === 'Customer' && order.UserId === req.user.userId)
    );
    if (!canRead) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const detailsResult = await pool.request()
      .input('orderId', sql.Int, orderId)
      .query(`
        SELECT od.*, p.ProductName, p.ImageUrl
        FROM OrderDetails od
        LEFT JOIN Products p ON od.ProductId = p.ProductId
        WHERE od.OrderId = @orderId;
      `);

    return res.json({ ...order, items: detailsResult.recordset });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load order' });
  }
}

module.exports = {
  createOrder: withControllerLog('order.createOrder', createOrderHandler),
  getMyOrders: withControllerLog('order.getMyOrders', getMyOrdersHandler),
  getOrderById: withControllerLog('order.getOrderById', getOrderByIdHandler),
};
