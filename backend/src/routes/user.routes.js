const express = require('express');
const userController = require('../controllers/user.controller');
const { verifyToken } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

const router = express.Router();

router.get('/me', verifyToken, userController.getMe);
router.put('/me', verifyToken, userController.updateMe);
router.put('/me/avatar', verifyToken, upload.single('avatar'), userController.updateAvatar);
router.put('/me/password', verifyToken, userController.updatePassword);
router.put('/me/fcm-token', verifyToken, userController.updateFcmToken);
router.delete('/me/fcm-token', verifyToken, userController.deleteFcmToken);

module.exports = router;
