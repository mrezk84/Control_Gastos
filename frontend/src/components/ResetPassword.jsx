import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { resetPassword } from '../services/api';
import AuthShell from './auth/AuthShell';

const MIN_LENGTH = 8;

/** Nueva contraseña: mismo marco «Caja registradora» que el inicio de sesión. */
function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [badField, setBadField] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  // Tras el éxito, vuelve al inicio de sesión; se cancela si la persona sale antes.
  useEffect(() => {
    if (!success) return undefined;
    const id = setTimeout(() => navigate('/login'), 3000);
    return () => clearTimeout(id);
  }, [success, navigate]);

  const fail = (message, field = '') => {
    setError(message);
    setBadField(field);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setBadField('');

    if (!password || password.length < MIN_LENGTH) {
      fail(`La contraseña debe tener al menos ${MIN_LENGTH} caracteres.`, 'password');
      return;
    }
    if (password !== confirmPassword) {
      fail('Las contraseñas no coinciden.', 'confirm');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, password);
      setSuccess(true);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 400 || status === 401) fail('El enlace de recuperación expiró o no es válido. Solicita uno nuevo.');
      else if (!err?.response) fail('No se pudo conectar con el servidor. Inténtalo de nuevo en un momento.');
      else fail('No se pudo restablecer la contraseña. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthShell>
        <div className="cj-login-form">
          <div className="cj-login-head">
            <h1>Enlace no válido</h1>
            <p className="cj-login-lede">Este enlace de recuperación no es válido. Solicita uno nuevo.</p>
          </div>
          <Link className="cj-login-submit cj-login-submit-link" to="/forgot-password">Solicitar un enlace nuevo</Link>
          <p className="cj-login-alt">
            <Link to="/login"><i className="ph ph-arrow-left" aria-hidden="true" />Volver a iniciar sesión</Link>
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <form className="cj-login-form" onSubmit={handleSubmit} noValidate aria-busy={loading}>
        <div className="cj-login-head">
          <h1>Nueva contraseña</h1>
          <p className="cj-login-lede">Elige una contraseña de al menos {MIN_LENGTH} caracteres.</p>
        </div>

        {success ? (
          <div className="cj-login-note" role="status">
            <i className="ph ph-check-circle" aria-hidden="true" />
            <span>Contraseña actualizada. Te llevamos a iniciar sesión…</span>
          </div>
        ) : (
          <>
            <div className="cj-login-field">
              <label htmlFor="new-password">Nueva contraseña</label>
              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (error) fail(''); }}
                aria-invalid={badField === 'password'}
                aria-describedby={badField === 'password' ? 'reset-error' : undefined}
                readOnly={loading}
              />
            </div>
            <div className="cj-login-field">
              <label htmlFor="confirm-password">Confirmar contraseña</label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); if (error) fail(''); }}
                aria-invalid={badField === 'confirm'}
                aria-describedby={badField === 'confirm' ? 'reset-error' : undefined}
                readOnly={loading}
              />
            </div>
          </>
        )}

        {error && (
          <div id="reset-error" className="cj-login-error" role="alert">
            <i className="ph ph-warning" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        {!success && (
          <button className="cj-login-submit" type="submit" disabled={loading}>
            {loading ? 'Actualizando…' : 'Restablecer contraseña'}
          </button>
        )}

        <p className="cj-login-alt">
          <Link to="/login"><i className="ph ph-arrow-left" aria-hidden="true" />Volver a iniciar sesión</Link>
        </p>
      </form>
    </AuthShell>
  );
}

export default ResetPassword;
