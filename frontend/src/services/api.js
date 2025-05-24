import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

export const login = (credentials) => {
  console.log('Sending login request:', credentials);
  return api.post('/auth/token', new URLSearchParams(credentials), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
};

export const register = (user) => {
  console.log('Sending register request:', user);
  return api.post('/auth/register', user);
};

export const createExpense = (expense) => {
  console.log('Sending expense request:', expense);
  return api.post('/expenses/', expense);
};

export const getExpenses = () => {
  return api.get('/expenses/');
};

export default api;