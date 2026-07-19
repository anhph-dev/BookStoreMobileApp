const { getPool, sql } = require('../config/db');
const { withControllerLog } = require('../utils/controllerLogger');

async function createOrderHandler(req, res) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  try {
    const { customerId = null, recipientName, phoneNumber, shippingAddress, cityId = null,
      wardId = null, notes = null, paymentMethod, items = [] } = req.body;
    if (!recipientName || !phoneNumber || !shippingAddress || !Array.isArray(items) || !items.length) {
      return res.status(400).json({ message: 'Thông tin đơn hàng chưa đầy đủ' });
    }
    if (!['CASH', 'COD', 'BankTransfer'].includes(paymentMethod)) {
      return res.status(400).json({ message: 'Phương thức thanh toán không hợp lệ' });
    }
    await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
    let totalAmount = 0;
    const validated = [];
    for (const raw of items) {
      const quantity = Number(raw.quantity);
      const productResult = await new sql.Request(transaction).input('id', sql.Int, Number(raw.productId))
        .query('SELECT ProductId, ProductName, Price, Stock, IsAvailable FROM Products WITH (UPDLOCK, ROWLOCK) WHERE ProductId = @id AND IsDiscontinued = 0');
      const product = productResult.recordset[0];
      const unitPrice = Number(raw.unitPrice ?? product?.Price);
      if (!product || !product.IsAvailable || !Number.isInteger(quantity) || quantity <= 0 || product.Stock < quantity || !Number.isFinite(unitPrice) || unitPrice <= 0) {
        await transaction.rollback();
        return res.status(400).json({ message: product ? `"${product.ProductName}" không đủ tồn kho hoặc dữ liệu không hợp lệ` : 'Sản phẩm không tồn tại' });
      }
      validated.push({ productId: product.ProductId, quantity, unitPrice });
      totalAmount += quantity * unitPrice;
    }
    const result = await new sql.Request(transaction)
      .input('customerId', sql.Int, customerId).input('appUserId', sql.Int, req.user.userId)
      .input('recipientName', sql.NVarChar, recipientName).input('phoneNumber', sql.NVarChar, phoneNumber)
      .input('shippingAddress', sql.NVarChar(sql.MAX), shippingAddress).input('cityId', sql.Int, cityId)
      .input('wardId', sql.Int, wardId).input('notes', sql.NVarChar(sql.MAX), notes)
      .input('paymentMethod', sql.NVarChar, paymentMethod).input('totalAmount', sql.Decimal(18, 2), totalAmount)
      .query(`INSERT INTO Orders (UserId, OrderDate, TotalAmount, Status, RecipientName, PhoneNumber,
        ShippingAddress, Notes, PaymentMethod, PaymentStatus, CityId, WardId, Channel, AppUserId)
        OUTPUT INSERTED.OrderId VALUES (@customerId, GETUTCDATE(), @totalAmount, 'Pending',
        @recipientName, @phoneNumber, @shippingAddress, @notes, @paymentMethod, 'Pending',
        @cityId, @wardId, 'Phone', @appUserId)`);
    const orderId = result.recordset[0].OrderId;
    for (const item of validated) {
      await new sql.Request(transaction).input('orderId', sql.Int, orderId).input('productId', sql.Int, item.productId)
        .input('quantity', sql.Int, item.quantity).input('unitPrice', sql.Decimal(18, 2), item.unitPrice)
        .query(`INSERT INTO OrderDetails (OrderId, ProductId, Quantity, UnitPrice)
          VALUES (@orderId, @productId, @quantity, @unitPrice);
          UPDATE Products SET Stock = Stock - @quantity, SoldCount = SoldCount + @quantity WHERE ProductId = @productId;`);
    }
    await transaction.commit();
    return res.status(201).json({ orderId, totalAmount });
  } catch (error) {
    console.error('Sale order failed:', error);
    try { await transaction.rollback(); } catch (_) {}
    return res.status(500).json({ message: 'Failed to create sale order' });
  }
}

async function searchCustomersHandler(req, res) {
  try {
    const search = String(req.query.search || '').trim();
    if (search.length < 2) return res.json({ customers: [] });
    const pool = await getPool();
    const result = await pool.request().input('search', sql.NVarChar, search).query(`
      SELECT TOP 5 UserId, FullName, Email, PhoneNumber, Address, CityId, WardId
      FROM Users WHERE Role = 'Customer' AND IsLocked = 0
        AND (FullName LIKE N'%' + @search + N'%' OR Email LIKE N'%' + @search + N'%'
          OR PhoneNumber LIKE N'%' + @search + N'%')
      ORDER BY FullName;
    `);
    return res.json({ customers: result.recordset });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to search customers' });
  }
}

module.exports = {
  createOrder: withControllerLog('sale.createOrder', createOrderHandler),
  searchCustomers: withControllerLog('sale.searchCustomers', searchCustomersHandler),
};
