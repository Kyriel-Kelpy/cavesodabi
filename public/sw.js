// La Cave de Pépé — service worker minimal.
// Rôle : (1) rendre l'appli « installable » sur Android/Chrome (condition technique exigée
// par les navigateurs, en plus du manifeste), (2) garder en mémoire les pages déjà visitées
// pour amortir une coupure réseau brève. Ce n'est PAS un mode hors-ligne complet : toute
// vente a toujours besoin du réseau pour atteindre Supabase.
//
// Change CACHE_NAME (ex. v1 -> v2) si tu veux forcer tous les téléphones à repartir d'un
// cache propre après une mise à jour importante.
const CACHE_NAME = 'cave-de-pepe-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request)),
  );
});
