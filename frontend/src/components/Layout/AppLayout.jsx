import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import NotificationBell from '../caja/NotificationBell';
import Ticker from '../caja/Ticker';
import QuickAddExpense from '../QuickAddExpense';
import { AppDataContext } from '../../context/ExpensesContext';
import { getCurrentUser, getExpenses, getHormigaConfig, getNotifications, getReminders, logout, updateHormigaConfig, updateProfile } from '../../services/api';
import { useTheme } from '../../hooks/useTheme';
import { buildDashboard } from '../../utils/dashboardStats';
import { formatMoney } from '../../utils/formatters';
import { buildHormiga, DEFAULT_THRESHOLD } from '../../utils/hormiga';
import { missingRegional } from '../../utils/regional';
import { EXPENSE_CREATED_EVENT, FOCUS_REGISTER_EVENT } from '../../utils/events';
import logger from '../../utils/logger';
import PageLoader from '../ui/PageLoader';
import AyudaChat from '../ayuda/AyudaChat';
import { PageTransition } from '../ui/PageTransition';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Panel', icon: 'squares-four' },
  { path: '/expenses', label: 'Gastos', icon: 'receipt' },
  { path: '/budgets', label: 'Presupuestos', icon: 'target' },
  { path: '/analytics', label: 'Analíticas', icon: 'chart-line-up' },
  { path: '/hormiga', label: 'Gastos hormiga', icon: 'sparkle' },
];

/** Marco de la app: cinta, barra superior con navegación y tema, y datos compartidos. */
function AppLayout({ children }) {
  const [user, setUser] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [notifications, setNotifications] = useState({ unread_count: 0, notifications: [] });
  const [reminders, setReminders] = useState([]);
  const [hormigaConfig, setHormigaConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
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

  // Avisos y recordatorios: errores no críticos (el resto de la app funciona sin ellos)
  const refreshNotifications = useCallback(async () => {
    try {
      setNotifications((await getNotifications()).data);
    } catch (err) {
      logger.error('Error fetching notifications', err);
    }
  }, []);

  const refreshReminders = useCallback(async () => {
    try {
      setReminders((await getReminders('pending')).data);
    } catch (err) {
      logger.error('Error fetching reminders', err);
    }
  }, []);

  const refreshAll = useCallback(() => {
    refresh();
    refreshNotifications();
    refreshReminders();
  }, [refresh, refreshNotifications, refreshReminders]);

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

  // Con la sesión cargada: avisos y recordatorios al entrar y cada vez que la pestaña vuelve a primer plano
  const signedIn = Boolean(user);
  useEffect(() => {
    if (!signedIn) return undefined;
    refreshNotifications();
    refreshReminders();
    getHormigaConfig().then((res) => setHormigaConfig(res.data)).catch(() => {});
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        refreshNotifications();
        refreshReminders();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [signedIn, refreshNotifications, refreshReminders]);

  // Perfil regional: la primera vez se rellena con lo que detecta el navegador (sin pisar lo ya elegido)
  useEffect(() => {
    if (!user) return;
    const missing = missingRegional(user);
    if (Object.keys(missing).length === 0) return;
    updateProfile(missing).then((res) => setUser(res.data)).catch(() => {});
  }, [user]);

  // Los gastos creados desde cualquier lugar (modal de gasto rápido) refrescan los datos compartidos
  useEffect(() => {
    window.addEventListener(EXPENSE_CREATED_EVENT, refreshAll);
    return () => window.removeEventListener(EXPENSE_CREATED_EVENT, refreshAll);
  }, [refreshAll]);

  // Cmd/Ctrl+N: en el panel enfoca el formulario; en el resto abre el gasto rápido (ya no hay botón flotante)
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

  const tickerItems = useMemo(() => {
    if (pathname === '/hormiga') {
      const ant = buildHormiga(expenses, hormigaConfig?.threshold ?? DEFAULT_THRESHOLD, new Date(), hormigaConfig?.excluded || []);
      return [
        ['Gastos hormiga', formatMoney(ant.total, user?.currency)],
        ['Compras chicas', String(ant.count)],
        ['Top', ant.top[0]?.name || '—'],
        ['Actualizado', stats.todayLong],
      ];
    }
    return [
      ['Tu control financiero', null],
      ['Gastos registrados', String(stats.count)],
      ['Total', formatMoney(stats.total, user?.currency)],
      ['Categoría top', stats.topCategory],
      ['Actualizado', stats.todayLong],
    ];
  }, [stats, expenses, pathname, user?.currency, hormigaConfig]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleQuickCreated = useCallback((expense) => {
    window.dispatchEvent(new CustomEvent(EXPENSE_CREATED_EVENT, { detail: expense }));
  }, []);

  // Guarda datos del perfil (moneda, país…) y deja el usuario del contexto al día
  const saveProfile = useCallback(async (patch) => {
    const res = await updateProfile(patch);
    setUser(res.data);
  }, []);

  // Preferencias de gastos hormiga (umbral, tope, avisos, excluidas): viven en el servidor
  const saveHormigaConfig = useCallback(async (patch) => {
    const res = await updateHormigaConfig(patch);
    setHormigaConfig(res.data);
  }, []);

  const contextValue = useMemo(
    () => ({
      user,
      expenses,
      loading,
      refresh: refreshAll,
      notifications: notifications.notifications,
      unreadCount: notifications.unread_count,
      reminders,
      refreshNotifications,
      refreshReminders,
      saveProfile,
      hormigaConfig,
      saveHormigaConfig,
    }),
    [user, expenses, loading, refreshAll, notifications, reminders, refreshNotifications, refreshReminders, saveProfile, hormigaConfig, saveHormigaConfig]
  );

  if (loading) {
    return (
      <div className="cj">
        <PageLoader fullscreen />
      </div>
    );
  }

  const username = user?.username || user?.email || 'usuario';

  return (
    <AppDataContext.Provider value={contextValue}>
      <div className="cj-app">
        <a className="cj-skip" href="#main-content">Saltar al contenido</a>
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
            <button
              type="button"
              className="cj-helpbtn"
              onClick={() => setHelpOpen((o) => !o)}
              aria-label="Ayuda"
              aria-expanded={helpOpen}
              title="Ayuda"
            >
              <i className="ph ph-question" aria-hidden="true" />
            </button>
            <NotificationBell />
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
          <PageTransition>{children}</PageTransition>
        </main>

        <AyudaChat open={helpOpen} onClose={() => setHelpOpen(false)} />

        <nav className="cj-tabbar" aria-label="Principal (móvil)">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.path} to={item.path} className={({ isActive }) => (isActive ? 'active' : '')}>
              <i className={`ph ph-${item.icon}`} aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {!onDashboard && (
          <QuickAddExpense
            isOpen={showQuickAdd}
            onClose={() => setShowQuickAdd(false)}
            onCreated={handleQuickCreated}
          />
        )}
      </div>
    </AppDataContext.Provider>
  );
}

export default AppLayout;
