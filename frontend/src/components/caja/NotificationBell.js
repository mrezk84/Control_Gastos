import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../ui/ToastContainer';
import { useAppData } from '../../context/ExpensesContext';
import { usePush } from '../../hooks/usePush';
import { markAllNotificationsRead, markNotificationRead } from '../../services/api';
import { KIND_ICON, linkFor, timeAgo } from '../../utils/notifications';

/** Campana de la barra superior: avisos de la app, marcar como leídos y activar las notificaciones del navegador. */
function NotificationBell() {
  const { notifications, unreadCount, refreshNotifications } = useAppData();
  const { supported, permission, subscribed, busy, enable, disable } = usePush();
  const { success, error, info } = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const openItem = async (n) => {
    setOpen(false);
    if (!n.read_at) {
      try { await markNotificationRead(n.id); refreshNotifications(); } catch { /* no es crítico */ }
    }
    navigate(linkFor(n.link));
  };

  const readAll = async () => {
    try { await markAllNotificationsRead(); refreshNotifications(); } catch { error('No se pudo marcar como leídas'); }
  };

  const togglePush = async () => {
    const res = subscribed ? await disable() : await enable();
    if (res.ok) success(res.message);
    else if (permission === 'denied' || /Permiso/.test(res.message)) info(res.message);
    else error(res.message);
  };

  return (
    <div className="cj-bell" ref={ref}>
      <button
        type="button"
        className="cj-bell-btn"
        aria-label={unreadCount ? `Notificaciones: ${unreadCount} sin leer` : 'Notificaciones'}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <i className="ph ph-bell" aria-hidden="true" />
        {unreadCount > 0 && <span className="cj-bell-badge" aria-hidden="true">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {open && (
        <div className="cj-bell-panel" role="dialog" aria-label="Notificaciones">
          <div className="cj-bell-head">
            <span>NOTIFICACIONES</span>
            {unreadCount > 0 && <button type="button" className="cj-link-btn" onClick={readAll}>Marcar todo como leído</button>}
          </div>

          {notifications.length === 0 ? (
            <div className="cj-empty">No tienes avisos todavía.</div>
          ) : (
            <ul className="cj-bell-list">
              {notifications.map((n) => (
                <li key={n.id}>
                  <button type="button" className={`cj-bell-item${n.read_at ? '' : ' is-unread'}`} onClick={() => openItem(n)}>
                    <i className={KIND_ICON[n.kind] || 'ph-duotone ph-bell'} aria-hidden="true" />
                    <span className="cj-bell-text">
                      <b>{n.title}</b>
                      <span>{n.body}</span>
                    </span>
                    <time className="cj-bell-time">{timeAgo(n.created_at)}</time>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="cj-bell-foot">
            {!supported ? (
              <span className="cj-bell-note">Este navegador no admite notificaciones push. En iPhone, instala la app en la pantalla de inicio.</span>
            ) : permission === 'denied' ? (
              <span className="cj-bell-note">Las notificaciones están bloqueadas. Actívalas en los ajustes del sitio de tu navegador.</span>
            ) : (
              <button type="button" className="cj-btn-secondary cj-bell-push" onClick={togglePush} disabled={busy}>
                <i className={`ph ph-${subscribed ? 'bell-slash' : 'bell-ringing'}`} aria-hidden="true" />
                {subscribed ? 'Desactivar notificaciones del navegador' : 'Activar notificaciones del navegador'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
