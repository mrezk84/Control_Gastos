import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import ThemeToggle from '../ui/ThemeToggle';

const navItems = [
  { path: '/dashboard', icon: '📊', label: 'Dashboard' },
  { path: '/expenses', icon: '💸', label: 'Gastos' },
  { path: '/budgets', icon: '🎯', label: 'Presupuestos' },
  { path: '/analytics', icon: '📈', label: 'Analíticas' },
];

function Sidebar({ user, onLogout, collapsed = false, onToggle }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <>
      <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`} role="navigation" aria-label="Navegación principal">
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-logo" role="img" aria-label="Logo de Control Gastos" aria-hidden="true">💰</div>
          <span className="sidebar-title">Control Gastos</span>
          <button
            className="sidebar-toggle"
            onClick={onToggle}
            aria-label={collapsed ? 'Expandir menú lateral' : 'Colapsar menú lateral'}
            aria-expanded={!collapsed}
            title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          >
            <span className="sidebar-toggle-icon" aria-hidden="true">
              {collapsed ? (
                // Chevron derecho (abrir)
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              ) : (
                // Chevron izquierdo (cerrar)
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              )}
            </span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav" aria-label="Menú de navegación">
          <ul className="sidebar-nav-list" role="list">
            {navItems.map((item) => (
              <li key={item.path} role="none">
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `sidebar-nav-item ${isActive ? 'active' : ''}`
                  }
                  end={item.path === '/dashboard'}
                  aria-label={`Ir a ${item.label}`}
                  aria-current={item.path === '/dashboard' ? undefined : ({ isActive }) => isActive ? 'page' : undefined}
                >
                  <span className="sidebar-nav-icon" aria-hidden="true">{item.icon}</span>
                  <span className="sidebar-nav-label">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          {/* Avatar del usuario */}
          {user && (
            <div className="sidebar-user" role="group" aria-label={`Información de usuario: ${user.username || 'Usuario'}`}>
              <div className="sidebar-user-avatar">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={`Avatar de ${user.username || 'usuario'}`}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <span className="sidebar-user-initial" style={{ display: user.avatar_url ? 'none' : 'flex' }} aria-hidden="true">
                  {(user.username || user.email || '?')[0].toUpperCase()}
                </span>
              </div>
              {!collapsed && (
                <div className="sidebar-user-info">
                  <span className="sidebar-user-name">
                    {user.username || 'Usuario'}
                  </span>
                  <span className="sidebar-user-email">
                    {user.email || ''}
                  </span>
                </div>
              )}
            </div>
          )}
          <div className="sidebar-actions">
            <ThemeToggle />
            <button
              className="sidebar-logout-btn"
              onClick={handleLogout}
              title={collapsed ? "Cerrar sesión" : "Salir de la aplicación"}
              aria-label="Cerrar sesión"
            >
              <span aria-hidden="true">🚪</span>
              {!collapsed && <span className="sidebar-logout-text">Salir</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile backdrop */}
      <div
        id="sidebar-backdrop"
        className="sidebar-backdrop"
        onClick={() => document.body.classList.remove('sidebar-open')}
        aria-hidden="true"
        tabIndex={-1}
      />
    </>
  );
}

export default Sidebar;
