import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register, getOAuthUrl } from '../services/api';
import { GoogleIcon, MicrosoftIcon, AppleIcon, UserIcon, LockIcon, MailIcon } from './ui/icons';

function Register() {
  const [user, setUser] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!user.username.trim() || !user.email.trim() || !user.password) {
      setError('Todos los campos son obligatorios');
      return;
    }

    if (user.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      await register(user);
      navigate('/login');
    } catch (err) {
      const errorMsg = err?.response?.data?.detail || 'Error al registrarse. El usuario o email podría estar en uso.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider) => {
    const providerNames = {
      google: 'Google',
      microsoft: 'Microsoft',
      apple: 'Apple'
    };

    const name = providerNames[provider] || provider;

    try {
      const response = await getOAuthUrl(provider);
      window.location.href = response.data.auth_url;
    } catch (err) {
      const status = err?.response?.status;

      if (status === 501) {
        setError(`${name} Sign In aún no está configurado. Configurá las credenciales OAuth en el backend.`);
      } else if (!err?.response) {
        setError('No se pudo conectar al servidor. Verificá que el backend esté corriendo en el puerto 8000.');
      } else {
        setError(`Error al conectar con ${name}. Intentá de nuevo más tarde.`);
      }
    }
  };

  const handleInputChange = (field) => (e) => {
    setUser(prev => ({ ...prev, [field]: e.target.value }));
    if (error) setError('');
  };

  return (
    <div className="auth-page">
      <div className="animated-bg" />

      <div className="auth-container">
        <div className="auth-card">
          {/* Logo */}
          <div className="auth-logo">
            <div className="auth-logo-icon">🚀</div>
          </div>

          {/* Header */}
          <h1 className="auth-title">Crear Cuenta</h1>
          <p className="auth-subtitle">Unite y tomá el control de tus finanzas</p>

          {/* Error Alert */}
          {error && (
            <div className="auth-alert" role="alert">
              {error}
            </div>
          )}

          {/* Register Form */}
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group-dark">
              <label htmlFor="reg-username">Usuario</label>
              <div className="input-with-icon">
                <input
                  id="reg-username"
                  className="input-dark"
                  type="text"
                  placeholder="Elegí un nombre de usuario"
                  value={user.username}
                  onChange={handleInputChange('username')}
                  autoComplete="username"
                  disabled={loading}
                />
                <span className="input-icon"><UserIcon /></span>
              </div>
            </div>

            <div className="form-group-dark">
              <label htmlFor="reg-email">Email</label>
              <div className="input-with-icon">
                <input
                  id="reg-email"
                  className="input-dark"
                  type="email"
                  placeholder="tu@email.com"
                  value={user.email}
                  onChange={handleInputChange('email')}
                  autoComplete="email"
                  disabled={loading}
                />
                <span className="input-icon"><MailIcon /></span>
              </div>
            </div>

            <div className="form-group-dark">
              <label htmlFor="reg-password">Contraseña</label>
              <div className="input-with-icon">
                <input
                  id="reg-password"
                  className="input-dark"
                  type="password"
                  placeholder="Creá una contraseña segura (mín. 6 caracteres)"
                  value={user.password}
                  onChange={handleInputChange('password')}
                  autoComplete="new-password"
                  disabled={loading}
                  minLength={6}
                />
                <span className="input-icon"><LockIcon /></span>
              </div>
            </div>

            <button
              className="btn-gradient"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
            </button>
          </form>

          {/* Divider */}
          <div className="auth-divider">
            <span>o registrate con</span>
          </div>

          {/* OAuth Buttons */}
          <div className="oauth-buttons">
            <button
              className="oauth-btn google"
              type="button"
              onClick={() => handleOAuth('google')}
              disabled={loading}
            >
              <GoogleIcon />
              Continuar con Google
            </button>

            <button
              className="oauth-btn microsoft"
              type="button"
              onClick={() => handleOAuth('microsoft')}
              disabled={loading}
            >
              <MicrosoftIcon />
              Continuar con Microsoft
            </button>

            <button
              className="oauth-btn apple"
              type="button"
              onClick={() => handleOAuth('apple')}
              disabled={loading}
            >
              <AppleIcon />
              Continuar con Apple
            </button>
          </div>

          {/* Login Link */}
          <p className="auth-link">
            ¿Ya tenés cuenta? <Link to="/login">Iniciá sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
