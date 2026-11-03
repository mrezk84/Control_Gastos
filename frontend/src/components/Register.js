import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register, getOAuthUrl } from '../services/api';
import { GoogleIcon, MicrosoftIcon } from './ui/icons';
import AuthShell from './auth/AuthShell';
import { passwordStrength, validateRegister } from '../utils/authForm';

const STRENGTH_COLORS = ['var(--line)', 'var(--bad)', 'var(--warn)', 'oklch(0.7 0.14 125)', 'var(--ok)'];

/** Registro: misma pantalla que el inicio de sesión (Login.dc.html, modo «Crear cuenta»). */
function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [badField, setBadField] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const strength = passwordStrength(form.password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const problem = validateRegister(form);
    if (problem) {
      setError(problem.message);
      setBadField(problem.field);
      return;
    }

    setLoading(true);
    try {
      // El nombre es el usuario con el que también se puede iniciar sesión
      await register({ username: form.name.trim(), email: form.email.trim(), password: form.password });
      navigate('/login');
    } catch (err) {
      setError(err?.response?.data?.detail || 'No se pudo crear la cuenta. Inténtalo de nuevo en un momento.');
      setBadField(/usuario/i.test(err?.response?.data?.detail || '') ? 'name' : /correo/i.test(err?.response?.data?.detail || '') ? 'email' : '');
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

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (error) {
      setError('');
      setBadField('');
    }
  };

  return (
    <AuthShell>
      <form className="cj-login-form" onSubmit={handleSubmit} noValidate>
        <div className="cj-login-head">
          <div className="cj-eyebrow">CREAR CUENTA</div>
          <h1>Empieza hoy</h1>
        </div>

        <label className="cj-login-field">
          <span>Nombre</span>
          <input
            id="register-name"
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="Martina"
            value={form.name}
            onChange={handleChange('name')}
            aria-invalid={badField === 'name'}
            disabled={loading}
          />
        </label>

        <label className="cj-login-field">
          <span>Correo electrónico</span>
          <input
            id="register-email"
            type="email"
            autoComplete="email"
            placeholder="martina@correo.com"
            value={form.email}
            onChange={handleChange('email')}
            aria-invalid={badField === 'email'}
            disabled={loading}
          />
        </label>

        <label className="cj-login-field">
          <span>Contraseña</span>
          <span className="cj-login-pw">
            <input
              id="register-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={form.password}
              onChange={handleChange('password')}
              aria-invalid={badField === 'password'}
              aria-describedby="register-strength"
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

        <div className="cj-strength" id="register-strength">
          <div className="cj-strength-bars" aria-hidden="true">
            {[1, 2, 3, 4].map((i) => (
              <span key={i} style={{ background: i <= strength.score ? STRENGTH_COLORS[Math.max(1, strength.score)] : 'var(--line)' }} />
            ))}
          </div>
          <span className="cj-strength-label">SEGURIDAD: {strength.label}</span>
        </div>

        <label className="cj-login-field">
          <span>Confirmar contraseña</span>
          <input
            id="register-confirm"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={form.confirm}
            onChange={handleChange('confirm')}
            aria-invalid={badField === 'confirm'}
            disabled={loading}
          />
        </label>

        {error && (
          <div className="cj-login-error" role="alert">
            <i className="ph ph-warning" aria-hidden="true" />{error}
          </div>
        )}

        <button className="cj-login-submit" type="submit" disabled={loading}>
          {loading ? 'Creando…' : 'Crear cuenta'}
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
          ¿Ya tienes cuenta? <Link to="/login">Iniciar sesión</Link>
        </p>
      </form>
    </AuthShell>
  );
}

export default Register;
