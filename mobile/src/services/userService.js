import createApiClient from '../config/api';

export const createUserService = (store) => {
  const client = createApiClient(store);

  return {
    async getMe() {
      const response = await client.get('/api/users/me');
      return response.data;
    },
    async updateMe(payload) {
      const response = await client.put('/api/users/me', payload);
      return response.data;
    },
    async updatePassword(payload) {
      const response = await client.put('/api/users/me/password', payload);
      return response.data;
    },
  };
};

export default createUserService;
