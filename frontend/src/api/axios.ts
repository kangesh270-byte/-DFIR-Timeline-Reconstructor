import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'https://dfir-timeline-reconstructor-production.up.railway.app';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
