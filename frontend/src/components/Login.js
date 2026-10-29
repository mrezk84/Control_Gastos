import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login, signInWithOAuth } from '../services/api';
import { GoogleIcon, MicrosoftIcon, AppleIcon, MailIcon, LockIcon } from './ui/icons';
import Logo from './ui/Logo';

function Login() {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!credentials.email.trim() || !credentials.password) {
      setError('Email y contraseña son obligatorios');
      return;
    }

    setLoading(true);
    try {
      await login({ email: credentials.email.trim(), password: credentials.password });
      navigate('/dashboard');
    } catch (err) {
      if (err?.code === 'email_not_confirmed') {
        setError('Tenés que confirmar tu email antes de ingresar. Revisá tu bandeja de entrada.');
      } else {
        setError('Credenciales incorrectas. Por favor, verificá tus datos.');
      }
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
      // Supabase redirects the browser to the provider and back to /oauth-callback
      await signInWithOAuth(provider);
    } catch (err) {
      if (err?.code === 'validation_failed' || /not enabled/i.test(err?.message || '')) {
        setError(`${name} Sign In aún no está habilitado. Activá el proveedor en Supabase (Authentication > Providers).`);
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
              <label htmlFor="login-email">
                <span className="form-label-icon">📧</span>
                Email
              </label>
              <div className="input-with-icon">
                <input
                  id="login-email"
                  className="input-dark"
                  type="email"
                  placeholder="tu@email.com"
                  value={credentials.email}
                  onChange={handleInputChange('email')}
                  autoComplete="email"
                  disabled={loading}
                />
                <span className="input-icon"><MailIcon /></span>
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
