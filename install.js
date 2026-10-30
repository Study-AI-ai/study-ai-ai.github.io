(function(){
if(window.__studyAIInstallReady)return;window.__studyAIInstallReady=true;
let deferred=null,modal=null;
const css=\`
#studyai-install-app{position:fixed;z-index:2147483000;left:20px;bottom:20px;padding:13px 19px;border:1px solid #ffffff66;border-radius:999px;background:linear-gradient(115deg,#5148ed,#8064ff 52%,#ec4899);color:#fff;font:800 14px system-ui;box-shadow:0 10px 32px #5348dc55;cursor:pointer;transition:.2s}
#studyai-install-app:hover{transform:translateY(-3px);box-shadow:0 15px 38px #5348dc66}
#studyai-install-backdrop{position:fixed;inset:0;z-index:2147483001;display:grid;place-items:center;padding:16px;background:#0a10269e;backdrop-filter:blur(9px);opacity:0;visibility:hidden;transition:.22s}
#studyai-install-backdrop.open{opacity:1;visibility:visible}
#studyai-install-card{position:relative;width:min(100%,480px);max-height:88vh;overflow:auto;padding:23px;border-radius:25px;background:linear-gradient(145deg,#fff,#f7f7ff 65%,#fff2f8);color:#17213b;box-shadow:0 28px 90px #040a2355;font:14px/1.5 system-ui}
#studyai-install-card h2{margin:0;font-size:22px}#studyai-install-card .muted{color:#68738a;font-size:12px}
#studyai-install-card .close{position:absolute;right:15px;top:15px;border:0;border-radius:50%;width:36px;height:36px;background:#eceeff;font-size:22px}
#studyai-install-card .logo{display:inline-grid;place-items:center;width:50px;height:50px;margin-right:10px;border-radius:16px;background:linear-gradient(140deg,#635bff,#a855f7,#ff4fa3);color:white;font-size:26px;vertical-align:middle}
#studyai-install-card .kicker{margin:17px 0 8px;color:#6558df;font-size:10px;font-weight:900;letter-spacing:1.3px}
#studyai-install-card .features,#studyai-install-card .nets,#studyai-install-card .meta{display:grid;grid-template-columns:1fr 1fr;gap:8px}
#studyai-install-card .feature,#studyai-install-card .net,#studyai-install-card .meta div{padding:10px;border:1px solid #e9e8fb;border-radius:13px;background:#fff;font-size:12px}
#studyai-install-card .net p{margin:5px 0 0;color:#68738a;font-size:11px}
#studyai-install-card .meta{margin-top:9px}#studyai-install-card .meta div{background:#f0efff}
#studyai-install-card small{display:block;color:#68738a;font-size:10px}
#studyai-install-card .note{padding:10px;border-radius:12px;background:#fff8e8;color:#765a16;font-size:10px}
#studyai-install-card .actions{display:flex;gap:9px;margin-top:14px}
#studyai-install-card button{cursor:pointer;border:0;border-radius:12px;padding:12px 16px;font-weight:800}
#studyai-install-card .primary{flex:1;color:white;background:linear-gradient(110deg,#635bff,#9b55e8,#e84b9c)}
#studyai-install-card .secondary{background:#eceef7;color:#434b68}
@media(max-width:520px){#studyai-install-app{left:12px;bottom:max(12px,env(safe-area-inset-bottom));font-size:13px;padding:12px 15px}#studyai-install-card{padding:19px}#studyai-install-card .nets{grid-template-columns:1fr}}
@media(prefers-reduced-motion:reduce){#studyai-install-app,#studyai-install-backdrop{transition:none}}
\`;
const style=document.createElement('style');style.textContent=css;document.head.appendChild(style);
const btn=document.createElement('button');btn.id='studyai-install-app';btn.type='button';btn.textContent='⬇  Download StudyAI';
function device(){let u=navigator.userAgent;if(/iPad|iPhone|iPod/.test(u))return'iPhone / iPad';if(/Android/.test(u))return'Android';if(/Windows/.test(u))return'Windows PC';if(/Macintosh/.test(u))return'Mac';if(/Linux|CrOS/.test(u))return'Linux / Chromebook';return'This device'}
function guide(){let u=navigator.userAgent;if(/iPad|iPhone|iPod/.test(u))return'Safari: Share → Add to Home Screen. Then launch StudyAI from its new app icon.';if(/Android/.test(u))return'Chrome: menu (⋮) → Install app / Add to Home screen.';if(/Windows|Linux|CrOS/.test(u))return'Chrome or Edge: click the install icon in the address bar, or choose Install StudyAI from the browser menu.';return'Use your browser menu to choose Install app or Add to Home Screen.'}
function close(){if(modal)modal.classList.remove('open')}
async function install(){let help=modal.querySelector('.help');if(matchMedia('(display-mode: standalone)').matches||navigator.standalone){help.textContent='StudyAI is already installed on this device.';return}if(deferred){let p=deferred;deferred=null;try{p.prompt();let r=await p.userChoice;help.textContent=r.outcome==='accepted'?'Install accepted. StudyAI is being added.':'Install cancelled. You can try again later.'}catch(e){help.textContent=guide()}}else help.textContent=guide()}
function show(){
if(modal&&modal.isConnected){modal.classList.add('open');return}
modal=document.createElement('div');modal.id='studyai-install-backdrop';
modal.innerHTML='<section id="studyai-install-card" role="dialog" aria-modal="true" aria-labelledby="sai-install-title"><button class="close" aria-label="Close">×</button><div><span class="logo">✦</span><span style="display:inline-block;vertical-align:middle"><h2 id="sai-install-title">StudyAI App</h2><span class="muted">Your smart learning space · Classes 6–12</span></span></div><div class="kicker">WHAT YOU GET</div><div class="features"><div class="feature">🤖 AI Tutor</div><div class="feature">🗂️ Flashcards</div><div class="feature">📚 Study Notes</div><div class="feature">📝 Practice Quiz</div><div class="feature">📄 Chapter Papers</div><div class="feature">📖 NCERT Library</div><div class="feature">👥 Community</div><div class="feature">🔊 Voice Learning</div></div><div class="kicker">INTERNET & OFFLINE</div><div class="nets"><div class="net"><b>🌐 With internet</b><p>AI Tutor, Community, sign-in, account sync and live services.</p></div><div class="net"><b>📴 Without internet</b><p>Cached app shell and previously cached pages may open. AI, live content and sync need internet.</p></div></div><div class="meta"><div><small>Initial app files</small><b>About 1.1 MB*</b></div><div><small>Your device</small><b class="device"></b></div></div><p class="note">*Approximate website shell size, not full browser storage. Actual storage varies. This is an installable web app (PWA), not a separate APK/EXE installer.</p><div class="actions"><button class="primary">Install StudyAI</button><button class="secondary">Later</button></div><p class="muted help" aria-live="polite"></p></section>';
document.body.appendChild(modal);modal.querySelector('.device').textContent=device();modal.querySelector('.close').onclick=close;modal.querySelector('.secondary').onclick=close;modal.querySelector('.primary').onclick=install;modal.addEventListener('click',e=>{if(e.target===modal)close()});requestAnimationFrame(()=>modal.classList.add('open'))
}
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e});
window.addEventListener('appinstalled',()=>{if(modal)modal.querySelector('.help').textContent='StudyAI successfully installed.'});
btn.onclick=show;function mount(){if(!document.getElementById(btn.id))document.body.appendChild(btn)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();

/* StudyAI performance and touch polish */
(function(){
  if (window.__studyAIPerformanceReady) return;
  window.__studyAIPerformanceReady = true;

  const perfStyle = document.createElement('style');
  perfStyle.id = 'studyai-performance-polish';
  perfStyle.textContent = `
    html {
      scroll-behavior: auto !important;
      -webkit-tap-highlight-color: transparent;
    }
    body, button, a, input, select, textarea, [role="button"] {
      -webkit-tap-highlight-color: transparent;
    }
    button, a, [role="button"] {
      touch-action: manipulation;
    }
    img {
      image-rendering: auto;
    }
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        scroll-behavior: auto !important;
        animation-duration: .01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: .01ms !important;
      }
    }
  `;
  (document.head || document.documentElement).appendChild(perfStyle);

  function prepareImages(root) {
    const images = [];
    if (root && root.tagName === 'IMG') images.push(root);
    if (root && root.querySelectorAll) images.push(...root.querySelectorAll('img'));
    for (const img of images) {
      if (img.loading || img.dataset.eager === 'true') continue;
      const rect = img.getBoundingClientRect();
      if (rect.top > window.innerHeight * 1.25) img.loading = 'lazy';
      img.decoding = 'async';
    }
  }

  function start() {
    prepareImages(document);
    if ('MutationObserver' in window && document.body) {
      const observer = new MutationObserver(records => {
        for (const record of records) {
          for (const node of record.addedNodes) {
            if (node.nodeType === 1) prepareImages(node);
          }
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
