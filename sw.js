/* StudyAI service worker: offline app shell + runtime cache */
const V='studyai-v14';
const SHELL=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
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
  const ok=u.origin===location.origin||/fonts\.(googleapis|gstatic)\.com|picsum\.photos|fastly\.picsum\.photos/.test(u.hostname);
  if(!ok)return;
  if(r.mode==='navigate'){
    e.respondWith(fetch(r).then(res=>{const cp=res.clone();caches.open(V).then(c=>c.put(r,cp));return res})
      .catch(()=>caches.match(r).then(m=>m||caches.match('./index.html')||caches.match('./'))));
    return;
  }
  e.respondWith(caches.match(r).then(m=>{
    const net=fetch(r).then(res=>{if(res&&(res.ok||res.type==='opaque')){const cp=res.clone();caches.open(V).then(c=>c.put(r,cp))}return res}).catch(()=>m);
    return m||net;
  }));
});
