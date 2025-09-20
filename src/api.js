import axios from 'axios';

export const API_BASE = 'http://31.97.202.194/api';

const instance = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

// attach token automatically
instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('edu_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default instance;