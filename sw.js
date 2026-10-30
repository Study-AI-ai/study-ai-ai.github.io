/* StudyAI service worker: offline app shell + runtime cache + tablet touch polish */
const V='studyai-v15';
const SHELL=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
const TOUCH_STYLE = `<style id="studyai-touch-polish">
html { -webkit-tap-highlight-color: transparent; scroll-behavior: smooth; }
body, button, a, input, select, textarea, [role="button"] { -webkit-tap-highlight-color: transparent; }
button, a, [role="button"] { touch-action: manipulation; }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { scroll-behavior: auto !important; animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; }
}
</style>`;
async function polishNavigation(response) {
  if (!response || !response.ok) return response;
  const type = response.headers.get('content-type') || '';
  if (!type.includes('text/html')) return response;
  const html = await response.text();
  if (html.includes('id="studyai-touch-polish"') || !/<\/head>/i.test(html)) {
    const headers = new Headers(response.headers);
    headers.delete('content-length'); headers.delete('content-encoding'); headers.delete('etag');
    return new Response(html, {status:response.status, statusText:response.statusText, headers});
  }
  const patched = html.replace(/<\/head>/i, TOUCH_STYLE + '</head>');
  const headers = new Headers(response.headers);
  headers.delete('content-length'); headers.delete('content-encoding'); headers.delete('etag');
  return new Response(patched, {status:response.status, statusText:response.statusText, headers});
}
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(V).then(c=>Promise.all(SHELL.map(u=>c.add(u).catch(()=>{})))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET')return;                 // AI chat (POST) always goes to the network
  const u=new URL(r.url);
  if(u.hostname.endsWith('onrender.com'))return;   // never cache backend calls
  const ok=u.origin===location.origin||/fonts\\.(googleapis|gstatic)\\.com|picsum\\.photos|fastly\\.picsum\\.photos/.test(u.hostname);
  if(!ok)return;
  if(r.mode==='navigate'){
    e.respondWith(fetch(r).then(async res=>{
      const polished=await polishNavigation(res);
      const cp=polished.clone(); caches.open(V).then(c=>c.put(r,cp));
      return polished;
    }).catch(()=>caches.match(r).then(m=>m||caches.match('./index.html')||caches.match('./'))));
    return;
  }
  e.respondWith(caches.match(r).then(m=>{
    const net=fetch(r).then(res=>{if(res&&(res.ok||res.type==='opaque')){const cp=res.clone();caches.open(V).then(c=>c.put(r,cp))}return res}).catch(()=>m);
    return m||net;
  }));
});