/* StudyAI cross-platform branding, touch and rendering polish. */
(function () {
  if (window.__studyAIPolishV1) return;
  window.__studyAIPolishV1 = true;

  const css = `
    html, body, body *, body *::before, body *::after {
      -webkit-tap-highlight-color: transparent !important;
      tap-highlight-color: transparent !important;
    }
    html { background-attachment: scroll !important; }
    body { background-attachment: scroll !important; }
    button, a, [role="button"], input, select, textarea, summary {
      touch-action: manipulation;
    }
    :focus:not(:focus-visible) {
      outline: none !important;
    }
    img { image-rendering: auto; }
    .side .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 2px 8px 16px;
      min-height: 56px;
      font-size: 22px;
      letter-spacing: -.7px;
    }
    .side .studyaiBrandLogo {
      display: block;
      width: 42px;
      height: 42px;
      flex: 0 0 42px;
      object-fit: cover;
      border-radius: 12px;
      box-shadow: 0 5px 15px rgba(8,12,35,.22);
    }
    .side .studyaiBrandText { display: grid; gap: 2px; min-width: 0; }
    .side .studyaiBrandWord {
      color: #fff;
      font-family: Sora, sans-serif;
      font-size: 21px;
      line-height: 1.15;
      font-weight: 850;
      white-space: nowrap;
    }
    .side .studyaiBrandWord i {
      font-style: normal;
      background: linear-gradient(90deg,#ff62ad,#8b8aff);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }
    .side .studyaiBrandText .brandSub { margin-top: 1px; }
    .drawerBrand { display: flex; align-items: center; gap: 9px; min-width: 0; }
    .drawerBrand .studyaiBrandLogo {
      display: block; width: 36px; height: 36px; flex: 0 0 36px;
      object-fit: cover; border-radius: 11px;
    }
    .drawerBrand span { font-weight: 950; }
    #saiInstallSettingsCard .saiInstallSettingsIcon img { display:block; width:100%; height:100%; object-fit:cover; border-radius:11px; }
    #saiInstallDialog .saiInstallLogo img {
      display: block; width: 100%; height: 100%; object-fit: cover;
      border-radius: 14px;
    }
    @media (hover: none), (pointer: coarse) {
      .btn:hover, .click:hover, .stat:hover, .nav a:hover,
      .quickAction:hover, .scCircle:hover, .scMoment:hover,
      .scStoryTile:hover, .fcTools button:hover {
        transform: none !important;
      }
      .btn:hover { box-shadow: 0 8px 18px rgba(99,91,255,.22); }
      .btn:hover::before { transform: translateX(-120%) !important; }
      .card, .heroHome, .appDrawer, .tutorPop {
        -webkit-backdrop-filter: none !important;
        backdrop-filter: none !important;
      }
    }
    @media (max-width: 900px) {
      .card { -webkit-backdrop-filter: none !important; backdrop-filter: none !important; }
    }
    @media (hover: none), (pointer: coarse) {
      /* Keep the colourful look, but avoid repaint-heavy infinite effects on touch devices. */
      .heroHome { animation-duration: 24s !important; }
      .heroHome::before { animation: none !important; }
      .progress span { animation: none !important; }
      .floatTutor { animation-duration: 7s !important; }
      .floatTutor::after { animation: none !important; }
      .aiOrb { animation: none !important; filter: none !important; }
      .tutorHead { animation-duration: 18s !important; }
      #community .scProfileHero { animation: none !important; }
      #community .scProfileHero::after { animation: none !important; }
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
  const style = document.createElement('style');
  style.id = 'studyai-cross-platform-polish';
  style.textContent = css;
  (document.head || document.documentElement).appendChild(style);

  function setBrandImage(img) {
    img.src = './studyai-logo.svg';
    img.alt = 'StudyAI';
    img.width = 42;
    img.height = 42;
    img.decoding = 'async';
  }

  function applyBranding() {
    const sideBrand = document.querySelector('.side .brand');
    if (sideBrand && !sideBrand.querySelector('.studyaiBrandLogo')) {
      const logo = document.createElement('img');
      logo.className = 'studyaiBrandLogo';
      setBrandImage(logo);
      const text = document.createElement('span');
      text.className = 'studyaiBrandText';
      text.innerHTML = '<span class="studyaiBrandWord">Study<i>AI</i></span><span class="brandSub">Student workspace</span>';
      sideBrand.replaceChildren(logo, text);
    }

    const drawerBrand = document.querySelector('.drawerBrand');
    if (drawerBrand && !drawerBrand.querySelector('.studyaiBrandLogo')) {
      const logo = document.createElement('img');
      logo.className = 'studyaiBrandLogo';
      setBrandImage(logo);
      drawerBrand.prepend(logo);
    }

    document.querySelectorAll('link[rel~="icon"]').forEach(link => {
      link.type = 'image/svg+xml';
      link.href = './studyai-logo.svg';
    });
    document.querySelectorAll('.saiInstallLogo, .saiInstallSettingsIcon').forEach(holder => {
      if (holder.querySelector('img')) return;
      const logo = document.createElement('img');
      setBrandImage(logo);
      holder.replaceChildren(logo);
    });
  }

  const queuedImages = new Set();
  let imageFrame = 0;
  function prepareImage(img) {
    if (!img || img.tagName !== 'IMG' || img.dataset.eager === 'true') return;
    if (img.dataset.saiImageReady === '1') return;
    img.dataset.saiImageReady = '1';
    img.decoding = 'async';
    if (!img.loading) {
      const rect = img.getBoundingClientRect();
      if (rect.top > window.innerHeight * 1.35 || rect.bottom < -window.innerHeight) {
        img.loading = 'lazy';
      }
    }
  }
  function queueImages(root) {
    if (!root || root.nodeType !== 1) return;
    if (root.tagName === 'IMG') queuedImages.add(root);
    if (root.querySelectorAll) root.querySelectorAll('img').forEach(img => queuedImages.add(img));
    if (imageFrame) return;
    imageFrame = requestAnimationFrame(() => {
      imageFrame = 0;
      queuedImages.forEach(prepareImage);
      queuedImages.clear();
    });
  }

  function start() {
    applyBranding();
    queueImages(document.documentElement);
    if ('MutationObserver' in window && document.body) {
      const observer = new MutationObserver(records => {
        for (const record of records) {
          for (const node of record.addedNodes) {
            if (node.nodeType === 1) {
              if (node.matches?.('.side .brand,.drawerBrand,.saiInstallLogo') ||
                  node.querySelector?.('.side .brand,.drawerBrand,.saiInstallLogo')) {
                applyBranding();
              }
              queueImages(node);
            }
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