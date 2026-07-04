import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register, getOAuthUrl } from '../services/api';
import { GoogleIcon, MicrosoftIcon, AppleIcon, UserIcon, LockIcon, MailIcon } from './ui/icons';
import Logo from './ui/Logo';

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
          <h2 className="auth-title">Crear Cuenta</h2>
          <p className="auth-subtitle">Unite y empezá a controlar tus gastos hoy.</p>

          {/* Error Alert */}
          {error && (
            <div className="auth-alert" role="alert">
              <span className="auth-alert-icon">⚠️</span>
              {error}
            </div>
          )}

          {/* Register Form */}
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group-dark">
              <label htmlFor="reg-username">
                <span className="form-label-icon">👤</span>
                Usuario
              </label>
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
              <label htmlFor="reg-email">
                <span className="form-label-icon">📧</span>
                Email
              </label>
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
              <label htmlFor="reg-password">
                <span className="form-label-icon">🔒</span>
                Contraseña
              </label>
              <div className="input-with-icon">
                <input
                  id="reg-password"
                  className="input-dark"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
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
              className="btn-gradient btn-gradient-enhanced"
              type="submit"
              disabled={loading}
            >
              <span className="btn-content">
                {loading ? (
                  <>
                    <span className="btn-spinner"></span>
                    Creando cuenta...
                  </>
                ) : (
                  <>
                    <span className="btn-icon">✓</span>
                    Crear Cuenta
                  </>
                )}
              </span>
            </button>
          </form>

          {/* Divider */}
          <div className="auth-divider">
            <span>o registrate con</span>
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

          {/* Login Link */}
          <p className="auth-link">
            ¿Ya tenés cuenta? <Link to="/login" className="auth-link-highlight">Iniciá sesión</Link>
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

export default Register;
