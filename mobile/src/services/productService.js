import createApiClient from '../config/api';
import { normalizeCategory, normalizeCity, normalizeProduct, normalizeWard } from '../utils/normalizeApi';

export const createProductService = (store) => {
  const client = createApiClient(store);

  return {
    async getProducts(params = {}) {
      const response = await client.get('/api/products', { params });
      return {
        ...response.data,
        products: Array.isArray(response.data?.products) ? response.data.products.map(normalizeProduct) : [],
      };
    },
    async getProductById(id) {
      const response = await client.get(`/api/products/${id}`);
      return normalizeProduct(response.data);
    },
    async getCategories() {
      const response = await client.get('/api/products/meta/categories');
      return Array.isArray(response.data) ? response.data.map(normalizeCategory) : [];
    },
    async getCities() {
      const response = await client.get('/api/products/meta/cities');
      return Array.isArray(response.data) ? response.data.map(normalizeCity) : [];
    },
    async getWards(cityId) {
      const response = await client.get(`/api/products/meta/cities/${cityId}/wards`);
      return Array.isArray(response.data) ? response.data.map(normalizeWard) : [];
    },
    async createProduct(payload) {
      const response = await client.post('/api/products', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    async updateProduct(id, payload) {
      const response = await client.put(`/api/products/${id}`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    async deleteProduct(id) {
      const response = await client.delete(`/api/products/${id}`);
      return response.data;
    },
  };
};

export default createProductService;
