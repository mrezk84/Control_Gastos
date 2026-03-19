import { useEffect, useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import Sidebar from './Sidebar';
import { getCurrentUser } from '../../services/api';

const bottomNavItems = [
  { path: '/dashboard', icon: '📊', label: 'Dashboard' },
  { path: '/expenses', icon: '💸', label: 'Gastos' },
  { path: '/budgets', icon: '🎯', label: 'Presupuestos' },
  { path: '/analytics', icon: '📈', label: 'Analíticas' },
];

function SidebarLayout({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
        const response = await getCurrentUser();
        setUser(response.data);
      } catch {
        localStorage.removeItem('token');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="callback-loading">
        <div className="spinner" />
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="sidebar-layout">
      <Sidebar
        user={user}
        onLogout={handleLogout}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <main className="sidebar-main" id="main-content" role="main" tabIndex={-1}>
        {/* Header con avatar */}
        <header className="main-header" aria-label="Encabezado de usuario">
          <div className="main-header-avatar">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={`Avatar de ${user?.username || 'usuario'}`}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <span className="main-header-initial" style={{ display: user?.avatar_url ? 'none' : 'flex' }} aria-hidden="true">
              {(user?.username || user?.email || '?')[0].toUpperCase()}
            </span>
          </div>
          <div className="main-header-user-info">
            <span className="main-header-username" aria-label="Saludo de bienvenida">
              {user?.username || 'Usuario'}
            </span>
            <span className="main-header-email" aria-label="Email del usuario">
              {user?.email || ''}
            </span>
          </div>
        </header>

        {/* Content */}
        <div className="sidebar-content" aria-live="polite" aria-atomic="false">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="bottom-nav" role="navigation" aria-label="Navegación inferior móvil">
        {bottomNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `bottom-nav-item ${isActive ? 'active' : ''}`
            }
            aria-label={`Ir a ${item.label}`}
            aria-current={({ isActive }) => isActive ? 'page' : undefined}
          >
            <span className="bottom-nav-icon" aria-hidden="true">{item.icon}</span>
            <span className="bottom-nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export default SidebarLayout;
