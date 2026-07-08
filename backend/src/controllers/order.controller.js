const { getPool, sql } = require('../config/db');
const { withControllerLog } = require('../utils/controllerLogger');

async function createOrderHandler(req, res) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  try {
    const { recipientName, phoneNumber, email = null, shippingAddress, notes = null, cityId = null, wardId = null, paymentMethod, items = [] } = req.body;
    const userId = req.user.userId;

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

      totalAmount += Number(item.quantity || 0) * Number(item.unitPrice || product.Price || 0);
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
      await new sql.Request(transaction)
        .input('orderId', sql.Int, orderId)
        .input('productId', sql.Int, item.productId)
        .input('quantity', sql.Int, item.quantity)
        .input('unitPrice', sql.Decimal(18, 2), item.unitPrice)
        .query('INSERT INTO OrderDetails (OrderId, ProductId, Quantity, UnitPrice) VALUES (@orderId, @productId, @quantity, @unitPrice)');

      await new sql.Request(transaction)
        .input('productId', sql.Int, item.productId)
        .input('quantity', sql.Int, item.quantity)
        .query('UPDATE Products SET Stock = Stock - @quantity, SoldCount = SoldCount + @quantity WHERE ProductId = @productId');
    }

    await transaction.commit();
    return res.status(201).json({ orderId, totalAmount, status: 'Pending' });
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({ message: 'Failed to create order' });
  }
}

async function getMyOrdersHandler(req, res) {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('userId', sql.Int, req.user.userId)
      .input('status', sql.NVarChar, req.query.status || null)
      .query(`
        SELECT o.*, c.CityName, w.WardName
        FROM Orders o
        LEFT JOIN Cities c ON o.CityId = c.CityId
        LEFT JOIN Wards w ON o.WardId = w.WardId
        WHERE o.UserId = @userId
          AND (@status IS NULL OR o.Status = @status)
        ORDER BY o.OrderDate DESC;
      `);

    return res.json(result.recordset);
  } catch (error) {
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
    if (!order || order.UserId !== req.user.userId) {
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
