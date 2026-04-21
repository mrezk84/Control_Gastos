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

export const updateExpense = (id, expense) => {
  return api.put(`/expenses/${id}`, expense);
};

export const deleteExpense = (id) => {
  return api.delete(`/expenses/${id}`);
};

// Receipts
export const scanReceipt = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/receipts/scan', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const uploadReceipt = (expenseId, file) => {
  const formData = new FormData();
  formData.append('expense_id', expenseId);
  formData.append('file', file);
  return api.post('/receipts/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const getExpenseReceipts = (expenseId) => {
  return api.get(`/receipts/expense/${expenseId}`);
};

export const getReceiptImageUrl = (filename) => {
  return `${process.env.REACT_APP_API_URL}/receipts/view/${filename}`;
};

export default api;