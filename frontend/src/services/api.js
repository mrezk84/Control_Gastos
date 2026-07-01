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

// Initialize the auth header synchronously at module load, before any component
// renders. This avoids a race on hard refresh / direct navigation where a child
// effect (e.g. SidebarLayout -> getCurrentUser) fires before App's effect sets it.
setAuthToken(localStorage.getItem('token'));

// Global 401 handler: if the token is missing/expired, clear it and send the
// user back to login instead of failing silently on every request.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const isAuthEndpoint = error.config?.url?.includes('/auth/');
    if (status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('token');
      setAuthToken(null);
      if (window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  }
);

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

export const getExpenses = (params = {}) => {
  return api.get('/expenses/', { params });
};

// Alias used by pages that pass optional { startDate, endDate, category } filters
export const getAllExpenses = (params = {}) => {
  return api.get('/expenses/', { params });
};

export const getExpensesSummary = () => {
  return api.get('/expenses/summary');
};

export const updateExpense = (id, expense) => {
  return api.put(`/expenses/${id}`, expense);
};

export const deleteExpense = (id) => {
  return api.delete(`/expenses/${id}`);
};

export const exportExpensesCSV = (params = {}) => {
  return api.get('/expenses/export/csv', { params, responseType: 'blob' });
};

export const exportExpensesExcel = (params = {}) => {
  return api.get('/expenses/export/excel', { params, responseType: 'blob' });
};

export const importExpensesCSV = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/expenses/import/csv', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// Budgets
export const getBudgets = (params = {}) => {
  return api.get('/budgets/', { params });
};

export const getBudgetsProgress = (month, year) => {
  return api.get('/budgets/progress/current', { params: { month, year } });
};

export const createBudget = (budget) => {
  return api.post('/budgets/', budget);
};

export const updateBudget = (id, budget) => {
  return api.put(`/budgets/${id}`, budget);
};

export const deleteBudget = (id) => {
  return api.delete(`/budgets/${id}`);
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