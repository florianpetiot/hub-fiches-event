/// <reference types="@sveltejs/kit" />
/// <reference lib="webworker" />

const sw = self as unknown as ServiceWorkerGlobalScope

const CACHE_VERSION = 'v5'
const CACHE_NAME = `hub-fiches-${CACHE_VERSION}`

// Fallback statique pour le mode hors-ligne (sans hydration Svelte)
const OFFLINE_FALLBACK = '/offline.html'

sw.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([OFFLINE_FALLBACK])
    })
  )
  sw.skipWaiting()
})

sw.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('hub-fiches-') && key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => sw.clients.claim())
  )
})

sw.addEventListener('fetch', (event: FetchEvent) => {
  // On ne gère que les requêtes de navigation (pages)
  if (event.request.mode !== 'navigate') return

  event.respondWith(
    (async () => {
      try {
        return await fetch(event.request)
      } catch {
        const offlineResponse = await caches.match(OFFLINE_FALLBACK)
        return offlineResponse ?? new Response('Hors ligne', { status: 503 })
      }
    })()
  )
})