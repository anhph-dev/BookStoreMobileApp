const express = require('express');
const productController = require('../controllers/product.controller');
const { verifyToken, requireRole } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

const router = express.Router();

router.get('/', productController.getProducts);
router.get('/meta/categories', productController.getCategories);
router.get('/meta/cities', productController.getCities);
router.get('/meta/cities/:id/wards', productController.getWardsByCity);
router.get('/:id', productController.getProductById);
router.post('/', verifyToken, requireRole('Admin', 'NVKho'), upload.single('image'), productController.createProduct);
router.put('/:id', verifyToken, requireRole('Admin', 'NVKho'), upload.single('image'), productController.updateProduct);
router.delete('/:id', verifyToken, requireRole('Admin', 'NVKho'), productController.deleteProduct);

module.exports = router;
