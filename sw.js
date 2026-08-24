const CACHE_NAME = 'genius-v2'; // Versi diubah agar cache lama terhapus
const urlsToCache = ['/'];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache); // Hapus cache versi lama yang menyebabkan error
          }
        })
      );
    })
  );
});

// Strategi: Network First (Utamakan internet, jika gagal baru ambil cache)
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
