import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
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
// effect (e.g. AppLayout -> getCurrentUser) fires before App's effect sets it.
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

export const logout = () => {
  localStorage.removeItem('token');
  setAuthToken(null);
};

// OAuth
export const getOAuthUrl = (provider, challenge) => {
  return api.get(`/auth/${provider}`, { params: { challenge } });
};

// Canjea el código de un solo uso del acceso social por la sesión (exige el verificador del navegador)
export const exchangeOAuthCode = (code, verifier) => {
  return api.post('/auth/oauth/exchange', { code, verifier });
};

// Vincula la identidad de Google/Microsoft a la cuenta con contraseña que ya existe con ese correo y abre la sesión
export const linkOAuthAccount = (code, verifier, password) => {
  return api.post('/auth/oauth/link', { code, verifier, password });
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

const EXPENSES_PAGE_SIZE = 5000; // máximo por pedido del backend

/**
 * Todos los gastos que cumplen los filtros. El backend entrega a lo sumo 5.000 por pedido y
 * avisa el total real en X-Total-Count: se piden las tandas que falten para no calcular
 * totales y estadísticas con una lista incompleta. Si una tanda falla, falla todo (nunca parcial).
 */
export const getExpenses = async (params = {}) => {
  const first = await api.get('/expenses/', { params: { ...params, limit: EXPENSES_PAGE_SIZE } });
  const total = Number(first.headers?.['x-total-count']) || first.data.length;
  let all = first.data;
  while (all.length < total) {
    const next = await api.get('/expenses/', { params: { ...params, limit: EXPENSES_PAGE_SIZE, offset: all.length } });
    if (!next.data.length) break;
    all = all.concat(next.data);
  }
  return { ...first, data: all };
};

// Alias used by pages that pass optional { startDate, endDate, category } filters
export const getAllExpenses = getExpenses;

export const getExpensesSummary = () => {
  return api.get('/expenses/summary');
};

export const updateExpense = (id, expense) => {
  return api.put(`/expenses/${id}`, expense);
};

export const deleteExpense = (id) => {
  return api.delete(`/expenses/${id}`);
};

// Los filtros vacíos ('' o null) no se envían: el backend rechaza "startDate=" con 422
const withoutEmpty = (params) =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined));

export const exportExpensesCSV = (params = {}) => {
  return api.get('/expenses/export/csv', { params: withoutEmpty(params), responseType: 'blob' });
};

export const exportExpensesExcel = (params = {}) => {
  return api.get('/expenses/export/excel', { params: withoutEmpty(params), responseType: 'blob' });
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

// El archivo requiere el token: pedirlo con api.get(..., { responseType: 'blob' })
export const getReceiptFile = (receiptId) => {
  return api.get(`/receipts/${receiptId}/file`, { responseType: 'blob' });
};

// QR: el texto leído en el navegador se interpreta en el servidor (adaptadores por país, EMVCo, URL, texto)
export const scanQr = (text) => api.post('/receipts/qr', { text });

// Perfil regional (país, moneda, zona horaria)
export const updateProfile = (profile) => api.put('/auth/me', profile);

// Gastos hormiga: umbral (automático o manual), tope, avisos y compras excluidas
export const getHormigaConfig = () => api.get('/hormiga/config');
export const updateHormigaConfig = (patch) => api.put('/hormiga/config', patch);

// Recordatorios de pago
export const getReminders = (status = 'pending') => api.get('/reminders/', { params: { status } });
export const createReminder = (reminder) => api.post('/reminders/', reminder);
export const updateReminder = (id, changes) => api.put(`/reminders/${id}`, changes);
export const deleteReminder = (id) => api.delete(`/reminders/${id}`);
export const payReminder = (id) => api.post(`/reminders/${id}/pay`);

// Notificaciones
export const getNotifications = () => api.get('/notifications/');
export const markNotificationRead = (id) => api.post(`/notifications/${id}/read`);
export const markAllNotificationsRead = () => api.post('/notifications/read-all');

// Web Push
export const getVapidKey = () => api.get('/push/vapid-key');
export const pushSubscribe = (subscription) => api.post('/push/subscribe', subscription);
export const pushUnsubscribe = (endpoint) => api.delete('/push/subscribe', { data: { endpoint } });

export default api;