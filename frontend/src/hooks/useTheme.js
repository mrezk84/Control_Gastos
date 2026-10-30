import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'theme';

const readInitial = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {
    // localStorage no disponible: se usa la preferencia del sistema
  }
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
};

/** Tema oscuro/claro: escribe data-theme en <html>, lo recuerda y avisa con 'theme-changed'. */
export function useTheme() {
  const [theme, setThemeState] = useState(readInitial);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // sin persistencia: el tema vale solo para esta sesión
    }
    window.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme } }));
  }, [theme]);

  const setTheme = useCallback((value) => setThemeState(value === 'light' ? 'light' : 'dark'), []);
  const toggle = useCallback(() => setThemeState((t) => (t === 'dark' ? 'light' : 'dark')), []);

  return { theme, setTheme, toggle };
}
