const STATIC_CACHE = "habitflow-static-v2";
const HTML_CACHE = "habitflow-html-v2";

const APP_SHELL = [
  "/",
  "/auth",
  "/dashboard",
  "/index.html",
  "/auth.html",
  "/dashboard.html",
  "/manifest.webmanifest",
  "/src/css/landing.css",
  "/src/css/auth.css",
  "/src/css/tracker.css",
  "/src/css/dashboard.css",
  "/src/js/landing.js",
  "/src/js/tracker.js",
  "/src/js/firebase-config.js",
  "/icons/icon.svg",
  "/icons/icon-maskable.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => ![STATIC_CACHE, HTML_CACHE].includes(key))
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirstPage(request));
    return;
  }

  event.respondWith(staleWhileRevalidate(request));
});

async function networkFirstPage(request) {
  const cache = await caches.open(HTML_CACHE);
  try {
    const response = await fetch(request, { cache: "no-store" });
    if (response.ok) {
      cache.put(request, response.clone());
      return response;
    }

    const cachedResponse = (await cache.match(request))
      || (await caches.match("/dashboard"))
      || (await caches.match("/auth"))
      || (await caches.match("/"))
      || (await caches.match("/dashboard.html"))
      || (await caches.match("/auth.html"))
      || (await caches.match("/index.html"));

    if (cachedResponse) {
      return cachedResponse;
    }

    return response;
  } catch {
    return (await cache.match(request))
      || (await caches.match("/dashboard"))
      || (await caches.match("/auth"))
      || (await caches.match("/"))
      || (await caches.match("/dashboard.html"))
      || (await caches.match("/auth.html"))
      || (await caches.match("/index.html"));
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  const networkFetch = fetch(request)
    .then((response) => {
      if (response && response.status === 200) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);

  return cached || networkFetch;
}
