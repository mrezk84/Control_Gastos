// Web Push: soporte del navegador y conversión de la clave VAPID.

export const pushSupported = () =>
  typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

/** Clave pública VAPID (base64 url-safe) → bytes para pushManager.subscribe. */
export function urlBase64ToUint8Array(base64) {
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

/** Brave desactiva por defecto el servicio de push de Google, y sin él no se puede suscribir a notificaciones. */
export const isBrave = () => typeof navigator !== 'undefined' && Boolean(navigator.brave);

/**
 * Mensaje claro de por qué falló la activación, según el paso donde ocurrió:
 * 'register' (service worker), 'subscribe' (servicio de push del navegador) o 'server' (guardar en la API).
 */
export function explainPushError(step, err, brave = false) {
  if (step === 'register') {
    return 'No se pudo registrar el servicio de notificaciones. Recarga la página e inténtalo de nuevo.';
  }
  if (step === 'subscribe') {
    if (err?.name === 'AbortError') {
      return brave
        ? 'Brave bloquea el servicio de notificaciones de Google. Actívalo en brave://settings/privacy → "Usar servicios de Google para mensajería push", reinicia Brave e inténtalo de nuevo.'
        : 'Tu navegador no pudo conectarse con su servicio de notificaciones. Revisa tu conexión y que ninguna extensión o VPN bloquee a Google (fcm.googleapis.com), y vuelve a intentarlo.';
    }
    if (err?.name === 'NotAllowedError') {
      return 'El navegador no permitió la suscripción. Revisa que las notificaciones de este sitio estén en "Permitir".';
    }
    return `El navegador no pudo crear la suscripción (${err?.name || 'error desconocido'}).`;
  }
  const status = err?.response?.status;
  if (status === 401) return 'Tu sesión venció. Vuelve a iniciar sesión e inténtalo de nuevo.';
  if (status === 422) return 'El servidor rechazó la suscripción de este navegador.';
  if (!err?.response) return 'No se pudo conectar con el servidor. Inténtalo de nuevo en un momento.';
  return `El servidor no pudo guardar la suscripción (error ${status}).`;
}
