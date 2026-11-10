import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { linkOAuthAccount } from '../../services/api';

const NAMES = { google: 'Google', microsoft: 'Microsoft' };

/**
 * Ya existe una cuenta con contraseña con el correo de la cuenta externa. Para vincularlas se pide la contraseña:
 * quien registró ese correo sin ser su dueño no tiene la identidad externa, y el dueño del correo solo puede
 * vincular si conoce la contraseña de la cuenta. Así no se unen cuentas automáticamente.
 */
function LinkSocialAccount({ provider, code, verifier, onLinked, onExpired }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const name = NAMES[provider] || 'tu cuenta externa';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (!password) {
      setError('Escribe tu contraseña.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await linkOAuthAccount(code, verifier, password);
      onLinked(response.data.access_token);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401) setError('Contraseña incorrecta. Es la de tu cuenta de Control de Gastos.');
      else if (status === 429) setError('Demasiados intentos. Espera unos minutos antes de volver a probar.');
      else if (status === 400) onExpired();
      else setError('No se pudo conectar con el servidor. Inténtalo de nuevo en un momento.');
      setLoading(false);
    }
  };

  return (
    <form className="cj-login-form" onSubmit={handleSubmit} noValidate aria-busy={loading}>
      <div className="cj-login-head">
        <h1>Vincular {name}</h1>
        <p className="cj-login-lede">
          Ya tienes una cuenta con el correo de tu cuenta de {name}. Confirma tu contraseña para vincularlas:
          la próxima vez podrás entrar con {name} directamente.
        </p>
      </div>

      <div className="cj-login-field">
        <label htmlFor="link-password">Contraseña</label>
        <input
          id="link-password"
          type="password"
          autoComplete="current-password"
          autoFocus
          value={password}
          onChange={(e) => { setPassword(e.target.value); if (error) setError(''); }}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'link-error' : undefined}
          readOnly={loading}
        />
      </div>

      {error && (
        <div id="link-error" className="cj-login-error" role="alert">
          <i className="ph ph-warning" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <button className="cj-login-submit" type="submit" disabled={loading}>
        {loading ? 'Vinculando…' : `Vincular y entrar`}
      </button>

      <p className="cj-login-alt">
        <Link to="/forgot-password">¿Olvidaste tu contraseña?</Link>
      </p>
      <p className="cj-login-alt">
        <Link to="/login"><i className="ph ph-arrow-left" aria-hidden="true" />Volver a iniciar sesión</Link>
      </p>
    </form>
  );
}

export default LinkSocialAccount;
