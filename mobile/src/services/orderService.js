import createApiClient from '../config/api';
import { normalizeOrder } from '../utils/normalizeApi';

export const createOrderService = (store) => {
  const client = createApiClient(store);

  return {
    async createOrder(payload) {
      const response = await client.post('/api/orders', payload);
      return response.data;
    },
    async getMyOrders(params = {}) {
      const response = await client.get('/api/orders/my', { params });
      return Array.isArray(response.data) ? response.data.map(normalizeOrder) : [];
    },
    async getOrderById(id) {
      const response = await client.get(`/api/orders/${id}`);
      return normalizeOrder(response.data);
    },
  };
};

export default createOrderService;
