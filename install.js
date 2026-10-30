(function () {
  if (window.__studyAIInstallMenuLoaded) return;
  window.__studyAIInstallMenuLoaded = true;

  const isStandalone = () =>
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

  if (isStandalone()) return;

  let installPrompt = null;
  let selectedDevice = detectDevice();

  function detectDevice() {
    const ua = navigator.userAgent || '';
    const platform = navigator.platform || '';
    const touchMac = platform === 'MacIntel' && navigator.maxTouchPoints > 1;
    if (/iPad|iPhone|iPod/.test(ua) || touchMac) return 'ios';
    if (/Android/.test(ua)) return 'android';
    if (/CrOS/.test(ua)) return 'chromeos';
    if (/Windows/.test(ua)) return 'windows';
    if (/Macintosh|Mac OS X/.test(ua)) return 'mac';
    if (/Linux/.test(ua)) return 'linux';
    return 'other';
  }

  const deviceInfo = {
    android: {
      name: 'Android phone / tablet',
      steps: 'Open this page in Chrome. Tap the three-dot menu (⋮), then choose “Install app” when it appears. Confirm Install.'
    },
    ios: {
      name: 'iPhone / iPad',
      steps: 'Open this page in Safari. Tap Share, choose “Add to Home Screen”, turn on “Open as Web App” if shown, then tap Add.'
    },
    windows: {
      name: 'Windows laptop / desktop',
      steps: 'In Chrome or Edge, open the browser menu and look for “Install StudyAI” or “Install this site as an app”. Confirm the install.'
    },
    mac: {
      name: 'Mac',
      steps: 'In Chrome or Edge, open the browser menu and choose its Install app option. In Safari on macOS Sonoma or later, use Share → Add to Dock.'
    },
    chromeos: {
      name: 'Chromebook',
      steps: 'Open StudyAI in Chrome, open the three-dot menu (⋮), and choose “Install app” when available.'
    },
    linux: {
      name: 'Linux laptop / desktop',
      steps: 'In Chrome or Edge, open the browser menu and choose “Install StudyAI” or “Install this site as an app” when available.'
    },
    other: {
      name: 'Other device',
      steps: 'Open StudyAI in your device’s supported browser menu and look for “Install app”. If your browser does not offer that option, app installation is not supported there yet.'
    }
  };

  const style = document.createElement('style');
  style.textContent = `
    #studyai-download-button{position:fixed;z-index:2147483000;left:18px;bottom:18px;display:flex;align-items:center;justify-content:center;gap:9px;max-width:calc(100vw - 28px);padding:12px 17px;border:0;border-radius:999px;background:linear-gradient(110deg,#635bff,#d946ef);color:#fff;font:700 14px/1.2 system-ui,sans-serif;box-shadow:0 8px 28px rgba(99,91,255,.28);cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
    #studyai-download-button:focus-visible{outline:3px solid #172554;outline-offset:3px}
    #studyai-download-button svg{width:19px;height:19px;flex:none}
    #studyai-download-overlay{position:fixed;inset:0;z-index:2147483001;background:rgba(15,23,42,.52);display:grid;place-items:center;padding:16px;box-sizing:border-box}
    #studyai-download-panel{width:min(100%,520px);max-height:min(86vh,760px);overflow:auto;background:#fff;color:#17213b;border-radius:22px;padding:22px;box-shadow:0 22px 70px rgba(15,23,42,.28);font:15px/1.5 system-ui,sans-serif;box-sizing:border-box}
    #studyai-download-panel *{box-sizing:border-box}
    #studyai-download-panel h2{font-size:21px;line-height:1.25;margin:0 36px 5px 0}
    #studyai-download-panel .studyai-subtitle{color:#64708a;font-size:13px;margin:0 0 17px}
    #studyai-download-panel .studyai-device-title{font-weight:800;font-size:14px;margin:0 0 7px}
    #studyai-download-panel .studyai-steps{border:1px solid #e7e9f2;background:#f8f9ff;border-radius:14px;padding:13px;margin:0 0 14px;min-height:84px}
    #studyai-download-panel .studyai-device-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:12px 0 15px}
    #studyai-download-panel .studyai-device{border:1px solid #e1e5f0;background:#fff;color:#28334f;border-radius:11px;padding:10px 8px;text-align:left;font:600 12px/1.35 system-ui,sans-serif;cursor:pointer;min-height:48px}
    #studyai-download-panel .studyai-device[aria-pressed=true]{border-color:#635bff;background:#f1efff;color:#4136bb;box-shadow:inset 0 0 0 1px #635bff}
    #studyai-download-panel .studyai-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:14px}
    #studyai-download-panel .studyai-primary,#studyai-download-panel .studyai-secondary{border:0;border-radius:11px;padding:11px 15px;font:700 13px system-ui,sans-serif;cursor:pointer}
    #studyai-download-panel .studyai-primary{background:linear-gradient(110deg,#635bff,#d946ef);color:#fff}
    #studyai-download-panel .studyai-secondary{background:#eef0ff;color:#4136bb}
    #studyai-download-panel .studyai-native-note{font-size:11px;color:#788199;margin:13px 0 0}
    #studyai-download-panel .studyai-close{position:absolute;right:17px;top:17px;border:0;background:#f1f2f8;color:#39435d;border-radius:50%;width:34px;height:34px;font-size:20px;cursor:pointer}
    #studyai-download-panel .studyai-panel-head{position:relative}
    @media(max-width:600px){#studyai-download-button{left:12px;bottom:max(12px,env(safe-area-inset-bottom));padding:11px 14px;font-size:13px}#studyai-download-panel{padding:18px;border-radius:18px}#studyai-download-panel .studyai-device-grid{gap:7px}}
    @media(min-width:1000px){#studyai-download-button{left:22px;bottom:22px}}
  `;
  document.head.appendChild(style);

  const button = document.createElement('button');
  button.id = 'studyai-download-button';
  button.type = 'button';
  button.setAttribute('aria-label', 'Download or install StudyAI on this device');
  button.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12m0 0 4-4m-4 4-4-4"/><path d="M5 17v3h14v-3"/></svg><span>Download StudyAI</span>';
  document.body.appendChild(button);

  function showInstallMenu() {
    const previous = document.getElementById('studyai-download-overlay');
    if (previous) previous.remove();

    const overlay = document.createElement('div');
    overlay.id = 'studyai-download-overlay';
    overlay.innerHTML = `
      <section id="studyai-download-panel" role="dialog" aria-modal="true" aria-labelledby="studyai-download-title">
        <div class="studyai-panel-head">
          <button class="studyai-close" type="button" aria-label="Close">×</button>
          <h2 id="studyai-download-title">Download / Install StudyAI</h2>
          <p class="studyai-subtitle">Choose your device. StudyAI will show the supported installation method.</p>
        </div>
        <p class="studyai-device-title" id="studyai-device-title"></p>
        <p class="studyai-steps" id="studyai-device-steps"></p>
        <div class="studyai-device-grid" aria-label="Choose device type">
          <button class="studyai-device" data-device="android" type="button">Android phone / tablet</button>
          <button class="studyai-device" data-device="ios" type="button">iPhone / iPad</button>
          <button class="studyai-device" data-device="windows" type="button">Windows laptop / PC</button>
          <button class="studyai-device" data-device="mac" type="button">Mac</button>
          <button class="studyai-device" data-device="chromeos" type="button">Chromebook</button>
          <button class="studyai-device" data-device="linux" type="button">Linux</button>
        </div>
        <div class="studyai-actions">
          <button class="studyai-primary" id="studyai-install-action" type="button">Install on this device</button>
          <button class="studyai-secondary" id="studyai-download-close" type="button">Close</button>
        </div>
        <p class="studyai-native-note">This uses the device’s supported web-app installation. Separate native APK, EXE and DMG download packages have not been published yet.</p>
      </section>`;

    const title = overlay.querySelector('#studyai-device-title');
    const steps = overlay.querySelector('#studyai-device-steps');
    const action = overlay.querySelector('#studyai-install-action');
    const close = () => overlay.remove();

    function selectDevice(device) {
      selectedDevice = deviceInfo[device] ? device : 'other';
      title.textContent = deviceInfo[selectedDevice].name;
      steps.textContent = deviceInfo[selectedDevice].steps;
      overlay.querySelectorAll('[data-device]').forEach(item => {
        item.setAttribute('aria-pressed', String(item.dataset.device === selectedDevice));
      });
      action.textContent = selectedDevice === detectDevice() && installPrompt
        ? 'Install StudyAI now'
        : 'Show install steps';
    }

    overlay.querySelectorAll('[data-device]').forEach(item => {
      item.addEventListener('click', () => selectDevice(item.dataset.device));
    });
    overlay.querySelector('.studyai-close').addEventListener('click', close);
    overlay.querySelector('#studyai-download-close').addEventListener('click', close);
    overlay.addEventListener('click', event => {
      if (event.target === overlay) close();
    });
    action.addEventListener('click', async () => {
      if (selectedDevice === detectDevice() && installPrompt) {
        const prompt = installPrompt;
        installPrompt = null;
        try {
          await prompt.prompt();
          await prompt.userChoice;
        } catch (error) {
          // The browser may dismiss or reject the install prompt.
        }
        action.textContent = 'Show install steps';
      } else {
        steps.scrollIntoView({block:'nearest', behavior:'smooth'});
      }
    });

    document.body.appendChild(overlay);
    selectDevice(detectDevice());
  }

  button.addEventListener('click', showInstallMenu);

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    installPrompt = event;
  });

  window.addEventListener('appinstalled', () => {
    button.remove();
    const menu = document.getElementById('studyai-download-overlay');
    if (menu) menu.remove();
  });
})();