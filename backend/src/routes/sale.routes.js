const router = require('express').Router();
const controller = require('../controllers/sale.controller');
const { verifyToken, requireRole } = require('../middlewares/auth');
router.post('/orders', verifyToken, requireRole('Sale'), controller.createOrder);
router.get('/customers', verifyToken, requireRole('Sale'), controller.searchCustomers);
module.exports = router;
