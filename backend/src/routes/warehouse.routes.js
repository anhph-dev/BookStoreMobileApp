const router = require('express').Router();
const controller = require('../controllers/warehouse.controller');
const { verifyToken, requireRole } = require('../middlewares/auth');
router.get('/inventory', verifyToken, requireRole('Admin', 'NVKho'), controller.getInventory);
module.exports = router;
