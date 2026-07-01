import React, { useEffect, useState, useRef } from 'react';
// Styles live in src/components/ui/app-shell.css, imported globally from index.css
// (it also holds the light/dark theme variables, so it must load app-wide).

/**
 * Theme Toggle Component
 * Switches between light and dark themes with smooth transitions
 */
const ThemeToggle = () => {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved;
    // Detect system preference
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  });

  const [isAnimating, setIsAnimating] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const root = document.documentElement;

    // Add class to prevent transitions during initial load
    document.body.classList.add('theme-changing');

    root.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);

    // Emit event for other components
    window.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme } }));

    // Remove class after a small delay to allow transitions
    setTimeout(() => {
      document.body.classList.remove('theme-changing');
    }, 50);

    // Cleanup timeout
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [theme]);

  const toggleTheme = () => {
    setIsAnimating(true);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setIsAnimating(false);
    }, 400);

    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const buttonClass = `theme-toggle${isAnimating ? ' animating' : ''}`;

  return (
    <button
      className={buttonClass}
      onClick={toggleTheme}
      aria-label={`Cambiar a modo ${theme === 'dark' ? 'claro' : 'oscuro'}`}
      title={`Modo ${theme === 'dark' ? 'claro' : 'oscuro'}`}
      type="button"
    >
      <span className="theme-toggle-icon" aria-hidden="true">
        {theme === 'dark' ? '🌙' : '☀️'}
      </span>
    </button>
  );
};

export default ThemeToggle;
