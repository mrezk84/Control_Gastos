import { createContext, useContext, useMemo } from 'react';
import { DEFAULT_CURRENCY, formatCurrency, formatK, formatMoney, formatPesos } from '../utils/formatters';

/** Gastos y usuario cargados una vez por AppLayout y compartidos con las páginas. */
export const AppDataContext = createContext({
  user: null,
  expenses: [],
  loading: true,
  refresh: () => {},
  saveProfile: async () => {},
  hormigaConfig: null,
  saveHormigaConfig: async () => {},
  notifications: [],
  unreadCount: 0,
  reminders: [],
  refreshNotifications: () => {},
  refreshReminders: () => {},
});

export const useAppData = () => useContext(AppDataContext);

/** Formateadores de importes ya ligados a la moneda del perfil: un solo criterio en toda la app. */
export const useMoney = () => {
  const { user } = useAppData();
  const currency = user?.currency || DEFAULT_CURRENCY;
  return useMemo(() => ({
    currency,
    formatMoney: (v) => formatMoney(v, currency),
    formatCurrency: (v) => formatCurrency(v, currency),
    formatPesos: (v) => formatPesos(v, currency),
    formatK: (v) => formatK(v, currency),
  }), [currency]);
};
