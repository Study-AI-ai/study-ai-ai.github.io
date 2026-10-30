/* StudyAI PWA: device-aware install menu and stable standalone launch */
const CACHE_VERSION = 'studyai-v22';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './install.js'
];
const BROWSER_EXTRAS = `<link rel="icon" type="image/png" href="./icon-192.png"><link rel="apple-touch-icon" href="./icon-192.png"><meta name="theme-color" content="#635bff"><meta name="description" content="StudyAI | AI Learning Hub for Classes 6-12 | AI Tutor"><title>StudyAI | AI Learning Hub for Classes 6-12 | AI Tutor</title><style id="studyai-touch-polish">
html { -webkit-tap-highlight-color: transparent; scroll-behavior: smooth; }
body, button, a, input, select, textarea, [role="button"] { -webkit-tap-highlight-color: transparent; }
button, a, [role="button"] { touch-action: manipulation; }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { scroll-behavior: auto !important; animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; }
}
</style><script id="studyai-install-loader" src="./install.js" defer><\/script>`;

async function addBrowserExtras(response) {
  if (!response || !response.ok) return response;
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return response;

  const html = await response.text();
  if (html.includes('studyai-install-loader') || html.includes('studyai-touch-polish')) {
    const headers = new Headers(response.headers);
    ['content-length', 'content-encoding', 'etag', 'content-md5'].forEach(name => headers.delete(name));
    return new Response(html, { status: response.status, statusText: response.statusText, headers });
  }

  const updatedHtml = html.replace(/<\/head>/i, BROWSER_EXTRAS + '</head>');
  const headers = new Headers(response.headers);
  ['content-length', 'content-encoding', 'etag', 'content-md5'].forEach(name => headers.delete(name));
  return new Response(updatedHtml, { status: response.status, statusText: response.statusText, headers });
}

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => Promise.all(APP_SHELL.map(url => cache.add(url).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_VERSION).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.hostname.endsWith('onrender.com')) return;
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    const isInstalledAppLaunch = url.searchParams.get('studyai_app') === '1';
    event.respondWith((async () => {
      try {
        const networkResponse = await fetch(new Request(request, { cache: 'no-store' }));
        if (!networkResponse || !networkResponse.ok) {
          return (await caches.match(request)) || networkResponse;
        }

        // Standalone app launches receive the original app document unchanged.
        const finalResponse = isInstalledAppLaunch
          ? networkResponse
          : await addBrowserExtras(networkResponse);

        const cache = await caches.open(CACHE_VERSION);
        await cache.put(request, finalResponse.clone()).catch(() => {});
        return finalResponse;
      } catch (error) {
        return (await caches.match(request)) ||
          (await caches.match('./index.html')) ||
          (await caches.match('./')) ||
          Response.error();
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response && response.ok) {
        const cache = await caches.open(CACHE_VERSION);
        await cache.put(request, response.clone()).catch(() => {});
      }
      return response;
    } catch (error) {
      return Response.error();
    }
  })());
});