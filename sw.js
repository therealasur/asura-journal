/* ASURA Trade Journal — Service Worker v2 */
const CACHE = 'asura-journal-v2';
const ASSETS = [
  '/asura-journal/',
  '/asura-journal/index.html',
  '/asura-journal/manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Never intercept Firebase, Dhan API, or Google Fonts
  const url = e.request.url;
  if (url.includes('firestore.googleapis') ||
      url.includes('firebase') ||
      url.includes('googleapis.com') ||
      url.includes('workers.dev') ||
      url.includes('api.dhan') ||
      url.includes('fonts.gstatic') ||
      url.includes('fonts.googleapis')) {
    return;
  }
  // Network-first for HTML so updates always get through
  if (url.endsWith('.html') || url.endsWith('/') || url.includes('/asura-journal/') && !url.includes('.')) {
    e.respondWith(
      fetch(e.request)
        .then(r => {
          const clone = r.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return r;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(r =>
      r || fetch(e.request).catch(() => caches.match('/asura-journal/index.html'))
    )
  );
});
