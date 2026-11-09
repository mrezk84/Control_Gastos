// Atadura del acceso social al navegador que lo inicia (estilo PKCE).
//
// Al empezar se genera un verificador aleatorio que SOLO vive en el sessionStorage de esta pestaña; al
// backend se le envía su SHA-256 (challenge). El código de canje que devuelve el proveedor solo se puede
// cambiar por una sesión con el verificador original: un enlace /oauth-callback?code=... enviado por otra
// persona no sirve, porque este navegador no tiene (ni tendrá) su verificador.

const KEY = 'oauth_verifier';

/** Bytes → base64url sin relleno. */
export function base64url(bytes) {
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Genera y guarda el verificador; devuelve el challenge (SHA-256 en base64url) para enviar al backend. */
export async function startOAuthChallenge() {
  const verifier = base64url(window.crypto.getRandomValues(new Uint8Array(32)));
  const digest = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  sessionStorage.setItem(KEY, verifier);
  return base64url(new Uint8Array(digest));
}

/** Devuelve el verificador guardado y lo borra (se usa una sola vez); null si no hay. */
export function takeOAuthVerifier() {
  try {
    const verifier = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    return verifier;
  } catch (e) {
    return null;
  }
}
