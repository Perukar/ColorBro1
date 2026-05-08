// ============================================================
// SERVICE WORKER — My Barber UA
// Стратегія: Cache First, fall back to Network
// Версія кешу: my-barber-v9.1
// ============================================================

const CACHE_NAME = 'my-barber-v9.1';

// Файли, що кешуються при інсталяції
const PRECACHE_ASSETS = [
    './colorist.html',
    './core.js',
    './manifest.json'
];

// --- INSTALL: передкешуємо базові файли ---
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(PRECACHE_ASSETS))
            .then(() => self.skipWaiting()) // активуємо одразу, не чекаючи закриття вкладок
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
        ).then(() => self.clients.claim()) // беремо контроль над всіма клієнтами
    );
});

// --- FETCH: Cache First, fall back to Network ---
self.addEventListener('fetch', event => {
    // Обробляємо тільки GET-запити
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request).then(cached => {
            if (cached) {
                return cached; // є в кеші — повертаємо одразу
            }
            // Немає в кеші — йдемо в мережу
            return fetch(event.request).then(networkResponse => {
                // Кешуємо нову відповідь для наступного разу
                if (networkResponse && networkResponse.status === 200) {
                    const cloned = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, cloned));
                }
                return networkResponse;
            }).catch(() => {
                // Мережа недоступна і в кеші немає — нічого не повертаємо
                // (браузер покаже стандартну помилку)
            });
        })
    );
});
