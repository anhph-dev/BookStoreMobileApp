import createApiClient from '../config/api';

export default function createWarehouseService(store) {
  const client = createApiClient(store);
  return {
    getInventory: async (params) => (await client.get('/api/warehouse/inventory', { params })).data,
  };
}
