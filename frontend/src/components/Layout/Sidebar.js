import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import ThemeToggle from '../ui/ThemeToggle';
import Logo from '../ui/Logo';

const navItems = [
  { path: '/dashboard', icon: '📊', label: 'Dashboard', badge: null },
  { path: '/expenses', icon: '💸', label: 'Gastos', badge: null },
  { path: '/budgets', icon: '🎯', label: 'Presupuestos', badge: null },
  { path: '/analytics', icon: '📈', label: 'Analíticas', badge: null },
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
        {/* Enhanced Header with Logo */}
        <div className="sidebar-header-enhanced">
          <div className="sidebar-brand">
            <div className="sidebar-logo-wrapper">
              <Logo width={44} height={44} variant="default" />
              <div className="sidebar-logo-glow"></div>
            </div>
            {!collapsed && (
              <div className="sidebar-brand-text">
                <h2 className="sidebar-brand-title">Control Gastos</h2>
                <p className="sidebar-brand-tagline">Finanzas personales</p>
              </div>
            )}
          </div>
          <button
            className="sidebar-toggle-enhanced"
            onClick={onToggle}
            aria-label={collapsed ? 'Expandir menú lateral' : 'Colapsar menú lateral'}
            aria-expanded={!collapsed}
            title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          >
            <span className="sidebar-toggle-icon" aria-hidden="true">
              {collapsed ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              )}
            </span>
          </button>
        </div>

        {/* Enhanced Navigation */}
        <nav className="sidebar-nav-enhanced" aria-label="Menú de navegación">
          <ul className="sidebar-nav-list-enhanced">
            {navItems.map((item, index) => (
              <li key={item.path} role="none" style={{ animation: `navItemFadeIn 0.3s ease ${index * 0.05}s backwards` }}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `sidebar-nav-item-enhanced ${isActive ? 'active' : ''}`
                  }
                  end={item.path === '/dashboard'}
                  aria-label={`Ir a ${item.label}`}
                  aria-current={item.path === '/dashboard' ? undefined : ({ isActive }) => isActive ? 'page' : undefined}
                >
                  <span className="sidebar-nav-icon-enhanced" aria-hidden="true">
                    <span className="nav-icon-bg"></span>
                    {item.icon}
                  </span>
                  {!collapsed && (
                    <span className="sidebar-nav-label-enhanced">{item.label}</span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Enhanced Footer */}
        <div className="sidebar-footer-enhanced">
          {/* User Profile */}
          {user && (
            <div className="sidebar-user-enhanced" role="group" aria-label={`Información de usuario: ${user.username || 'Usuario'}`}>
              <div className="sidebar-user-avatar-enhanced">
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
                <span className="sidebar-user-initial-enhanced" style={{ display: user.avatar_url ? 'none' : 'flex' }} aria-hidden="true">
                  {(user.username || user.email || '?')[0].toUpperCase()}
                </span>
                <div className="sidebar-user-status"></div>
              </div>
              {!collapsed && (
                <div className="sidebar-user-info-enhanced">
                  <span className="sidebar-user-name-enhanced">
                    {user.username || 'Usuario'}
                  </span>
                  <span className="sidebar-user-email-enhanced">
                    {user.email || ''}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="sidebar-actions-enhanced">
            <ThemeToggle />
            <button
              className="sidebar-logout-btn-enhanced"
              onClick={handleLogout}
              title={collapsed ? "Cerrar sesión" : "Salir de la aplicación"}
              aria-label="Cerrar sesión"
            >
              <span className="logout-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
              </span>
              {!collapsed && <span className="sidebar-logout-text">Cerrar sesión</span>}
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
