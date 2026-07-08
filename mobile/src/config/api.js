import axios from 'axios';
import { logout } from '../store/slices/authSlice';

export const createApiClient = (store) => {
  const client = axios.create({
    baseURL: process.env.EXPO_PUBLIC_API_URL,
  });

  client.interceptors.request.use((config) => {
    const token = store?.getState?.()?.auth?.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error?.response?.status === 401) {
        store?.dispatch?.(logout());
      }
      return Promise.reject(error);
    },
  );

  return client;
};

export default createApiClient;
