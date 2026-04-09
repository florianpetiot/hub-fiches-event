/// <reference types="@sveltejs/kit" />
/// <reference lib="webworker" />

const sw = self as unknown as ServiceWorkerGlobalScope

const CACHE_VERSION = 'v3'
const CACHE_NAME = `hub-fiches-${CACHE_VERSION}`

// Pages à mettre en cache pour le offline
const OFFLINE_PAGE = '/offline'

sw.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([OFFLINE_PAGE])
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
        const requestUrl = new URL(event.request.url)

        // Pour les autres pages, on force une vraie navigation vers /offline
        // pour éviter d'afficher son HTML sous une URL protégée.
        if (requestUrl.pathname !== OFFLINE_PAGE) {
          return Response.redirect(OFFLINE_PAGE, 302)
        }

        const offlineResponse = await caches.match(OFFLINE_PAGE)
        return offlineResponse ?? new Response('Hors ligne', { status: 503 })
      }
    })()
  )
})