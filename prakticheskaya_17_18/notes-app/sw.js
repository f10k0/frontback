const CACHE_NAME = 'app-shell-v5';
const DYNAMIC_CACHE_NAME = 'dynamic-content-v4';
const ASSETS = [
    '/',
    '/index.html',
    '/app.js',
    '/manifest.json',
    '/icons/favicon.ico',
    '/icons/favicon-16x16.png',
    '/icons/favicon-32x32.png',
    '/icons/favicon-48x48.png',
    '/icons/favicon-64x64.png',
    '/icons/favicon-128x128.png',
    '/icons/favicon-256x256.png',
    '/icons/favicon-512x512.png',
    '/icons/apple-touch-icon.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME && key !== DYNAMIC_CACHE_NAME)
                    .map(key => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    if (url.origin !== location.origin) return;
    if (url.pathname.startsWith('/content/')) {
        event.respondWith(
            fetch(event.request)
                .then(networkRes => {
                    const resClone = networkRes.clone();
                    caches.open(DYNAMIC_CACHE_NAME).then(cache => cache.put(event.request, resClone));
                    return networkRes;
                })
                .catch(() => caches.match(event.request).then(cached => cached || caches.match('/content/home.html')))
        );
    } else {
        event.respondWith(
            caches.match(event.request).then(response => response || fetch(event.request))
        );
    }
});

self.addEventListener('push', event => {
    let data = { title: 'Новое уведомление', body: '', reminderId: null };
    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data.body = event.data.text();
        }
    }
    const options = {
        body: data.body,
        icon: '/icons/favicon-128x128.png',
        badge: '/icons/favicon-48x48.png',
        data: { reminderId: data.reminderId },
        vibrate: [200, 100, 200]
    };
    if (data.reminderId) {
        options.actions = [
            { action: 'snooze', title: 'Отложить на 1 минуту' }
        ];
    }
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', event => {
    console.log('[SW] Клик по уведомлению, action:', event.action);
    const notification = event.notification;
    const action = event.action;
    const reminderId = notification.data.reminderId;
    notification.close();

    if (action === 'snooze' && reminderId) {
        console.log('[SW] Откладываем напоминание:', reminderId);
        event.waitUntil(
            fetch(`/snooze?reminderId=${reminderId}`, { method: 'POST' })
                .then(response => console.log('[SW] Snooze ответ:', response.status))
                .catch(err => console.error('[SW] Snooze ошибка:', err))
        );
    } else {
        console.log('[SW] Открываем приложение');
        event.waitUntil(clients.openWindow('/'));
    }
});