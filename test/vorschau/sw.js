// Seite umgezogen: meldet den alten Offline-Speicher dieses Ordners ab und löscht dessen Caches (nur diesen Scope).
const PREFIX = 'blockmatt-' + new URL(self.registration.scope).pathname + '#';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(
  caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith(PREFIX)).map((k) => caches.delete(k))))
    .then(() => self.registration.unregister())));
