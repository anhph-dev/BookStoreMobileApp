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
      if (Array.isArray(response.data)) {
        return { orders: response.data.map(normalizeOrder), totalPages: 1, page: 1, total: response.data.length };
      }

      return {
        ...response.data,
        orders: Array.isArray(response.data?.orders) ? response.data.orders.map(normalizeOrder) : [],
      };
    },
    async getOrderById(id) {
      const response = await client.get(`/api/orders/${id}`);
      return normalizeOrder(response.data);
    },
  };
};

export default createOrderService;
