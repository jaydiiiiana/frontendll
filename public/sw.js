self.addEventListener('install', () => {
    console.log('Service Worker: Installed');
});

self.addEventListener('fetch', (event) => {
    // Basic service worker that allows requests to pass through
});
