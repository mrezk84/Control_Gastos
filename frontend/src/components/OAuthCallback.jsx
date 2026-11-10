import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { setAuthToken, exchangeOAuthCode } from '../services/api';
import { takeOAuthVerifier, peekOAuthVerifier, clearOAuthVerifier } from '../utils/oauthPkce';
import AuthShell from './auth/AuthShell';
import LinkSocialAccount from './auth/LinkSocialAccount';

const GENERIC = 'No recibimos una respuesta válida del proveedor. Inténtalo de nuevo.';

// Códigos que devuelve el backend en /oauth-callback?error=...
const ERRORS = {
  sesion_expirada: 'El intento de acceso expiró o ya se usó. Inténtalo de nuevo.',
  cancelado: 'Cancelaste el acceso con tu cuenta externa.',
  proveedor: 'No pudimos completar el acceso con tu cuenta externa. Inténtalo de nuevo más tarde.',
  sin_correo: 'Tu cuenta externa no compartió un correo electrónico, así que no podemos crear la cuenta.',
  correo_no_verificado: 'El correo de tu cuenta de Google no está verificado.',
  otro_proveedor:
    'Ya existe una cuenta con ese correo que usa otro método de acceso. Entra con el método que usaste al registrarte.',
};

const PROVIDERS = ['google', 'microsoft'];

/**
 * Retorno del acceso con Google o Microsoft. Recibe un código de un solo uso (nunca el token en la URL) y lo
 * canjea por la sesión con el verificador que este navegador guardó al empezar; si falta o no coincide, no hay sesión.
 * Si el correo ya tenía una cuenta con contraseña, en lugar de `code` llega `link`: se pide la contraseña para vincular.
 */
function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');
  const [link, setLink] = useState(null); // { code, provider, verifier } cuando hay que confirmar la contraseña
  const navigate = useNavigate();
  const started = useRef(false); // el código solo se puede canjear una vez (React StrictMode monta dos veces)

  useEffect(() => {
    if (started.current) return undefined;
    started.current = true;

    const code = searchParams.get('code');
    const errorCode = searchParams.get('error');
    const linkCode = searchParams.get('link');
    const provider = searchParams.get('provider');
    // Al vincular se lee sin borrar: la contraseña puede necesitar varios intentos con el mismo verificador
    const verifier = linkCode ? peekOAuthVerifier() : takeOAuthVerifier();
    // Quita el código de la barra de direcciones y del historial cuanto antes
    window.history.replaceState(null, '', window.location.pathname);

    let timer;
    const fail = (message) => {
      setError(message);
      timer = setTimeout(() => navigate('/login', { replace: true }), errorCode === 'otro_proveedor' ? 8000 : 4000);
    };

    if (errorCode) {
      fail(ERRORS[errorCode] || GENERIC);
    } else if (linkCode && verifier && PROVIDERS.includes(provider)) {
      setLink({ code: linkCode, provider, verifier });
    } else if (!code || !verifier) {
      fail(GENERIC);
    } else {
      exchangeOAuthCode(code, verifier)
        .then((response) => {
          const token = response.data.access_token;
          setAuthToken(token);
          localStorage.setItem('token', token);
          navigate('/dashboard', { replace: true });
        })
        .catch(() => fail(ERRORS.sesion_expirada));
    }
    return () => clearTimeout(timer);
  }, [searchParams, navigate]);

  const finishLink = (token) => {
    setAuthToken(token);
    localStorage.setItem('token', token);
    clearOAuthVerifier();
    navigate('/dashboard', { replace: true });
  };

  const expireLink = () => {
    clearOAuthVerifier();
    setLink(null);
    setError(ERRORS.sesion_expirada);
    setTimeout(() => navigate('/login', { replace: true }), 4000);
  };

  if (link && !error) {
    return (
      <AuthShell>
        <LinkSocialAccount
          provider={link.provider}
          code={link.code}
          verifier={link.verifier}
          onLinked={finishLink}
          onExpired={expireLink}
        />
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="cj-login-form">
        {error ? (
          <>
            <div className="cj-login-head">
              <h1>No pudimos iniciar tu sesión</h1>
            </div>
            <div className="cj-login-error" role="alert">
              <i className="ph ph-warning" aria-hidden="true" />
              <span>{error}</span>
            </div>
            <p className="cj-login-alt">
              <Link to="/login"><i className="ph ph-arrow-left" aria-hidden="true" />Volver a iniciar sesión</Link>
            </p>
          </>
        ) : (
          <div className="cj-login-head" role="status">
            <h1>Entrando…</h1>
            <p className="cj-login-lede">Estamos verificando tu cuenta.</p>
          </div>
        )}
      </div>
    </AuthShell>
  );
}

export default OAuthCallback;
