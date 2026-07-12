import createApiClient from '../config/api';

export const createAuthService = (store) => {
  const client = createApiClient(store);

  return {
    async login(payload) {
      const response = await client.post('/api/auth/login', payload);
      return response.data;
    },
    async register(payload) {
      const response = await client.post('/api/auth/register', payload);
      return response.data;
    },
  };
};

export default createAuthService;
