// src/service-worker.js
const CACHE_NAME = 'chess-club-cache-v1';
const OFFLINE_URL = '/offline.html';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/src/main.jsx',
  '/src/App.jsx',
  '/src/index.css',
  // Add other static assets
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // Cache static assets
      await cache.addAll(STATIC_ASSETS);
      // Cache offline page
      const offlineResponse = new Response(
        '<html><body><h1>You are offline</h1><p>Please check your internet connection.</p></body></html>',
        {
          headers: { 'Content-Type': 'text/html' }
        }
      );
      await cache.put(OFFLINE_URL, offlineResponse);
    })()
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Clean up old caches
      const cacheKeys = await caches.keys();
      const deletions = cacheKeys
        .filter(key => key !== CACHE_NAME)
        .map(key => caches.delete(key));
      await Promise.all(deletions);
      
      // Take control of all clients
      await clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  // Handle API requests differently from static assets
  if (event.request.url.includes('/api/')) {
    event.respondWith(handleApiRequest(event.request));
  } else {
    event.respondWith(handleStaticRequest(event.request));
  }
});

async function handleApiRequest(request) {
  try {
    // Try network first for API requests
    const response = await fetch(request);
    return response;
  } catch (error) {
    // If offline, return cached response if available
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    // If no cached response, return offline JSON response
    return new Response(
      JSON.stringify({ error: 'You are offline' }),
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

async function handleStaticRequest(request) {
  try {
    // Try network first
    const response = await fetch(request);
    // Cache successful responses
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    // If offline, return cached response
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    // If no cached response, return offline page
    return caches.match(OFFLINE_URL);
  }
}