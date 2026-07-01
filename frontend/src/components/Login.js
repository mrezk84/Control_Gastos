import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login, setAuthToken, getOAuthUrl } from '../services/api';
import { GoogleIcon, MicrosoftIcon, AppleIcon, UserIcon, LockIcon } from './ui/icons';

function Login() {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!credentials.username.trim() || !credentials.password) {
      setError('Usuario y contraseña son obligatorios');
      return;
    }

    setLoading(true);
    try {
      const response = await login(credentials);
      const token = response.data.access_token;
      setAuthToken(token);
      localStorage.setItem('token', token);
      navigate('/dashboard');
    } catch (err) {
      setError('Credenciales incorrectas. Por favor, verificá tus datos.');
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
    setCredentials(prev => ({ ...prev, [field]: e.target.value }));
    if (error) setError('');
  };

  return (
    <div className="auth-page">
      <div className="animated-bg" />

      <div className="auth-container">
        <div className="auth-card">
          {/* Logo */}
          <div className="auth-logo">
            <div className="auth-logo-icon">💰</div>
          </div>

          {/* Header */}
          <h1 className="auth-title">Control de Gastos</h1>
          <p className="auth-subtitle">Iniciá sesión para gestionar tus finanzas</p>

          {/* Error Alert */}
          {error && (
            <div className="auth-alert" role="alert">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group-dark">
              <label htmlFor="login-username">Usuario</label>
              <div className="input-with-icon">
                <input
                  id="login-username"
                  className="input-dark"
                  type="text"
                  placeholder="Ingresá tu usuario"
                  value={credentials.username}
                  onChange={handleInputChange('username')}
                  autoComplete="username"
                  disabled={loading}
                />
                <span className="input-icon"><UserIcon /></span>
              </div>
            </div>

            <div className="form-group-dark">
              <label htmlFor="login-password">Contraseña</label>
              <div className="input-with-icon">
                <input
                  id="login-password"
                  className="input-dark"
                  type="password"
                  placeholder="Ingresá tu contraseña"
                  value={credentials.password}
                  onChange={handleInputChange('password')}
                  autoComplete="current-password"
                  disabled={loading}
                />
                <span className="input-icon"><LockIcon /></span>
              </div>
            </div>

            <button
              className="btn-gradient"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Ingresando...' : 'Iniciar Sesión'}
            </button>
          </form>

          {/* Forgot Password Link */}
          <p className="auth-link" style={{ marginTop: 20, marginBottom: 0 }}>
            <Link to="/forgot-password">¿Olvidaste tu contraseña?</Link>
          </p>

          {/* Divider */}
          <div className="auth-divider">
            <span>o continuá con</span>
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

          {/* Register Link */}
          <p className="auth-link">
            ¿No tenés cuenta? <Link to="/register">Registrate</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
