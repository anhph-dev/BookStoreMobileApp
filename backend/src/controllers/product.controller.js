const { randomUUID } = require('crypto');
const path = require('path');
const { getPool, sql } = require('../config/db');
const { bucket } = require('../config/firebase');
const { withControllerLog } = require('../utils/controllerLogger');

function boolParam(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  return ['1', 'true', 'yes'].includes(String(value).toLowerCase());
}

function intParam(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildImageUrl(file) {
  if (!file) {
    return null;
  }

  if (!bucket) {
    throw new Error('Firebase Storage is not configured');
  }

  return new Promise((resolve, reject) => {
    const extension = path.extname(file.originalname || '.jpg') || '.jpg';
    const fileName = `products/${randomUUID()}${extension}`;
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

async function getProductsHandler(req, res) {
  try {
    const pool = await getPool();
    const filters = {
      search: req.query.search || null,
      categoryId: intParam(req.query.categoryId),
      minPrice: intParam(req.query.minPrice),
      maxPrice: intParam(req.query.maxPrice),
      isFeatured: boolParam(req.query.isFeatured),
      isNewArrival: boolParam(req.query.isNewArrival),
      isBestSeller: boolParam(req.query.isBestSeller),
      isAvailable: req.query.isAvailable === undefined ? true : boolParam(req.query.isAvailable),
      page: Math.max(intParam(req.query.page) || 1, 1),
      limit: Math.min(Math.max(intParam(req.query.limit) || 10, 1), 100),
    };

    const where = [
      'p.IsDiscontinued = 0',
      "(@search IS NULL OR p.ProductName LIKE N'%' + @search + N'%' OR p.Author LIKE N'%' + @search + N'%' )",
      '(@categoryId IS NULL OR p.CategoryId = @categoryId)',
      '(@minPrice IS NULL OR p.Price >= @minPrice)',
      '(@maxPrice IS NULL OR p.Price <= @maxPrice)',
      '(@isFeatured IS NULL OR p.IsFeatured = @isFeatured)',
      '(@isNewArrival IS NULL OR p.IsNewArrival = @isNewArrival)',
      '(@isBestSeller IS NULL OR p.IsBestSeller = @isBestSeller)',
      '(@isAvailable IS NULL OR p.IsAvailable = @isAvailable)',
    ].join(' AND ');

    const query = `
      SELECT
        p.ProductId,
        p.ProductName,
        p.ISBN,
        p.Author,
        p.Publisher,
        p.[Language],
        p.[PageCount],
        p.[Format],
        p.[Edition],
        p.[PublicationDate],
        p.Price,
        p.OriginalPrice,
        p.DiscountPercent,
        p.Stock,
        p.ImageUrl,
        p.AverageRating,
        p.ReviewCount,
        p.IsFeatured,
        p.IsNewArrival,
        p.IsBestSeller,
        p.CategoryId,
        c.CategoryName
      FROM Products p
      LEFT JOIN Categories c ON p.CategoryId = c.CategoryId
      WHERE ${where}
      ORDER BY p.ProductId DESC
      OFFSET (@page - 1) * @limit ROWS FETCH NEXT @limit ROWS ONLY;
    `;

    const countQuery = `SELECT COUNT(*) AS total FROM Products p WHERE ${where};`;

    const request = pool.request()
      .input('search', sql.NVarChar, filters.search)
      .input('categoryId', sql.Int, filters.categoryId)
      .input('minPrice', sql.Decimal(18, 2), filters.minPrice)
      .input('maxPrice', sql.Decimal(18, 2), filters.maxPrice)
      .input('isFeatured', sql.Bit, filters.isFeatured)
      .input('isNewArrival', sql.Bit, filters.isNewArrival)
      .input('isBestSeller', sql.Bit, filters.isBestSeller)
      .input('isAvailable', sql.Bit, filters.isAvailable)
      .input('page', sql.Int, filters.page)
      .input('limit', sql.Int, filters.limit);

    const [itemsResult, countResult] = await Promise.all([
      request.query(query),
      pool.request()
        .input('search', sql.NVarChar, filters.search)
        .input('categoryId', sql.Int, filters.categoryId)
        .input('minPrice', sql.Decimal(18, 2), filters.minPrice)
        .input('maxPrice', sql.Decimal(18, 2), filters.maxPrice)
        .input('isFeatured', sql.Bit, filters.isFeatured)
        .input('isNewArrival', sql.Bit, filters.isNewArrival)
        .input('isBestSeller', sql.Bit, filters.isBestSeller)
        .input('isAvailable', sql.Bit, filters.isAvailable)
        .query(countQuery),
    ]);

    const total = countResult.recordset[0]?.total || 0;
    const totalPages = Math.max(Math.ceil(total / filters.limit), 1);

    return res.json({
      products: itemsResult.recordset,
      total,
      page: filters.page,
      totalPages,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load products' });
  }
}

async function getProductByIdHandler(req, res) {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, Number(req.params.id))
      .query(`
        SELECT TOP 1
          p.*, c.CategoryName
        FROM Products p
        LEFT JOIN Categories c ON p.CategoryId = c.CategoryId
        WHERE p.ProductId = @id;
      `);

    const product = result.recordset[0];
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    return res.json(product);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load product' });
  }
}

async function getCategoriesHandler(req, res) {
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT * FROM Categories ORDER BY CategoryName');
    return res.json(result.recordset);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load categories' });
  }
}

async function getCitiesHandler(req, res) {
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT * FROM Cities WHERE IsActive = 1 ORDER BY CityName');
    return res.json(result.recordset);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load cities' });
  }
}

async function getWardsByCityHandler(req, res) {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, Number(req.params.id))
      .query('SELECT * FROM Wards WHERE CityId = @id AND IsActive = 1 ORDER BY WardName');
    return res.json(result.recordset);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load wards' });
  }
}

