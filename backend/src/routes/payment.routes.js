const express = require('express');
const paymentController = require('../controllers/payment.controller');
const { verifyToken, requireRole } = require('../middlewares/auth');

const router = express.Router();

router.post('/create-intent', verifyToken, requireRole('Customer'), paymentController.createIntent);
router.post('/webhook', paymentController.webhook);

module.exports = router;
