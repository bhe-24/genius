const CACHE_NAME = 'genius-app-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/asisten-ai.html',
  '/home-work.html',
  '/kalender.html',
  '/profil.html',
  '/login.html',
  '/finish.html'
];

// Install Service Worker dan simpan cache
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Jalankan aplikasi dari cache jika offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response; // Gunakan file dari memori HP
        }
        return fetch(event.request); // Mengambil dari internet
      })
  );
});
