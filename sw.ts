import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { offlineFallback } from 'workbox-recipes';

declare const self: ServiceWorkerGlobalScope;

const SW_MUTATION_CACHE = 'sw-mutation-queue';

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data?.type === 'FLUSH_MUTATION_QUEUE') {
    event.waitUntil(flushMutationQueue());
  }
});

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    self.clients.claim();
    // Clean up old mutation queue cache from previous sessions
    const cache = await caches.open(SW_MUTATION_CACHE);
    const keys = await cache.keys();
    await Promise.all(keys.map(k => cache.delete(k)));
  })());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const isPostPutDelete = ['POST', 'PUT', 'DELETE'].includes(request.method);
  if (request.url.includes('/api/') && isPostPutDelete) {
    event.respondWith(handleMutationRequest(event));
  }
});

async function handleMutationRequest(event: FetchEvent): Promise<Response> {
  const { request } = event;
  try {
    const response = await fetch(request);
    if (!response.ok && response.status >= 500) {
      // Server error — queue for retry
      await queueFailedMutation(request);
    }
    return response;
  } catch {
    // Network error (offline or DNS failure) — queue for retry
    await queueFailedMutation(request);
    return new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function queueFailedMutation(request: Request): Promise<void> {
  const cache = await caches.open(SW_MUTATION_CACHE);
  const clone = request.clone();
  const body = await clone.text().catch(() => '');
  const headers: Record<string, string> = {};
  clone.headers.forEach((value, key) => { headers[key] = value; });
  const entry = {
    method: clone.method,
    url: clone.url,
    headers,
    body,
    queuedAt: Date.now(),
  };
  await cache.put(
    new Request(`/__sw_mutation/${Date.now()}_${Math.random().toString(36).slice(2)}`),
    new Response(JSON.stringify(entry), { headers: { 'Content-Type': 'application/json' } })
  );
}

async function flushMutationQueue(): Promise<void> {
  const cache = await caches.open(SW_MUTATION_CACHE);
  const keys = await cache.keys();
  if (keys.length === 0) return;

  const clients = await self.clients.matchAll({ type: 'window' });
  if (clients.length === 0) return;

  const entries: Array<{ method: string; url: string; headers: Record<string, string>; body: string; queuedAt: number }> = [];
  for (const key of keys) {
    const response = await cache.match(key);
    if (response) {
      const entry = await response.json();
      entries.push(entry);
    }
    await cache.delete(key);
  }

  // Send to client for replay via sync engine
  for (const client of clients) {
    client.postMessage({ type: 'MUTATION_QUEUE', entries });
  }
}

precacheAndRoute(self.__WB_MANIFEST);

offlineFallback({ pageFallback: '/offline.html' });

registerRoute(
  ({ request }) => request.destination === 'document',
  new StaleWhileRevalidate({ cacheName: 'pages' })
);

registerRoute(
  ({ url, request }) => url.pathname.startsWith('/api/') && request.method === 'GET',
  new StaleWhileRevalidate({
    cacheName: 'api-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 5 * 60 })
    ]
  })
);

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-queue') {
    event.waitUntil((async () => {
      const clients = await self.clients.matchAll({ type: 'window' });
      for (const client of clients) {
        client.postMessage({ type: 'SYNC_OFFLINE_QUEUE' });
      }
    })());
  }
});

self.addEventListener('online', () => {
  flushMutationQueue();
});

self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  const title = data.title || 'FinTrack Pro';
  const options: NotificationOptions = {
    body: data.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: data.tag || 'fintrack-push',
    data: data.url || '/',
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      self.clients.openWindow(url);
    })
  );
});
