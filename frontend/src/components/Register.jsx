import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register, getOAuthUrl } from '../services/api';
import { startOAuthChallenge } from '../utils/oauthPkce';
import { GoogleIcon, MicrosoftIcon } from './ui/icons';
import AuthShell from './auth/AuthShell';
import { passwordStrength, validateRegister } from '../utils/authForm';

const STRENGTH_COLORS = ['var(--line)', 'var(--bad)', 'var(--warn)', 'oklch(0.7 0.14 125)', 'var(--ok)'];
const OAUTH_NAMES = { google: 'Google', microsoft: 'Microsoft' };
const CONNECTION_ERROR = 'No se pudo conectar con el servidor. Inténtalo de nuevo en un momento.';

/** Registro: misma pantalla que el inicio de sesión (Login.dc.html, modo «Crear cuenta»). */
function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [badField, setBadField] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthProvider, setOauthProvider] = useState('');
  const refs = { name: useRef(null), email: useRef(null), password: useRef(null), confirm: useRef(null) };
  const navigate = useNavigate();
  const strength = passwordStrength(form.password);
  const busy = loading || Boolean(oauthProvider);

  // Al fallar, el foco va al campo con problema para corregirlo sin buscarlo.
  useEffect(() => {
    if (!error || loading) return;
    const target = refs[badField]?.current;
    if (target) target.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error, badField, loading]);

  const fail = (message, field = '') => {
    setError(message);
    setBadField(field);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    const problem = validateRegister(form);
    if (problem) {
      fail(problem.message, problem.field);
      return;
    }

    setLoading(true);
    try {
      // El nombre es el usuario con el que también se puede iniciar sesión
      await register({ username: form.name.trim(), email: form.email.trim(), password: form.password });
      navigate('/login');
    } catch (err) {
      const detail = err?.response?.data?.detail;
      const message = typeof detail === 'string' ? detail : '';
      if (!err?.response) fail(CONNECTION_ERROR);
      else fail(message || 'No se pudo crear la cuenta. Inténtalo de nuevo.', /usuario/i.test(message) ? 'name' : /correo/i.test(message) ? 'email' : '');
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

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (error) {
      setError('');
      setBadField('');
    }
  };

  const errorId = (field) => (error && badField === field ? 'register-error' : undefined);
  const passwordDescribedBy = ['register-strength', errorId('password')].filter(Boolean).join(' ');

  return (
    <AuthShell>
      <form className="cj-login-form" onSubmit={handleSubmit} noValidate aria-busy={busy}>
        <div className="cj-login-head">
          <h1>Empieza hoy</h1>
        </div>

        <div className="cj-login-field">
          <label htmlFor="register-name">Nombre</label>
          <input
            ref={refs.name}
            id="register-name"
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="tu nombre"
            value={form.name}
            onChange={handleChange('name')}
            aria-invalid={badField === 'name'}
            aria-describedby={errorId('name')}
            readOnly={busy}
          />
        </div>

        <div className="cj-login-field">
          <label htmlFor="register-email">Correo electrónico</label>
          <input
            ref={refs.email}
            id="register-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="tu correo"
            value={form.email}
            onChange={handleChange('email')}
            aria-invalid={badField === 'email'}
            aria-describedby={errorId('email')}
            readOnly={busy}
          />
        </div>

        <div className="cj-login-field">
          <label htmlFor="register-password">Contraseña</label>
          <span className="cj-login-pw">
            <input
              ref={refs.password}
              id="register-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={form.password}
              onChange={handleChange('password')}
              aria-invalid={badField === 'password'}
              aria-describedby={passwordDescribedBy}
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
        </div>

        <div className="cj-strength" id="register-strength">
          <div className="cj-strength-bars" aria-hidden="true">
            {[1, 2, 3, 4].map((i) => (
              <span key={i} style={{ background: i <= strength.score ? STRENGTH_COLORS[Math.max(1, strength.score)] : 'var(--line)' }} />
            ))}
          </div>
          <span className="cj-strength-label">SEGURIDAD: {strength.label}</span>
        </div>

        <div className="cj-login-field">
          <label htmlFor="register-confirm">Confirmar contraseña</label>
          <input
            ref={refs.confirm}
            id="register-confirm"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={form.confirm}
            onChange={handleChange('confirm')}
            aria-invalid={badField === 'confirm'}
            aria-describedby={errorId('confirm')}
            readOnly={busy}
          />
        </div>

        {error && (
          <div id="register-error" className="cj-login-error" role="alert">
            <i className="ph ph-warning" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <button className="cj-login-submit" type="submit" disabled={busy}>
          {loading ? 'Creando…' : 'Crear cuenta'}
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
          ¿Ya tienes cuenta? <Link to="/login">Iniciar sesión</Link>
        </p>
      </form>
    </AuthShell>
  );
}

export default Register;
