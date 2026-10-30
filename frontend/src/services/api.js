import axios from 'axios';
import { supabase, OAUTH_PROVIDERS } from './supabase';

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
// `token` mirrors the current Supabase access token.
setAuthToken(localStorage.getItem('token'));

const storeSession = (session) => {
  const token = session?.access_token || null;
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
  setAuthToken(token);
};

// Keep the mirrored token in sync when Supabase signs in, refreshes or signs out.
supabase.auth.onAuthStateChange((_event, session) => storeSession(session));

// Always send the freshest access token (Supabase refreshes it in the background).
api.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global 401 handler: if the token is missing/expired, clear it and send the
// user back to login instead of failing silently on every request.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401) {
      supabase.auth.signOut().catch(() => {});
      storeSession(null);
      if (window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  }
);

const throwOnError = ({ data, error }) => {
  if (error) throw error;
  return data;
};

// Auth (Supabase)
export const login = async ({ email, password }) => {
  const data = throwOnError(await supabase.auth.signInWithPassword({ email, password }));
  storeSession(data.session);
  return data;
};

export const register = async ({ username, email, password }) => {
  const data = throwOnError(await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username },
      emailRedirectTo: `${window.location.origin}/oauth-callback`,
    },
  }));
  storeSession(data.session);
  return data;
};

export const logout = async () => {
  storeSession(null);
  await supabase.auth.signOut().catch(() => {});
};

export const completeOAuthLogin = async () => {
  // detectSessionInUrl exchanges the ?code= / #access_token returned by Supabase
  const data = throwOnError(await supabase.auth.getSession());
  storeSession(data.session);
  return data.session;
};

export const getCurrentUser = () => {
  return api.get('/auth/me');
};

// OAuth: redirects the browser to Google / Microsoft / Apple through Supabase
export const signInWithOAuth = async (provider) => {
  const options = { redirectTo: `${window.location.origin}/oauth-callback` };
  if (provider === 'microsoft') {
    options.scopes = 'email';
  }
  return throwOnError(await supabase.auth.signInWithOAuth({
    provider: OAUTH_PROVIDERS[provider] || provider,
    options,
  }));
};

// Password Reset
export const requestPasswordReset = async (email) => {
  return throwOnError(await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  }));
};

export const resetPassword = async (new_password) => {
  return throwOnError(await supabase.auth.updateUser({ password: new_password }));
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