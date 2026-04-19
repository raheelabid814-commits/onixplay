const CACHE_NAME = 'onixplay-v3';
const ASSETS = [
    './',
    './index.html',
    './auth.html',
    './movie.html',
    './watch.html',
    './css/style.css',
    './js/app.js',
    './js/auth.js',
    './js/ui.js',
    './js/tv-nav.js',
    './Assets/Images/app_logo.jpeg'
];

// ── Install: Cache core assets ──
self.addEventListener('install', (e) => {
    self.skipWaiting(); // Activate immediately
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS).catch(err => {
                console.warn('Cache addAll partial failure:', err);
            });
        })
    );
});

// ── Activate: Clear old caches ──
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
            );
        }).then(() => self.clients.claim())
    );
});

// ── Fetch: Network-first for API, Cache-first for assets ──
self.addEventListener('fetch', (e) => {
    const url = e.request.url;

    // Don't intercept external APIs (TMDB, Supabase, Anilist, streams)
    if (
        url.includes('themoviedb.org') ||
        url.includes('supabase.co') ||
        url.includes('anilist.co') ||
        url.includes('vidsrc') ||
        url.includes('cdn.jsdelivr') ||
        url.includes('cloudflare') ||
        url.includes('googleapis') ||
        !url.startsWith(self.location.origin)
    ) {
        return; // Let browser handle it normally
    }

    // Cache-first strategy for local assets
    e.respondWith(
        caches.match(e.request).then((cached) => {
            return cached || fetch(e.request).then(response => {
                // Cache successful GET responses
                if (e.request.method === 'GET' && response.status === 200) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
                }
                return response;
            });
        }).catch(() => {
            // Offline fallback for HTML pages
            if (e.request.destination === 'document') {
                return caches.match('./index.html');
            }
        })
    );
});

// ── Push Notifications ──
self.addEventListener('push', (e) => {
    let data = { title: 'OnixPlay+', body: 'New content is available! 🎬', icon: './Assets/Images/app_logo.jpeg' };

    try {
        data = e.data.json();
    } catch(err) {
        if (e.data) data.body = e.data.text();
    }

    const options = {
        body: data.body || 'Check out the latest on OnixPlay+!',
        icon: data.icon || './Assets/Images/app_logo.jpeg',
        badge: './Assets/Images/app_logo.jpeg',
        image: data.image || undefined,
        vibrate: [200, 100, 200],
        tag: 'onixplay-notification',
        renotify: true,
        requireInteraction: false,
        data: {
            url: data.url || './index.html'
        },
        actions: [
            { action: 'open', title: '▶ Watch Now' },
            { action: 'close', title: 'Dismiss' }
        ]
    };

    e.waitUntil(
        self.registration.showNotification(data.title || 'OnixPlay+', options)
    );
});

// ── Handle notification click ──
self.addEventListener('notificationclick', (e) => {
    e.notification.close();

    if (e.action === 'close') return;

    const targetUrl = e.notification.data?.url || './index.html';

    e.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
            // If app already open, focus it
            for (const client of clients) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    client.focus();
                    client.navigate(targetUrl);
                    return;
                }
            }
            // Otherwise open new window
            if (self.clients.openWindow) {
                return self.clients.openWindow(targetUrl);
            }
        })
    );
});
