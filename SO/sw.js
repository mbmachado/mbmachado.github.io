var CACHE_NAME = 'EP-cache-v1';
var urlsToCache = [
    'index.html',
    'assets/js/script.js',
    'assets/img/favicon.png',
    'assets/css/stylesheet.css',
    'assets/vendor/velocity/velocity.min.js',
    'assets/vendor/jQuery/jquery-3.3.1.min.js',
    'assets/vendor/materialize/js/materialize.min.js',
    'assets/vendor/materialize/css/materialize.min.css',
    'assets/vendor/jQuery-Mask-Plugin/dist/jquery.mask.min.js'
];

self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            return cache.addAll(urlsToCache);
        })
    );
});

self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request).then(function(response) {
            if (response) {
              return response;
            }
            return fetch(event.request);
        })
    );
});