import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login, setAuthToken, getOAuthUrl } from '../services/api';
import { GoogleIcon, MicrosoftIcon, AppleIcon, UserIcon, LockIcon } from './ui/icons';
import Logo from './ui/Logo';

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

      {/* Background Elements */}
      <div className="auth-bg-elements">
        <div className="auth-bg-circle auth-bg-circle-1"></div>
        <div className="auth-bg-circle auth-bg-circle-2"></div>
        <div className="auth-bg-circle auth-bg-circle-3"></div>
      </div>

      <div className="auth-container">
        <div className="auth-card">
          {/* Enhanced Logo Section */}
          <div className="auth-logo">
            <div className="auth-logo-wrapper">
              <Logo width={72} height={72} variant="default" />
              <div className="auth-logo-glow"></div>
            </div>
            <div className="auth-logo-text">
              <h1 className="auth-logo-title">Control Gastos</h1>
              <p className="auth-logo-tagline">Tu finanzas bajo control</p>
            </div>
          </div>

          {/* Header */}
          <h2 className="auth-title">Iniciar Sesión</h2>
          <p className="auth-subtitle">Bienvenido de nuevo. Iniciá sesión para continuar.</p>

          {/* Error Alert */}
          {error && (
            <div className="auth-alert" role="alert">
              <span className="auth-alert-icon">⚠️</span>
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group-dark">
              <label htmlFor="login-username">
                <span className="form-label-icon">👤</span>
                Usuario
              </label>
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
              <label htmlFor="login-password">
                <span className="form-label-icon">🔒</span>
                Contraseña
              </label>
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
              className="btn-gradient btn-gradient-enhanced"
              type="submit"
              disabled={loading}
            >
              <span className="btn-content">
                {loading ? (
                  <>
                    <span className="btn-spinner"></span>
                    Ingresando...
                  </>
                ) : (
                  <>
                    <span className="btn-icon">→</span>
                    Iniciar Sesión
                  </>
                )}
              </span>
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

          {/* Enhanced OAuth Buttons */}
          <div className="oauth-buttons">
            <button
              className="oauth-btn google enhanced"
              type="button"
              onClick={() => handleOAuth('google')}
              disabled={loading}
            >
              <GoogleIcon />
              <span>Google</span>
            </button>

            <button
              className="oauth-btn microsoft enhanced"
              type="button"
              onClick={() => handleOAuth('microsoft')}
              disabled={loading}
            >
              <MicrosoftIcon />
              <span>Microsoft</span>
            </button>

            <button
              className="oauth-btn apple enhanced"
              type="button"
              onClick={() => handleOAuth('apple')}
              disabled={loading}
            >
              <AppleIcon />
              <span>Apple</span>
            </button>
          </div>

          {/* Register Link */}
          <p className="auth-link">
            ¿No tenés cuenta? <Link to="/register" className="auth-link-highlight">Registrate</Link>
          </p>
        </div>

        {/* Footer */}
        <div className="auth-footer">
          <p className="auth-footer-text">
            💰 Control Gastos · Gestión financiera inteligente
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
