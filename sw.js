// ============================================================
// SERVICE WORKER — My Barber UA
// Стратегія: Cache First, fall back to Network
// Версія кешу: my-barber-v9.2-ghpages
// ============================================================

const CACHE_NAME = 'my-barber-v9.5-PRO-LOGIC';
const BASE = '/ColorBro1';

// Файли, що кешуються при інсталяції (абсолютні шляхи для GitHub Pages)
const PRECACHE_ASSETS = [
    BASE + '/',
    BASE + '/colorist.html',
    BASE + '/core.js',
    BASE + '/manifest.json',
    BASE + '/sw.js',
    BASE + '/style.css'
];

// --- INSTALL: передкешуємо базові файли ---
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(PRECACHE_ASSETS))
            .then(() => self.skipWaiting())
    );
});

// --- ACTIVATE: видаляємо старі версії кешу ---
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys
                    .filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            )
        ).then(() => self.clients.claim())
    );
});

// --- FETCH: Cache First, fall back to Network ---
self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request).then(cached => {
            if (cached) {
                return cached;
            }
            return fetch(event.request).then(networkResponse => {
                if (networkResponse && networkResponse.status === 200) {
                    const cloned = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, cloned));
                }
                return networkResponse;
            }).catch(() => {
                // Мережа недоступна і в кеші немає
            });
        })
    );
});
