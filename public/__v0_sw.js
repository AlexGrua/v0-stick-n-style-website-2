// Minimal, safe Service Worker to satisfy preview SW registration.
// It does not cache; it simply activates and lets all requests pass-through.

self.addEventListener("install", (event) => {
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim())
})

// No-op fetch passthrough
self.addEventListener("fetch", () => {
  // Intentionally empty – respond with network as usual.
})
