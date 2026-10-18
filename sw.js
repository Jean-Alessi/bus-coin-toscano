// Service worker mínimo: no cachea nada (así nunca sirve una versión vieja
// pisando el "?v=N" de cache-busting), pero su sola presencia con un
// listener de fetch es lo que Chrome/Android exige para que aparezca el
// cartel nativo de "Instalar app".
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
// Las páginas (navegación) se piden siempre al servidor, sin la copia que guarda el navegador:
// así al reabrir la app llega el index.html más nuevo.
self.addEventListener('fetch', event => event.respondWith(event.request.mode === 'navigate' ? fetch(event.request, { cache: 'no-store' }) : fetch(event.request)));
