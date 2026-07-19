const express = require('express');
const orderController = require('../controllers/order.controller');
const { verifyToken, requireRole } = require('../middlewares/auth');

const router = express.Router();

router.post('/', verifyToken, requireRole('Customer'), orderController.createOrder);
router.get('/my', verifyToken, requireRole('Customer'), orderController.getMyOrders);
router.get('/:id', verifyToken, requireRole('Customer', 'Admin', 'Sale', 'NVKho'), orderController.getOrderById);

module.exports = router;
