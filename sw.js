/**
 * Service Worker — CBT SMK Ganesa Satria 4 Kedu
 *
 * Strategy:
 *  - App shell navigation (index.html / /): network-first with cache fallback
 *  - Static app assets (generated CSS, manifest, logo): network-first with cache fallback
 *  - CDN assets (Lucide, MathJax, SheetJS, SweetAlert2, fonts): stale-while-revalidate
 *  - Apps Script API (POST): network-only (writes must be online; offline queue handled in app via IndexedDB)
 *  - Other GET requests: network-first with cache fallback
 *
 * Bump CACHE_VERSION to force update on all clients.
 */

const CACHE_VERSION = 'cbt-v1.1.0';
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

const SHELL_URLS = [
  './tailwind.generated.css',
  './manifest.json',
  'https://smkganesasatria4tmg.sch.id/wp-content/uploads/2023/11/logo-update.png'
];

const CDN_HOSTS = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'cdn.jsdelivr.net',
  'unpkg.com',
  'cdnjs.cloudflare.com'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then(cache => cache.addAll(SHELL_URLS).catch(err => console.warn('[SW] precache partial:', err)))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== SHELL_CACHE && k !== RUNTIME_CACHE).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // POST or non-GET — network-only (typically Apps Script API).
  if (req.method !== 'GET') {
    return; // let the browser handle; app handles offline queueing
  }

  // Apps Script API — network-only.
  if (url.host.endsWith('script.google.com') || url.host.endsWith('googleusercontent.com')) {
    return;
  }

  // Shell — cache-first.
  // HTML navigation: network-first.
  if (req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('/index.html')) {
    event.respondWith(
      fetch(req, { cache: 'no-store' }).then(resp => {
        if (resp && resp.status === 200) {
          const copy = resp.clone();
          caches.open(SHELL_CACHE).then(c => c.put('./index.html', copy));
        }
        return resp;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Versioned app assets: network-first.
  if (SHELL_URLS.some(u => url.pathname.endsWith(u.replace('./', '')))) {
    event.respondWith(
      fetch(req, { cache: 'no-store' }).then(resp => {
        if (resp && resp.status === 200) {
          const copy = resp.clone();
          caches.open(SHELL_CACHE).then(c => c.put(req, copy));
        }
        return resp;
      }).catch(() => caches.match(req))
    );
    return;
  }

  // CDN — stale-while-revalidate.
  if (CDN_HOSTS.includes(url.host)) {
    event.respondWith(
      caches.match(req).then(cached => {
        const fetchPromise = fetch(req).then(resp => {
          if (resp && resp.status === 200) {
            const copy = resp.clone();
            caches.open(RUNTIME_CACHE).then(c => c.put(req, copy));
          }
          return resp;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }

  // Default — network-first with cache fallback.
  event.respondWith(
    fetch(req).then(resp => {
      if (resp && resp.status === 200 && req.url.startsWith('http')) {
        const copy = resp.clone();
        caches.open(RUNTIME_CACHE).then(c => c.put(req, copy));
      }
      return resp;
    }).catch(() => caches.match(req))
  );
});

// Allow app to trigger update / cache clear
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') self.skipWaiting();
  if (event.data === 'clearCaches') {
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => event.source && event.source.postMessage({ type: 'cachesCleared' }));
  }
});