async function createProductHandler(req, res) {
  try {
    const pool = await getPool();
    const imageUrl = await buildImageUrl(req.file);
    const payload = req.body;

    const result = await pool.request()
      .input('productName', sql.NVarChar, payload.productName)
      .input('isbn', sql.NVarChar, payload.isbn || null)
      .input('author', sql.NVarChar, payload.author || null)
      .input('publisher', sql.NVarChar, payload.publisher || null)
      .input('language', sql.NVarChar, payload.language || null)
      .input('pageCount', sql.Int, intParam(payload.pageCount))
      .input('format', sql.NVarChar, payload.format || null)
      .input('edition', sql.NVarChar, payload.edition || null)
      .input('publicationDate', sql.Date, payload.publicationDate || null)
      .input('price', sql.Decimal(18, 2), payload.price)
      .input('originalPrice', sql.Decimal(18, 2), payload.originalPrice || payload.price)
      .input('discountPercent', sql.Int, payload.discountPercent || 0)
      .input('stock', sql.Int, payload.stock || 0)
      .input('categoryId', sql.Int, payload.categoryId || null)
      .input('imageUrl', sql.NVarChar, imageUrl)
      .input('isFeatured', sql.Bit, boolParam(payload.isFeatured))
      .input('isNewArrival', sql.Bit, boolParam(payload.isNewArrival))
      .input('isBestSeller', sql.Bit, boolParam(payload.isBestSeller))
      .input('isAvailable', sql.Bit, boolParam(payload.isAvailable ?? true))
      .input('shortDescription', sql.NVarChar(sql.MAX), payload.shortDescription || null)
      .input('description', sql.NVarChar(sql.MAX), payload.description || null)
      .query(`
        INSERT INTO Products (
          ProductName, ISBN, Author, Publisher, [Language], [PageCount],
          [Format], [Edition], [PublicationDate],
          Price, OriginalPrice,
          DiscountPercent, Stock, CategoryId, ImageUrl, AverageRating,
          ReviewCount, IsFeatured, IsNewArrival, IsBestSeller, IsAvailable,
          IsDiscontinued, ShortDescription, Description
        )
        OUTPUT INSERTED.ProductId
        VALUES (
          @productName, @isbn, @author, @publisher, @language, @pageCount,
          @format, @edition, @publicationDate,
          @price, @originalPrice,
          @discountPercent, @stock, @categoryId, @imageUrl, 0,
          0, @isFeatured, @isNewArrival, @isBestSeller, @isAvailable,
          0, @shortDescription, @description
        );
      `);

    return res.status(201).json({ productId: result.recordset[0].ProductId, message: 'Thêm sản phẩm thành công' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create product' });
  }
}

async function updateProductHandler(req, res) {
  try {
    const pool = await getPool();
    const payload = req.body;
    const productId = Number(req.params.id);

    const current = await pool.request()
      .input('id', sql.Int, productId)
      .query('SELECT TOP 1 ImageUrl, DiscountPercent FROM Products WHERE ProductId = @id');

    const oldProduct = current.recordset[0];
    if (!oldProduct) return res.status(404).json({ message: 'Product not found' });
    let imageUrl = oldProduct.ImageUrl || null;
    if (req.file) {
      imageUrl = await buildImageUrl(req.file);
    }

    await pool.request()
      .input('id', sql.Int, productId)
      .input('productName', sql.NVarChar, payload.productName)
      .input('isbn', sql.NVarChar, payload.isbn || null)
      .input('author', sql.NVarChar, payload.author || null)
      .input('publisher', sql.NVarChar, payload.publisher || null)
      .input('language', sql.NVarChar, payload.language || null)
      .input('pageCount', sql.Int, intParam(payload.pageCount))
      .input('format', sql.NVarChar, payload.format || null)
      .input('edition', sql.NVarChar, payload.edition || null)
      .input('publicationDate', sql.Date, payload.publicationDate || null)
      .input('price', sql.Decimal(18, 2), payload.price)
      .input('originalPrice', sql.Decimal(18, 2), payload.originalPrice || payload.price)
      .input('discountPercent', sql.Int, payload.discountPercent || 0)
      .input('stock', sql.Int, payload.stock || 0)
      .input('categoryId', sql.Int, payload.categoryId || null)
      .input('imageUrl', sql.NVarChar, imageUrl)
      .input('isFeatured', sql.Bit, boolParam(payload.isFeatured))
      .input('isNewArrival', sql.Bit, boolParam(payload.isNewArrival))
      .input('isBestSeller', sql.Bit, boolParam(payload.isBestSeller))
      .input('isAvailable', sql.Bit, boolParam(payload.isAvailable ?? true))
      .input('shortDescription', sql.NVarChar(sql.MAX), payload.shortDescription || null)
      .input('description', sql.NVarChar(sql.MAX), payload.description || null)
      .query(`
        UPDATE Products SET
          ProductName = @productName,
          ISBN = @isbn,
          Author = @author,
          Publisher = @publisher,
          [Language] = @language,
          [PageCount] = @pageCount,
          [Format] = @format,
          [Edition] = @edition,
          [PublicationDate] = @publicationDate,
          Price = @price,
          OriginalPrice = @originalPrice,
          DiscountPercent = @discountPercent,
          Stock = @stock,
          CategoryId = @categoryId,
          ImageUrl = @imageUrl,
          IsFeatured = @isFeatured,
          IsNewArrival = @isNewArrival,
          IsBestSeller = @isBestSeller,
          IsAvailable = @isAvailable,
          ShortDescription = @shortDescription,
          Description = @description
        WHERE ProductId = @id;
      `);

    return res.json({ message: 'Cập nhật thành công' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update product' });
  }
}

async function deleteProductHandler(req, res) {
  try {
    const pool = await getPool();
    await pool.request()
      .input('id', sql.Int, Number(req.params.id))
      .query('UPDATE Products SET IsDiscontinued = 1, IsAvailable = 0 WHERE ProductId = @id');

    return res.json({ message: 'Đã xóa sản phẩm' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete product' });
  }
}

module.exports = {
  getProducts: withControllerLog('product.getProducts', getProductsHandler),
  getProductById: withControllerLog('product.getProductById', getProductByIdHandler),
  getCategories: withControllerLog('product.getCategories', getCategoriesHandler),
  getCities: withControllerLog('product.getCities', getCitiesHandler),
  getWardsByCity: withControllerLog('product.getWardsByCity', getWardsByCityHandler),
  createProduct: withControllerLog('product.createProduct', createProductHandler),
  updateProduct: withControllerLog('product.updateProduct', updateProductHandler),
  deleteProduct: withControllerLog('product.deleteProduct', deleteProductHandler),
};
