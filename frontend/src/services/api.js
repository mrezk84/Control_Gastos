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

// Auth
export const login = (credentials) => {
  return api.post('/auth/token', new URLSearchParams(credentials), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
};

export const register = (user) => {
  return api.post('/auth/register', user);
};

export const getCurrentUser = () => {
  return api.get('/auth/me');
};

// OAuth
export const getOAuthUrl = (provider) => {
  return api.get(`/auth/${provider}`);
};

// Password Reset
export const requestPasswordReset = (email) => {
  return api.post('/auth/forgot-password', { email });
};

export const resetPassword = (token, new_password) => {
  return api.post('/auth/reset-password', { token, new_password });
};

// Expenses
export const createExpense = (expense) => {
  return api.post('/expenses/', expense);
};

export const getExpenses = () => {
  return api.get('/expenses/');
};

export default api;