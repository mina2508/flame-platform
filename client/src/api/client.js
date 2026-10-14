import axios from 'axios';

// In production (deployed), set VITE_API_BASE_URL to the server origin, e.g.
//   https://flame-api.onrender.com
// Locally it falls back to '' so the Vite dev proxy handles '/api' and '/uploads'.
export const API_ORIGIN = import.meta.env.VITE_API_BASE_URL || '';
export const api = axios.create({ baseURL: `${API_ORIGIN}/api` });

// Build an absolute URL for uploaded files (PDFs, images).
export const fileUrl = (path) => (path ? `${API_ORIGIN}${path}` : path);

// attach token if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('flame_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
