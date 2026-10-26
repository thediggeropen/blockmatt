// Offline-Fassung (Home-Bildschirm): Seite + Symbole beim ersten Besuch merken. Seite immer zuerst frisch aus dem Netz
// (Updates kommen von selbst), ohne Netz aus dem Speicher. Bestenliste/Duell gehen nicht über diesen Speicher.
// Speicher sind je Origin: V1 (/blockmatt/) und V2 (/blockmatt/v2/) teilen ihn → Name und Aufräumen je Scope,
// sonst löscht die eine Fassung beim Aktivieren den Speicher der anderen
const SCOPE = new URL(self.registration.scope).pathname;
const PREFIX = 'blockmatt-' + SCOPE + '#'; // '#' trennt: '…/blockmatt/v2/#…' beginnt nicht mit '…/blockmatt/#'
const CACHE = PREFIX + 'bd787827970c';
const FILES = ['./', 'manifest.webmanifest', 'icon-180.png', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith(PREFIX) && k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (req.mode === 'navigate') { // auch ?duell=CODE: immer dieselbe Seite
    e.respondWith(fetch(req).then((res) => {
      // Nur die eigene Seite merken: V1 (Scope /blockmatt/) bedient /blockmatt/v2/, solange V2 noch keinen Worker hat.
      // Endgültige Adresse (nach Umleitung) direkt im Scope, ohne Unterordner
      const path = new URL(res.url || req.url).pathname, own = path.startsWith(SCOPE) && !path.slice(SCOPE.length).includes('/');
      if (res.ok && own) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put('./', copy)); }
      return res;
    }).catch(() => caches.open(CACHE).then((c) => c.match('./')))); // nur der eigene Speicher, nie ein verwaister alter
    return;
  }
  e.respondWith(caches.open(CACHE).then((c) => c.match(req)).then((hit) => hit ?? fetch(req)));
});
