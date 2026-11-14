// Ersetzt den Spike-Service-Worker vom 04.11. (setzte COOP/COEP): meldet sich selbst ab.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.registration.unregister()));
