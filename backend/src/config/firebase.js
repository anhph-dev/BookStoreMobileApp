const admin = require('firebase-admin');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

try {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Xử lý ký tự xuống dòng của private key nếu bị lỗi định dạng chuỗi
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });

  console.log('=== Firebase Admin SDK Initialized ===');

  // Hàm test kết nối thực tế tới Storage Bucket khi khởi động
  const bucket = admin.storage().bucket();
  bucket.getFiles({ maxResults: 1 })
    .then(() => {
      console.log('✅ Firebase Storage connection test: SUCCESS');
    })
    .catch((error) => {
      console.error('❌ Firebase Storage connection test: FAILED');
      console.error('Chi tiết lỗi:', error.message);
    });

} catch (error) {
  console.error('❌ Firebase Initialization Error:', error.message);
}

module.exports = {
  admin,
  bucket: admin.storage().bucket(),
};
