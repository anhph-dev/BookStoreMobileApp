import createApiClient from '../config/api';

export default function createAdminService(store) {
  const client = createApiClient(store);
  return {
    getDashboard: async () => (await client.get('/api/admin/dashboard')).data,
    getCustomers: async (params) => (await client.get('/api/admin/customers', { params })).data,
    getCustomer: async (id) => (await client.get(`/api/admin/customers/${id}`)).data,
    updateCustomerLock: async (id, isLocked) => (await client.put(`/api/admin/customers/${id}/lock`, { isLocked })).data,
    getOrders: async (params) => (await client.get('/api/admin/orders', { params })).data,
    updateOrderStatus: async (id, status) => (await client.put(`/api/admin/orders/${id}/status`, { status })).data,
    createSaleOrder: async (payload) => (await client.post('/api/sale/orders', payload)).data,
    searchSaleCustomers: async (params) => (await client.get('/api/sale/customers', { params })).data,
  };
}
