/* StudyAI install information panel — dashboard + settings */
(function () {
  if (window.__studyAIInstallInfoV2) return;
  window.__studyAIInstallInfoV2 = true;

  const css = '#saiInstallBackdrop{position:fixed;inset:0;z-index:2147483001;display:grid;place-items:center;padding:16px;background:rgba(8,12,35,.68);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);opacity:0;visibility:hidden;transition:opacity .22s ease,visibility .22s ease}#saiInstallBackdrop.open{opacity:1;visibility:visible}#saiInstallDialog{position:relative;width:min(720px,100%);max-height:min(90vh,850px);overflow:auto;border:1px solid rgba(255,255,255,.65);border-radius:26px;background:linear-gradient(150deg,#fff 0%,#f7f6ff 58%,#fff4fa 100%);color:#19213b;box-shadow:0 30px 100px rgba(0,0,0,.35);font:14px/1.5 system-ui,-apple-system,Segoe UI,sans-serif;transform:translateY(12px) scale(.985);transition:transform .22s ease}#saiInstallBackdrop.open #saiInstallDialog{transform:translateY(0) scale(1)}#saiInstallDialog .saiInstallHero{position:relative;overflow:hidden;padding:23px 24px 21px;background:linear-gradient(115deg,#5148ed,#8064ff 52%,#ec4899);color:#fff}#saiInstallDialog .saiInstallHero:after{content:"";position:absolute;width:190px;height:190px;right:-55px;top:-100px;border:1px solid #ffffff40;border-radius:50%;box-shadow:0 0 0 22px #ffffff10,0 0 0 44px #ffffff0b}#saiInstallDialog .saiInstallHeroRow{position:relative;z-index:1;display:flex;align-items:center;gap:13px;padding-right:40px}#saiInstallDialog .saiInstallLogo{width:52px;height:52px;flex:0 0 52px;display:grid;place-items:center;border:1px solid #ffffff55;border-radius:17px;background:#ffffff25;font-size:27px;box-shadow:inset 0 1px #ffffff55}#saiInstallDialog h2{margin:0;font-size:clamp(20px,4vw,27px);letter-spacing:-.55px;color:#fff}#saiInstallDialog .saiInstallSub{margin:3px 0 0;color:#f1edff;font-size:12px}#saiInstallDialog .saiInstallClose{position:absolute;z-index:2;right:15px;top:15px;width:37px;height:37px;border:1px solid #ffffff55;border-radius:12px;background:#ffffff20;color:#fff;font-size:23px;cursor:pointer}#saiInstallDialog .saiInstallBody{padding:20px 23px 22px}#saiInstallDialog .saiInstallStatus{display:flex;align-items:flex-start;gap:10px;padding:12px 13px;border:1px solid #f0dca7;border-radius:14px;background:#fff9e9;color:#75540c;font-size:12px;line-height:1.5}#saiInstallDialog .saiInstallStatus b{display:block;margin-bottom:2px;color:#654600}#saiInstallDialog .saiInstallSectionTitle{display:flex;align-items:center;gap:8px;margin:17px 0 9px;color:#5147c8;font-size:11px;font-weight:950;letter-spacing:1.15px;text-transform:uppercase}#saiInstallDialog .saiInstallFeatures{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}#saiInstallDialog .saiInstallFeature{min-width:0;padding:11px 9px;border:1px solid #e9e7fb;border-radius:13px;background:#fff;text-align:center}#saiInstallDialog .saiInstallFeature span{display:block;margin-bottom:5px;font-size:21px}#saiInstallDialog .saiInstallFeature b{display:block;font-size:11px;color:#2d3150}#saiInstallDialog .saiInstallFeature small{display:block;margin-top:3px;color:#788098;font-size:9px;line-height:1.35}#saiInstallDialog .saiInstallSplit{display:grid;grid-template-columns:1fr 1fr;gap:10px}#saiInstallDialog .saiInstallPanel{padding:13px;border:1px solid #e6e9f3;border-radius:15px;background:#fff}#saiInstallDialog .saiInstallPanel.online{border-color:#d9d6ff;background:linear-gradient(145deg,#fff,#f5f3ff)}#saiInstallDialog .saiInstallPanel.offline{border-color:#cceee0;background:linear-gradient(145deg,#fff,#f0fff8)}#saiInstallDialog .saiInstallPanel h3{display:flex;align-items:center;gap:7px;margin:0 0 8px;color:#27304d;font-size:14px}#saiInstallDialog .saiInstallPanel ul{margin:0;padding-left:17px;color:#59647d;font-size:11px;line-height:1.65}#saiInstallDialog .saiInstallPanel li{margin:3px 0}#saiInstallDialog .saiInstallFoot{margin:12px 0 0;padding:11px 12px;border-radius:13px;background:#eff1fa;color:#5f6880;font-size:10.5px;line-height:1.55}#saiInstallDialog .saiInstallActions{display:flex;justify-content:flex-end;gap:9px;flex-wrap:wrap;margin-top:15px}#saiInstallDialog .saiInstallActions button,#saiInstallDialog .saiInstallActions a{min-height:42px;padding:10px 16px;border:0;border-radius:12px;font:800 12px system-ui;cursor:pointer}#saiInstallDialog .saiInstallDisabled{background:#e8e9f0;color:#737b91;cursor:not-allowed!important}#saiInstallDialog .saiInstallDone{display:inline-flex;align-items:center;justify-content:center;text-decoration:none;background:linear-gradient(110deg,#635bff,#9b55e8,#e84b9c);color:#fff;box-shadow:0 7px 18px #635bff35}.saiInstallEntry{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:38px;padding:8px 13px;border:1px solid rgba(255,255,255,.42);border-radius:999px;background:linear-gradient(120deg,#635bff,#8b5cf6 55%,#ff4fa3);color:#fff;font:850 12px/1.2 system-ui,-apple-system,Segoe UI,sans-serif;box-shadow:0 7px 18px rgba(80,70,210,.24);cursor:pointer;white-space:nowrap;transition:transform .18s,box-shadow .18s}.saiInstallEntry:hover{transform:translateY(-2px);box-shadow:0 11px 24px rgba(80,70,210,.32)}.saiInstallEntry:focus-visible{outline:3px solid #fbbf24;outline-offset:3px}.heroActions .saiInstallEntry{border-color:rgba(255,255,255,.42);background:linear-gradient(120deg,#fff,#f5f0ff);color:#5447ce;box-shadow:0 7px 18px rgba(40,35,120,.16)}#saiInstallSettingsCard{position:relative;overflow:hidden;margin-top:14px;padding:18px;border:1px solid rgba(99,91,255,.17);border-radius:19px;background:radial-gradient(circle at 100% 0%,rgba(255,79,163,.12),transparent 34%),linear-gradient(125deg,#fff,#f8f7ff);box-shadow:0 12px 30px rgba(45,45,100,.07)}#saiInstallSettingsCard .saiInstallSettingsTop{display:flex;align-items:center;gap:12px;margin-bottom:12px}#saiInstallSettingsCard .saiInstallSettingsIcon{width:44px;height:44px;flex:0 0 44px;display:grid;place-items:center;border-radius:14px;background:linear-gradient(135deg,#635bff,#a855f7,#ff4fa3);color:#fff;font-size:22px;box-shadow:0 7px 18px #635bff35}#saiInstallSettingsCard h3{margin:0 0 3px;font-size:17px;color:#242044}#saiInstallSettingsCard p{margin:0;color:#68738a;font-size:12px;line-height:1.55}#saiInstallSettingsCard .saiInstallSettingsRow{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}@media(max-width:600px){.heroActions .saiInstallEntry{min-height:34px;padding:7px 10px;font-size:11px}#saiInstallSettingsCard{padding:14px}#saiInstallDialog{max-height:92vh;border-radius:21px}#saiInstallDialog .saiInstallHero{padding:19px 17px}#saiInstallDialog .saiInstallBody{padding:15px}#saiInstallDialog .saiInstallFeatures{grid-template-columns:repeat(2,minmax(0,1fr))}#saiInstallDialog .saiInstallSplit{grid-template-columns:1fr}#saiInstallDialog .saiInstallStatus{font-size:11px}}@media(prefers-reduced-motion:reduce){#saiInstallBackdrop,#saiInstallDialog,.saiInstallEntry{transition:none!important}}';
  const style = document.createElement('style');
  style.id = 'saiInstallInfoStyles';
  style.textContent = css;
  (document.head || document.documentElement).appendChild(style);

  let dialog = null;
  let lastTrigger = null;

  function closeDialog() {
    if (!dialog) return;
    dialog.classList.remove('open');
    document.body.style.overflow = '';
    if (lastTrigger && lastTrigger.isConnected) lastTrigger.focus();
  }

  function buildDialog() {
    dialog = document.createElement('div');
    dialog.id = 'saiInstallBackdrop';
    dialog.innerHTML = '<section id="saiInstallDialog" role="dialog" aria-modal="true" aria-labelledby="saiInstallTitle" aria-describedby="saiInstallDescription"><div class="saiInstallHero"><button class="saiInstallClose" type="button" aria-label="Close">×</button><div class="saiInstallHeroRow"><span class="saiInstallLogo" aria-hidden="true">✦</span><div><h2 id="saiInstallTitle">StudyAI App</h2><p class="saiInstallSub" id="saiInstallDescription">Your learning space for Classes 6–12 · Phone & tablet</p></div></div></div><div class="saiInstallBody"><div class="saiInstallStatus"><span aria-hidden="true">📦</span><div><b>Android APK is ready</b>The real Android installer is available. Download the APK, open it from your downloads, and follow the Android installation screen. This is a debug-signed test build, not a Play Store release.</div></div><div class="saiInstallSectionTitle">✨ What you can use in StudyAI</div><div class="saiInstallFeatures"><div class="saiInstallFeature"><span>🤖</span><b>AI Tutor</b><small>Ask questions & get explanations</small></div><div class="saiInstallFeature"><span>📚</span><b>Study Notes</b><small>Revise saved topics</small></div><div class="saiInstallFeature"><span>🧠</span><b>Quiz & Flashcards</b><small>Practise and remember</small></div><div class="saiInstallFeature"><span>📝</span><b>Chapter Papers</b><small>Prepare for tests</small></div><div class="saiInstallFeature"><span>📖</span><b>NCERT Library</b><small>Open learning resources</small></div><div class="saiInstallFeature"><span>👥</span><b>Community</b><small>Posts, profiles & messages</small></div><div class="saiInstallFeature"><span>🎯</span><b>Focus Tools</b><small>Goals and study planning</small></div><div class="saiInstallFeature"><span>💾</span><b>Saved Progress</b><small>Data stored on this device</small></div></div><div class="saiInstallSectionTitle">🌐 What needs internet?</div><div class="saiInstallSplit"><div class="saiInstallPanel online"><h3>🌐 Internet required</h3><ul><li>AI Tutor and AI-generated notes, quizzes or flashcards</li><li>AI photo-question solving and other online AI requests</li><li>Community posts, stories, messages and account sign-in</li><li>Cloud account sync, subscription checks and online payment</li><li>New external NCERT files, images, fonts and linked resources</li></ul></div><div class="saiInstallPanel offline"><h3>📴 Can work offline</h3><ul><li>Open the app shell and pages already cached on this device</li><li>View locally saved class, settings and study preferences</li><li>Use saved notes, flashcards, goals and progress stored on-device</li><li>Use quiz material already included or saved on the device</li><li>Export or restore a local backup file</li></ul></div></div><p class="saiInstallFoot"><b>Important:</b> Offline access is limited. Only cached pages and data already saved on this device can be used without internet. Fresh AI answers, cloud/community data and uncached resources will not load. Installing the future APK will open StudyAI as its own app; it will still need internet for online features.</p><div class="saiInstallActions"><a class="saiInstallDone saiInstallDownload" href="https://github.com/Study-AI-ai/study-ai-ai.github.io/releases/latest/download/StudyAI.apk" rel="noopener">⬇ Download Android APK · 5.8 MB</a><button class="saiInstallDone" type="button">Got it</button></div></div></section>';
    document.body.appendChild(dialog);
    dialog.querySelector('.saiInstallClose').addEventListener('click', closeDialog);
    dialog.querySelector('.saiInstallDone').addEventListener('click', closeDialog);
    dialog.addEventListener('click', function (event) {
      if (event.target === dialog) closeDialog();
    });
  }

  function openDialog(event) {
    if (!dialog || !dialog.isConnected) buildDialog();
    lastTrigger = event && event.currentTarget ? event.currentTarget : null;
    dialog.classList.add('open');
    document.body.style.overflow = 'hidden';
    const closeButton = dialog.querySelector('.saiInstallClose');
    if (closeButton) closeButton.focus();
  }

  function makeButton(place) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'saiInstallEntry';
    button.innerHTML = '<span aria-hidden="true">📲</span><span>Install StudyAI</span>';
    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-controls', 'saiInstallBackdrop');
    button.dataset.saiInstallPlace = place;
    button.addEventListener('click', openDialog);
    return button;
  }

  function mountDashboardButton() {
    const accent = document.getElementById('saiAccentBox');
    if (!accent || document.querySelector('[data-sai-install-place="dashboard"]')) return;
    accent.insertAdjacentElement('afterend', makeButton('dashboard'));
  }

  function mountSettingsCard() {
    const settings = document.getElementById('settings');
    if (!settings || document.getElementById('saiInstallSettingsCard')) return;
    const heading = settings.querySelector('.top');
    const card = document.createElement('div');
    card.id = 'saiInstallSettingsCard';
    card.innerHTML = '<div class="saiInstallSettingsTop"><span class="saiInstallSettingsIcon" aria-hidden="true">📲</span><div><h3>StudyAI App</h3><p>Install guide, offline access and app features for your Android phone or tablet.</p></div></div><div class="saiInstallSettingsRow"><p>Android APK: <b style="color:#16834a">Ready · 5.8 MB</b></p><button type="button" class="saiInstallEntry" data-sai-install-place="settings"><span aria-hidden="true">✨</span><span>App install details</span></button></div>';
    if (heading) heading.insertAdjacentElement('afterend', card);
    else settings.insertAdjacentElement('afterbegin', card);
    card.querySelector('button').addEventListener('click', openDialog);
  }

  function mount() {
    mountDashboardButton();
    mountSettingsCard();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount, { once: true });
  } else {
    mount();
  }
  // Both the dashboard accent box and Settings section exist in the initial document.
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && dialog && dialog.classList.contains('open')) closeDialog();
  });
})();

/* Load the shared touch/branding polish on website and standalone web app. */
(function(){
  if (document.querySelector('script[data-studyai-polish-loader]')) return;
  const script = document.createElement('script');
  script.src = './app-polish.js';
  script.defer = true;
  script.dataset.studyaiPolishLoader = '1';
  (document.head || document.documentElement).appendChild(script);
})();
