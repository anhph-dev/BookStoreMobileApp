import createApiClient from '../config/api';

export const createPaymentService = (store) => {
  const client = createApiClient(store);

  return {
    async createPaymentIntent(orderId) {
      const response = await client.post('/api/payment/create-intent', { orderId });
      return response.data;
    },
  };
};

export default createPaymentService;
