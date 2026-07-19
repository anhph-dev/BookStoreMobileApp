const { getPool, sql } = require('../config/db');
const { withControllerLog } = require('../utils/controllerLogger');

async function getInventoryHandler(req, res) {
  try {
    const stockStatus = ['low', 'out'].includes(req.query.stockStatus) ? req.query.stockStatus : 'all';
    const categoryId = Number(req.query.categoryId) || null;
    const search = String(req.query.search || '').trim() || null;
    const pool = await getPool();
    const result = await pool.request().input('stockStatus', sql.NVarChar, stockStatus)
      .input('categoryId', sql.Int, categoryId).input('search', sql.NVarChar, search).query(`
        SELECT p.ProductId, p.ProductName, p.Stock, p.SoldCount, p.CategoryId, c.CategoryName,
          CASE WHEN p.Stock = 0 THEN N'Hết hàng' WHEN p.Stock < 10 THEN N'Sắp hết' ELSE N'Còn hàng' END StockStatus
        FROM Products p JOIN Categories c ON p.CategoryId = c.CategoryId
        WHERE p.IsDiscontinued = 0 AND (@categoryId IS NULL OR p.CategoryId = @categoryId)
          AND (@search IS NULL OR p.ProductName LIKE N'%' + @search + N'%')
          AND (@stockStatus = 'all' OR (@stockStatus = 'out' AND p.Stock = 0)
            OR (@stockStatus = 'low' AND p.Stock > 0 AND p.Stock < 10))
        ORDER BY p.Stock, p.ProductName;
        SELECT COUNT(*) total, SUM(CASE WHEN Stock < 10 THEN 1 ELSE 0 END) lowStockCount,
          SUM(CASE WHEN Stock = 0 THEN 1 ELSE 0 END) outOfStockCount
        FROM Products WHERE IsDiscontinued = 0;
      `);
    const summary = result.recordsets[1]?.[0] || {};
    return res.json({ products: result.recordsets[0] || [], total: summary.total || 0,
      lowStockCount: summary.lowStockCount || 0, outOfStockCount: summary.outOfStockCount || 0 });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load inventory' });
  }
}

module.exports = { getInventory: withControllerLog('warehouse.inventory', getInventoryHandler) };
