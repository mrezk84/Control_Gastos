import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import Ticker from '../caja/Ticker';
import QuickAddExpense from '../QuickAddExpense';
import { FloatingActionButton } from '../ui/FloatingActionButton';
import { AppDataContext } from '../../context/ExpensesContext';
import { getCurrentUser, getExpenses, logout } from '../../services/api';
import { useTheme } from '../../hooks/useTheme';
import { buildDashboard } from '../../utils/dashboardStats';
import { formatPesos } from '../../utils/formatters';
import { EXPENSE_CREATED_EVENT, FOCUS_REGISTER_EVENT } from '../../utils/events';
import logger from '../../utils/logger';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Panel' },
  { path: '/expenses', label: 'Gastos' },
  { path: '/budgets', label: 'Presupuestos' },
  { path: '/analytics', label: 'Analíticas' },
];

/** Marco de la app: cinta, barra superior con navegación y tema, y datos compartidos. */
function AppLayout({ children }) {
  const [user, setUser] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const { theme, setTheme, toggle } = useTheme();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const onDashboard = pathname === '/dashboard';

  const refresh = useCallback(async () => {
    try {
      const res = await getExpenses();
      setExpenses(res.data);
    } catch (err) {
      logger.error('Error fetching expenses', err);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        if (!localStorage.getItem('token')) {
          navigate('/login');
          return;
        }
        const [me] = await Promise.all([getCurrentUser(), refresh()]);
        if (!cancelled) setUser(me.data);
      } catch {
        localStorage.removeItem('token');
        navigate('/login');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [navigate, refresh]);

  // Los gastos creados desde cualquier lugar (modal de gasto rápido) refrescan los datos compartidos
  useEffect(() => {
    window.addEventListener(EXPENSE_CREATED_EVENT, refresh);
    return () => window.removeEventListener(EXPENSE_CREATED_EVENT, refresh);
  }, [refresh]);

  // Cmd/Ctrl+N: en el panel enfoca el formulario; en el resto abre el gasto rápido
  useEffect(() => {
    const onKey = (e) => {
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n' && !typing) {
        e.preventDefault();
        if (onDashboard) window.dispatchEvent(new CustomEvent(FOCUS_REGISTER_EVENT));
        else setShowQuickAdd(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onDashboard]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onDown = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  const stats = useMemo(() => buildDashboard(expenses), [expenses]);

  const tickerItems = useMemo(
    () => [
      ['Tu control financiero', null],
      ['Gastos registrados', String(stats.count)],
      ['Total', formatPesos(stats.total)],
      ['Categoría top', stats.topCategory],
      ['Actualizado', stats.todayLong],
    ],
    [stats]
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleQuickCreated = useCallback((expense) => {
    window.dispatchEvent(new CustomEvent(EXPENSE_CREATED_EVENT, { detail: expense }));
  }, []);

  const contextValue = useMemo(
    () => ({ user, expenses, loading, refresh }),
    [user, expenses, loading, refresh]
  );

  if (loading) {
    return (
      <div className="callback-loading">
        <div className="spinner" />
        <p>Cargando...</p>
      </div>
    );
  }

  const username = user?.username || user?.email || 'usuario';

  return (
    <AppDataContext.Provider value={contextValue}>
      <div className="cj-app">
        <Ticker items={tickerItems} />
        <header className="cj-topbar">
          <div className="cj-brand">
            <div className="cj-mark" aria-hidden="true">$</div>
            <span>Control de Gastos</span>
          </div>

          <nav className="cj-nav" aria-label="Principal">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.path} to={item.path} className={({ isActive }) => (isActive ? 'active' : '')}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="cj-actions">
            <div className="cj-seg" role="group" aria-label="Tema">
              <button type="button" aria-pressed={theme === 'dark'} onClick={() => setTheme('dark')}>
                <i className="ph ph-moon" aria-hidden="true" />Oscuro
              </button>
              <button type="button" aria-pressed={theme === 'light'} onClick={() => setTheme('light')}>
                <i className="ph ph-sun" aria-hidden="true" />Claro
              </button>
            </div>
            <button
              type="button"
              className="cj-iconbtn"
              onClick={toggle}
              aria-label={`Cambiar a modo ${theme === 'dark' ? 'claro' : 'oscuro'}`}
            >
              <i className={`ph ph-${theme === 'dark' ? 'sun' : 'moon'}`} aria-hidden="true" />
            </button>

            {/* Escritorio: avatar, usuario y Salir a la vista */}
            <div className="cj-account-wide">
              <div className="cj-avatar" title={username}>
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                ) : (
                  <span aria-hidden="true">{username[0].toUpperCase()}</span>
                )}
              </div>
              <span className="cj-user">{username.toLowerCase()}</span>
              <button type="button" className="cj-logout" onClick={handleLogout}>
                <i className="ph ph-sign-out" aria-hidden="true" />Salir
              </button>
            </div>

            {/* Móvil: el avatar abre un menú con el usuario y Salir */}
            <div className="cj-account-narrow" ref={menuRef}>
              <button
                type="button"
                className="cj-avatar-btn"
                aria-label="Cuenta"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((open) => !open)}
              >
                {username[0].toUpperCase()}
              </button>
              {menuOpen && (
                <div className="cj-menu" role="menu">
                  <div className="cj-menu-user">{username.toLowerCase()}</div>
                  <button type="button" role="menuitem" className="cj-menu-item" onClick={handleLogout}>
                    <i className="ph ph-sign-out" aria-hidden="true" />Salir
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="cj-main" id="main-content" tabIndex={-1}>
          {children}
        </main>

        {!onDashboard && (
          <>
            <FloatingActionButton
              onClick={() => setShowQuickAdd(true)}
              icon={<i className="ph ph-plus" aria-hidden="true" />}
              label="Gasto"
              position="bottom-right"
            />
            <QuickAddExpense
              isOpen={showQuickAdd}
              onClose={() => setShowQuickAdd(false)}
              onCreated={handleQuickCreated}
            />
          </>
        )}
      </div>
    </AppDataContext.Provider>
  );
}

export default AppLayout;
