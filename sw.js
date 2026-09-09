const CACHE_NAME = "bass-finder-wales-v4";

const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.webmanifest"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {

  /*
    Forecast requests must always try the network first.
    This prevents old weather data being presented as live data.
  */

  if (
    event.request.url.includes("open-meteo.com") ||
    event.request.url.includes("marine-api.open-meteo.com")
  ) {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match(event.request)
      )
    );
    return;
  }

  /*
    App files use cache-first behaviour so the app can
    still open when the phone has poor/no signal.
  */

  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request))
  );
});
