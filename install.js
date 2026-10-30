(function(){
  if (window.__studyAIInstallReady) return;
  window.__studyAIInstallReady = true;
  const standalone = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  if (standalone()) return;
  let deferredPrompt = null;
  const style = document.createElement('style');
  style.textContent = `
    #studyai-install-app{position:fixed;z-index:2147483000;left:18px;bottom:18px;display:flex;align-items:center;gap:9px;padding:12px 17px;border:0;border-radius:999px;background:linear-gradient(110deg,#635bff,#d946ef);color:#fff;font:700 14px/1.2 system-ui,sans-serif;box-shadow:0 8px 28px rgba(99,91,255,.28);cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
    #studyai-install-app:focus-visible{outline:3px solid #172554;outline-offset:3px}
    #studyai-install-app svg{width:19px;height:19px;flex:none}
    #studyai-install-backdrop{position:fixed;inset:0;z-index:2147483001;background:rgba(15,23,42,.46);display:grid;place-items:center;padding:18px}
    #studyai-install-card{width:min(100%,360px);background:#fff;color:#17213b;border-radius:20px;padding:22px;box-shadow:0 20px 70px rgba(15,23,42,.25);font:15px/1.5 system-ui,sans-serif}
    #studyai-install-card h2{font-size:20px;margin:0 0 9px}
    #studyai-install-card p{margin:0 0 12px}
    #studyai-install-card button{border:0;border-radius:10px;padding:10px 14px;background:#635bff;color:white;font-weight:700;cursor:pointer}
    #studyai-install-close{background:#eef0ff!important;color:#38327d!important;margin-left:8px}
    @media(max-width:600px){#studyai-install-app{left:12px;bottom:max(12px,env(safe-area-inset-bottom));padding:11px 14px;font-size:13px}}
    @media(min-width:1000px){#studyai-install-app{left:22px;bottom:22px}}
  `;
  document.head.appendChild(style);
  const btn = document.createElement('button');
  btn.id = 'studyai-install-app';
  btn.type = 'button';
  btn.setAttribute('aria-label','Install StudyAI app');
  btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12m0 0 4-4m-4 4-4-4"/><path d="M5 17v3h14v-3"/></svg><span>Download StudyAI</span>';
  document.body.appendChild(btn);
  function showHelp(){
    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const mac = /Macintosh|Mac OS X/.test(ua) && !ios;
    const android = /Android/.test(ua);
    let steps = 'Open your browser menu and choose “Install app” or “Create shortcut”, then follow the prompts.';
    if (ios) steps = 'Open this page in Safari, tap Share, then choose “Add to Home Screen”.';
    else if (android) steps = 'Open the browser menu (⋮) and choose “Install app” or “Add to Home screen”.';
    else if (mac) steps = 'In Safari, use File → Add to Dock. In Chrome or Edge, use the install icon in the address bar or browser menu.';
    else if (/Windows|Linux|CrOS/.test(ua)) steps = 'In Chrome or Edge, open the browser menu and choose “Install StudyAI” or “Apps → Install this site as an app”.';
    const backdrop=document.createElement('div');backdrop.id='studyai-install-backdrop';
    backdrop.innerHTML='<section id="studyai-install-card" role="dialog" aria-modal="true" aria-labelledby="studyai-install-title"><h2 id="studyai-install-title">Install StudyAI</h2><p></p><button type="button" id="studyai-install-ok">Got it</button><button type="button" id="studyai-install-close">Close</button></section>';
    backdrop.querySelector('p').textContent=steps;
    const close=()=>backdrop.remove();
    backdrop.querySelector('#studyai-install-ok').addEventListener('click',close);
    backdrop.querySelector('#studyai-install-close').addEventListener('click',close);
    backdrop.addEventListener('click',e=>{if(e.target===backdrop)close()});
    document.body.appendChild(backdrop);
  }
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;});
  window.addEventListener('appinstalled',()=>{btn.remove();});
  btn.addEventListener('click',async()=>{
    if(deferredPrompt){
      deferredPrompt.prompt();
      try{await deferredPrompt.userChoice;}catch(_){}
      deferredPrompt=null;
    }else showHelp();
  });
})();