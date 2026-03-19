import axios from 'axios';

// Use production backend URL if env var is not set
const API_URL = process.env.REACT_APP_API_URL || 'https://backend-production-81b7.up.railway.app';

const api = axios.create({
  baseURL: API_URL,
});

// Log API URL in development for debugging
if (process.env.NODE_ENV === 'development') {
  console.log('API URL:', API_URL);
}

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

export const getAllExpenses = (filters = {}) => {
  const params = { limit: 1000 };
  if (filters.startDate) params.start_date = filters.startDate;
  if (filters.endDate) params.end_date = filters.endDate;
  if (filters.category) params.category = filters.category;
  return api.get('/expenses/all', { params });
};

export const getExpenses = (filters = {}) => {
  const params = {};
  if (filters.search) params.search = filters.search;
  if (filters.startDate) params.start_date = filters.startDate;
  if (filters.endDate) params.end_date = filters.endDate;
  if (filters.categories && filters.categories.length > 0) params.categories = filters.categories.join(',');
  if (filters.minAmount) params.min_amount = filters.minAmount;
  if (filters.maxAmount) params.max_amount = filters.maxAmount;
  if (filters.page) params.page = filters.page;
  if (filters.pageSize) params.page_size = filters.pageSize;
  return api.get('/expenses/', { params });
};

export const updateExpense = (id, expense) => {
  return api.put(`/expenses/${id}`, expense);
};

export const deleteExpense = (id) => {
  return api.delete(`/expenses/${id}`);
};

export const getExpensesSummary = () => {
  return api.get('/expenses/summary');
};

// Budgets
export const createBudget = (budget) => {
  return api.post('/budgets/', budget);
};

export const getBudgets = (month, year) => {
  const params = {};
  if (month) params.month = month;
  if (year) params.year = year;
  return api.get('/budgets/', { params });
};

export const getBudgetsProgress = (month, year) => {
  const params = {};
  if (month) params.month = month;
  if (year) params.year = year;
  return api.get('/budgets/progress/current', { params });
};

export const updateBudget = (id, budget) => {
  return api.put(`/budgets/${id}`, budget);
};

export const deleteBudget = (id) => {
  return api.delete(`/budgets/${id}`);
};

// Export
export const exportExpensesCSV = (filters = {}) => {
  const params = {};
  if (filters.startDate) params.start_date = filters.startDate;
  if (filters.endDate) params.end_date = filters.endDate;
  if (filters.category) params.category = filters.category;

  return api.get('/expenses/export/csv', {
    params,
    responseType: 'blob',
  });
};

export const exportExpensesExcel = (filters = {}) => {
  const params = {};
  if (filters.startDate) params.start_date = filters.startDate;
  if (filters.endDate) params.end_date = filters.endDate;
  if (filters.category) params.category = filters.category;

  return api.get('/expenses/export/excel', {
    params,
    responseType: 'blob',
  });
};

// Import
export const importExpensesCSV = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/expenses/import/csv', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export default api;