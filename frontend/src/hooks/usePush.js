import { useCallback, useEffect, useState } from 'react';
import { getVapidKey, pushSubscribe, pushUnsubscribe } from '../services/api';
import { pushSupported, urlBase64ToUint8Array } from '../utils/push';

/** Notificaciones del navegador (Web Push): permiso, suscripción y baja. */
export function usePush() {
  const supported = pushSupported();
  const [permission, setPermission] = useState(supported ? Notification.permission : 'unsupported');
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supported) return undefined;
    let cancelled = false;
    navigator.serviceWorker
      .getRegistration('/sw.js')
      .then((reg) => reg?.pushManager.getSubscription())
      .then((sub) => { if (!cancelled) setSubscribed(Boolean(sub) && Notification.permission === 'granted'); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [supported]);

  /** Devuelve { ok, message }. Pide el permiso: llamar siempre desde un gesto de la persona (un clic). */
  const enable = useCallback(async () => {
    if (!supported) return { ok: false, message: 'Este navegador no admite notificaciones push.' };
    setBusy(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== 'granted') {
        return { ok: false, message: 'Permiso denegado. Actívalo desde los ajustes del sitio en tu navegador.' };
      }
      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      let key;
      try {
        key = (await getVapidKey()).data.public_key;
      } catch (err) {
        if (err?.response?.status === 503) {
          return { ok: false, message: 'Las notificaciones del navegador aún no están configuradas en el servidor.' };
        }
        throw err;
      }
      const sub = (await reg.pushManager.getSubscription())
        || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(key) }));
      await pushSubscribe(sub.toJSON());
      setSubscribed(true);
      return { ok: true, message: 'Notificaciones activadas' };
    } catch {
      return { ok: false, message: 'No se pudieron activar las notificaciones.' };
    } finally {
      setBusy(false);
    }
  }, [supported]);

  const disable = useCallback(async () => {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js');
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await pushUnsubscribe(sub.endpoint).catch(() => {});
        await sub.unsubscribe();
      }
      setSubscribed(false);
      return { ok: true, message: 'Notificaciones desactivadas' };
    } catch {
      return { ok: false, message: 'No se pudieron desactivar las notificaciones.' };
    } finally {
      setBusy(false);
    }
  }, []);

  return { supported, permission, subscribed, busy, enable, disable };
}
