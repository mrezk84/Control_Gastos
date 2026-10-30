import { createContext, useContext } from 'react';

/** Gastos y usuario cargados una vez por AppLayout y compartidos con las páginas. */
export const AppDataContext = createContext({
  user: null,
  expenses: [],
  loading: true,
  refresh: () => {},
});

export const useAppData = () => useContext(AppDataContext);
