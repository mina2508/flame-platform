import axios from 'axios';

export const api = axios.create({ baseURL: '/api' });

// attach token if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('flame_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
