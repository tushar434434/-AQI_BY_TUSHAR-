import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getAqiByCoords = async (lat, lon) => {
  const res = await api.get(`/api/aqi?lat=${lat}&lon=${lon}`);
  return res.data;
};

export const searchCity = async (query) => {
  // Free OpenStreetMap Nominatim API for geocoding
  const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`);
  return res.data;
};

export const reverseGeocode = async (lat, lon) => {
  const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
  return res.data;
};

export const getCities = async () => {
  const res = await api.get('/api/cities');
  return res.data;
};

export const saveCity = async (cityName, lat, lon) => {
  const res = await api.post('/api/cities/save', { city_name: cityName, lat, lon });
  return res.data;
};

export const removeCity = async (cityName) => {
  const res = await api.delete(`/api/cities/${cityName}`);
  return res.data;
};

export const askChatbot = async (message) => {
  const res = await api.post('/api/chat', { message });
  return res.data;
};

export const authLogin = async (username, password) => {
  const res = await api.post('/api/auth/login', { username, password });
  return res.data;
};

export const authRegister = async (username, password) => {
  const res = await api.post('/api/auth/register', { username, password });
  return res.data;
};

export default api;
