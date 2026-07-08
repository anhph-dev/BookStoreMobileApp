const Stripe = require('stripe');
const { getPool, sql } = require('../config/db');
const { withControllerLog } = require('../utils/controllerLogger');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function createIntentHandler(req, res) {
  try {
    const pool = await getPool();
    const { orderId } = req.body;

    const result = await pool.request()
      .input('orderId', sql.Int, orderId)
      .input('userId', sql.Int, req.user.userId)
      .query('SELECT TOP 1 * FROM Orders WHERE OrderId = @orderId AND UserId = @userId');

    const order = result.recordset[0];
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const intent = await stripe.paymentIntents.create({
      amount: Math.round(Number(order.TotalAmount || 0) * 100),
      currency: 'vnd',
      metadata: { orderId: String(order.OrderId) },
    });

    return res.json({ clientSecret: intent.client_secret });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create payment intent' });
  }
}

async function webhookHandler(req, res) {
  try {
    const signature = req.headers['stripe-signature'];
    const event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);

    if (event.type === 'payment_intent.succeeded') {
      const orderId = Number(event.data.object.metadata.orderId);
      const pool = await getPool();
      await pool.request()
        .input('orderId', sql.Int, orderId)
        .query(`
          UPDATE Orders
          SET PaymentStatus = 'Paid', PaidAt = GETUTCDATE(), Status = 'Pending'
          WHERE OrderId = @orderId;
        `);
    }

    return res.json({ received: true });
  } catch (error) {
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }
}

module.exports = {
  createIntent: withControllerLog('payment.createIntent', createIntentHandler),
  webhook: withControllerLog('payment.webhook', webhookHandler),
};
