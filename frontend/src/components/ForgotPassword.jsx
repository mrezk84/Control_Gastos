import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { requestPasswordReset } from '../services/api';
import AuthShell from './auth/AuthShell';

/** Recuperar contraseña: mismo marco «Caja registradora» que el inicio de sesión. */
function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setSuccess('');
    if (!email.trim()) {
      setError('Escribe tu correo para recuperar tu contraseña.');
      return;
    }
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setSuccess('Si el correo está registrado, te enviamos un enlace para restablecer tu contraseña. Revisa tu bandeja de entrada.');
    } catch (err) {
      setError(
        err?.response
          ? 'No se pudo procesar la solicitud. Inténtalo de nuevo.'
          : 'No se pudo conectar con el servidor. Inténtalo de nuevo en un momento.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <form className="cj-login-form" onSubmit={handleSubmit} noValidate aria-busy={loading}>
        <div className="cj-login-head">
          <h1>Recupera tu contraseña</h1>
          <p className="cj-login-lede">Escribe tu correo y te enviamos un enlace para crear una nueva.</p>
        </div>

        <div className="cj-login-field">
          <label htmlFor="reset-email">Correo electrónico</label>
          <input
            id="reset-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="tu correo"
            value={email}
            onChange={(e) => { setEmail(e.target.value); if (error) setError(''); }}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'forgot-error' : undefined}
            readOnly={loading}
          />
        </div>

        {error && (
          <div id="forgot-error" className="cj-login-error" role="alert">
            <i className="ph ph-warning" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="cj-login-note" role="status">
            <i className="ph ph-check-circle" aria-hidden="true" />
            <span>{success}</span>
          </div>
        )}

        <button className="cj-login-submit" type="submit" disabled={loading}>
          {loading ? 'Enviando…' : 'Enviar enlace'}
        </button>

        <p className="cj-login-alt">
          <Link to="/login"><i className="ph ph-arrow-left" aria-hidden="true" />Volver a iniciar sesión</Link>
        </p>
      </form>
    </AuthShell>
  );
}

export default ForgotPassword;
