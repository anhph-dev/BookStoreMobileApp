require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { getPool } = require('./config/db');

const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const orderRoutes = require('./routes/order.routes');
const userRoutes = require('./routes/user.routes');
const paymentRoutes = require('./routes/payment.routes');

const app = express();

app.use(cors());

// Ghi log HTTP đầu vào trước khi request đi vào controller.
app.use((req, _res, next) => {
  console.log(`[HTTP] ${req.method} ${req.originalUrl}`);
  next();
});

// Stripe webhook cần raw body nên bỏ qua bước parse JSON cho route này.
app.use((req, res, next) => {
  if (req.originalUrl === '/api/payment/webhook') {
    return next();
  }
  return express.json()(req, res, next);
});

app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payment', paymentRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

const port = process.env.PORT || 3000;

async function startServer() {
  try {
    // Chủ động mở kết nối database trước khi nhận traffic.
    await getPool();
    console.log('Database connection established successfully');

    app.listen(port, () => {
      console.log(`Backend listening on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to connect to database before startup');
    console.error(error);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = app;
