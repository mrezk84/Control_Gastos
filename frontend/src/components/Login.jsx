import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login, setAuthToken, getOAuthUrl } from '../services/api';
import { startOAuthChallenge } from '../utils/oauthPkce';
import { GoogleIcon, MicrosoftIcon } from './ui/icons';
import AuthShell from './auth/AuthShell';
import { validateLogin } from '../utils/authForm';

const OAUTH_NAMES = { google: 'Google', microsoft: 'Microsoft' };
const CONNECTION_ERROR = 'No se pudo conectar con el servidor. Inténtalo de nuevo en un momento.';

/** Inicio de sesión: diseño «Caja registradora» (Login.dc.html de Claude Design). */
function Login() {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [badField, setBadField] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthProvider, setOauthProvider] = useState('');
  const usernameRef = useRef(null);
  const passwordRef = useRef(null);
  const navigate = useNavigate();
  const busy = loading || Boolean(oauthProvider);

  // Al fallar, el foco va al campo con problema para corregirlo sin buscarlo.
  useEffect(() => {
    if (!error || loading) return;
    const target = badField === 'username' ? usernameRef.current : badField === 'password' ? passwordRef.current : null;
    if (target) target.focus();
  }, [error, badField, loading]);

  const fail = (message, field = '') => {
    setError(message);
    setBadField(field);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    const problem = validateLogin(credentials);
    if (problem) {
      fail(problem.message, problem.field);
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
      if (err?.response?.status === 429) fail('Demasiados intentos. Espera unos minutos antes de volver a probar.');
      else if (err?.response) fail('Usuario o contraseña incorrectos.', 'password');
      else fail(CONNECTION_ERROR);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider) => {
    if (busy) return;
    const name = OAUTH_NAMES[provider] || provider;
    setError('');
    setBadField('');
    setOauthProvider(provider);
    try {
      const response = await getOAuthUrl(provider, await startOAuthChallenge());
      window.location.href = response.data.auth_url;
    } catch (err) {
      const status = err?.response?.status;
      if (status === 501) fail(`El acceso con ${name} aún no está disponible.`);
      else if (!err?.response) fail(CONNECTION_ERROR);
      else fail(`No se pudo abrir ${name}. Inténtalo de nuevo más tarde.`);
      setOauthProvider('');
    }
  };

  const handleInputChange = (field) => (e) => {
    setCredentials((prev) => ({ ...prev, [field]: e.target.value }));
    if (error) {
      setError('');
      setBadField('');
    }
  };

  const describedBy = (field) => (error && badField === field ? 'login-error' : undefined);

  return (
    <AuthShell>
      <form className="cj-login-form" onSubmit={handleSubmit} noValidate aria-busy={busy}>
        <div className="cj-login-head">
          <h1>Hola de nuevo</h1>
        </div>

        <div className="cj-login-field">
          <label htmlFor="login-username">Usuario o correo electrónico</label>
          <input
            ref={usernameRef}
            id="login-username"
            type="text"
            inputMode="email"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="tu usuario o correo"
            value={credentials.username}
            onChange={handleInputChange('username')}
            aria-invalid={badField === 'username'}
            aria-describedby={describedBy('username')}
            readOnly={busy}
          />
        </div>

        <div className="cj-login-field">
          <label htmlFor="login-password">Contraseña</label>
          <span className="cj-login-pw">
            <input
              ref={passwordRef}
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={credentials.password}
              onChange={handleInputChange('password')}
              aria-invalid={badField === 'password'}
              aria-describedby={describedBy('password')}
              readOnly={busy}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label="Mostrar contraseña"
              aria-pressed={showPassword}
            >
              <i className={`ph ph-${showPassword ? 'eye-slash' : 'eye'}`} aria-hidden="true" />
            </button>
          </span>
          <Link className="cj-login-forgot" to="/forgot-password">¿Olvidaste tu contraseña?</Link>
        </div>

        {error && (
          <div id="login-error" className="cj-login-error" role="alert">
            <i className="ph ph-warning" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <button className="cj-login-submit" type="submit" disabled={busy}>
          {loading ? 'Entrando…' : 'Entrar'}
        </button>

        <div className="cj-login-or"><span>o continúa con</span></div>
        <div className="cj-login-oauth">
          {['google', 'microsoft'].map((provider) => (
            <button
              key={provider}
              type="button"
              className="cj-btn-secondary"
              onClick={() => handleOAuth(provider)}
              disabled={busy}
            >
              {provider === 'google' ? <GoogleIcon /> : <MicrosoftIcon />}
              <span>{oauthProvider === provider ? `Abriendo ${OAUTH_NAMES[provider]}…` : OAUTH_NAMES[provider]}</span>
            </button>
          ))}
        </div>

        <p className="cj-login-alt">
          ¿No tienes cuenta? <Link to="/register">Crear cuenta</Link>
        </p>
      </form>
    </AuthShell>
  );
}

export default Login;
