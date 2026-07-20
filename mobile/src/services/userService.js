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
    async updateAvatar(file) {
      const formData = new FormData();
      formData.append('avatar', file);

      // Let React Native/axios attach the multipart boundary automatically.
      const response = await client.put('/api/users/me/avatar', formData);
      return response.data;
    },
    async updatePassword(payload) {
      const response = await client.put('/api/users/me/password', payload);
      return response.data;
    },
    async updateFcmToken(fcmToken) {
      const response = await client.put('/api/users/me/fcm-token', { fcmToken });
      return response.data;
    },
    async deleteFcmToken() {
      const response = await client.delete('/api/users/me/fcm-token');
      return response.data;
    },
  };
};

export default createUserService;
