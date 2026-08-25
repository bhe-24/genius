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

  // Menangani aksi ketika Notifikasi diklik oleh pengguna
self.addEventListener('notificationclick', function(event) {
    event.notification.close(); // Tutup pop-up notifikasi
    
    // Ambil URL tugas spesifik dari payload data notifikasi
    const urlToOpen = event.notification.data.url;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
            // Jika aplikasi sudah terbuka, fokuskan dan arahkan ke URL tugas
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url && 'focus' in client) {
                    client.navigate(urlToOpen);
                    return client.focus();
                }
            }
            // Jika aplikasi sedang ditutup, buka aplikasi baru ke URL tugas
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
