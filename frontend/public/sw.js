/* Service worker de Control de Gastos: solo recibe notificaciones push y abre la app al pulsarlas. */

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'Control de Gastos', body: event.data ? event.data.text() : '' };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'Control de Gastos', {
      body: data.body || '',
      icon: '/logo192.png',
      badge: '/logo192.png',
      data: { link: data.link || '/' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const raw = (event.notification.data && event.notification.data.link) || '/';
  const link = raw === '/' ? '/dashboard' : raw; // la app no tiene página en "/"
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          client.navigate(link).catch(() => {});
          return client.focus();
        }
      }
      return self.clients.openWindow(link);
    })
  );
});
