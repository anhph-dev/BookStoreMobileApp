const multer = require('multer');

// Lưu ảnh tạm trong RAM để có thể đẩy trực tiếp lên Firebase Storage.
const storage = multer.memoryStorage();

module.exports = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});
