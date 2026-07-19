const router = require('express').Router();
const controller = require('../controllers/admin.controller');
const { verifyToken, requireRole } = require('../middlewares/auth');

router.use(verifyToken);
router.get('/dashboard', requireRole('Admin'), controller.getDashboard);
router.get('/customers', requireRole('Admin'), controller.getCustomers);
router.get('/customers/:id', requireRole('Admin'), controller.getCustomerById);
router.put('/customers/:id/lock', requireRole('Admin'), controller.updateCustomerLock);
router.get('/orders', requireRole('Admin', 'Sale', 'NVKho'), controller.getOrders);
router.put('/orders/:id/status', requireRole('Admin', 'Sale', 'NVKho'), controller.updateOrderStatus);
module.exports = router;
