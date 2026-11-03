import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login, setAuthToken, getOAuthUrl } from '../services/api';
import { GoogleIcon, MicrosoftIcon } from './ui/icons';
import AuthShell from './auth/AuthShell';
import { validateLogin } from '../utils/authForm';

/** Inicio de sesión: diseño «Caja registradora» (Login.dc.html de Claude Design). */
function Login() {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [badField, setBadField] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const problem = validateLogin(credentials);
    if (problem) {
      setError(problem.message);
      setBadField(problem.field);
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
      setError(
        err?.response
          ? 'Credenciales incorrectas. Revisa tus datos.'
          : 'No se pudo conectar con el servidor. Inténtalo de nuevo en un momento.'
      );
      setBadField(err?.response ? 'password' : '');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider) => {
    const name = { google: 'Google', microsoft: 'Microsoft' }[provider] || provider;
    try {
      const response = await getOAuthUrl(provider);
      window.location.href = response.data.auth_url;
    } catch (err) {
      const status = err?.response?.status;
      if (status === 501) setError(`El acceso con ${name} aún no está configurado.`);
      else if (!err?.response) setError('No se pudo conectar con el servidor. Inténtalo de nuevo en un momento.');
      else setError(`Error al conectar con ${name}. Inténtalo de nuevo más tarde.`);
      setBadField('');
    }
  };

  const handleInputChange = (field) => (e) => {
    setCredentials((prev) => ({ ...prev, [field]: e.target.value }));
    if (error) {
      setError('');
      setBadField('');
    }
  };

  return (
    <AuthShell>
      <form className="cj-login-form" onSubmit={handleSubmit} noValidate>
        <div className="cj-login-head">
          <div className="cj-eyebrow">INICIAR SESIÓN</div>
          <h1>Hola de nuevo</h1>
        </div>

        <label className="cj-login-field">
          <span>Usuario o correo electrónico</span>
          <input
            id="login-username"
            type="text"
            inputMode="email"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="martina@correo.com"
            value={credentials.username}
            onChange={handleInputChange('username')}
            aria-invalid={badField === 'username'}
            disabled={loading}
          />
        </label>

        <label className="cj-login-field">
          <span className="cj-login-label-row">
            Contraseña
            <Link to="/forgot-password">¿La olvidaste?</Link>
          </span>
          <span className="cj-login-pw">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={credentials.password}
              onChange={handleInputChange('password')}
              aria-invalid={badField === 'password'}
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              <i className={`ph ph-${showPassword ? 'eye-slash' : 'eye'}`} aria-hidden="true" />
            </button>
          </span>
        </label>

        {error && (
          <div className="cj-login-error" role="alert">
            <i className="ph ph-warning" aria-hidden="true" />{error}
          </div>
        )}

        <button className="cj-login-submit" type="submit" disabled={loading}>
          {loading ? 'Entrando…' : 'Entrar'}
        </button>

        <div className="cj-login-or"><span>o continúa con</span></div>
        <div className="cj-login-oauth">
          <button type="button" className="cj-btn-secondary" onClick={() => handleOAuth('google')} disabled={loading}>
            <GoogleIcon /><span>Google</span>
          </button>
          <button type="button" className="cj-btn-secondary" onClick={() => handleOAuth('microsoft')} disabled={loading}>
            <MicrosoftIcon /><span>Microsoft</span>
          </button>
        </div>

        <p className="cj-login-alt">
          ¿No tienes cuenta? <Link to="/register">Crear cuenta</Link>
        </p>
      </form>
    </AuthShell>
  );
}

export default Login;
