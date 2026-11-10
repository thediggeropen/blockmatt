// Offline-Fassung (Home-Bildschirm): Seite + Symbole beim ersten Besuch merken. Seite danach immer aus dem Speicher
// (ein neuer Build lädt im Hintergrund und gilt ab dem nächsten Laden). Bestenliste/Duell gehen nicht über diesen Speicher.
// Speicher sind je Origin: V1 (/blockmatt/) und V2 (/blockmatt/v2/) teilen ihn → Name und Aufräumen je Scope,
// sonst löscht die eine Fassung beim Aktivieren den Speicher der anderen
const SCOPE = new URL(self.registration.scope).pathname;
const PREFIX = 'blockmatt-' + SCOPE + '#'; // '#' trennt: '…/blockmatt/v2/#…' beginnt nicht mit '…/blockmatt/#'
const VERSION = 'd3b57e15a142'; // build.mjs: Hash der Seite
const CACHE = PREFIX + VERSION;
const FILES = ['./', 'manifest.webmanifest', 'icon-180.png', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    // cache: 'reload' – am HTTP-Zwischenspeicher vorbei (Pages: 10 min), sonst landet die alte Seite im neuen Speicher
    await c.addAll(FILES.map((f) => new Request(f, { cache: 'reload' })));
    // Liefert der Server kurz nach dem Hochladen noch die alte Seite zur neuen sw.js, bliebe sie bis zum nächsten Build im
    // Speicher. Dann lieber scheitern: der alte Worker bleibt, das nächste Laden versucht es neu
    const sum = new Uint8Array(await crypto.subtle.digest('SHA-256', await (await c.match('./')).arrayBuffer()));
    if (!Array.from(sum, (b) => b.toString(16).padStart(2, '0')).join('').startsWith(VERSION)) {
      await caches.delete(CACHE);
      throw new Error('Seite passt nicht zur Version');
    }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith(PREFIX) && k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (req.mode === 'navigate') { // auch ?duell=CODE: immer dieselbe Seite
    // Eigene Seite aus dem Speicher (Start hängt nie am Netz). Alles andere im Scope – Unterordner fremder Fassungen ohne
    // eigenen Worker, direkt geöffnete Dateien – aus dem Netz und nie in den Speicher; ohne Netz die eigene Seite
    const p = new URL(req.url).pathname, mine = p === SCOPE || p === SCOPE + 'index.html';
    e.respondWith(caches.open(CACHE).then((c) => (mine ? c.match('./') : undefined)).then((hit) => hit ?? fetch(req).then((res) => {
      if (res.ok && mine) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put('./', copy)); }
      return res;
    }).catch(() => caches.open(CACHE).then((c) => c.match('./'))))); // nur der eigene Speicher, nie ein verwaister alter
    return;
  }
  e.respondWith(caches.open(CACHE).then((c) => c.match(req)).then((hit) => hit ?? fetch(req)));
});
