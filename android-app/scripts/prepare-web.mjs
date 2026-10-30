import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const androidRoot = path.resolve(scriptDir, '..');
const repoRoot = path.resolve(androidRoot, '..');
const webDir = path.join(androidRoot, 'www');

const requiredFiles = [
  'index.html',
  'icon-192.png',
  'icon-512.png',
  'studyai-intro.webp',
  'favicon.ico'
];

fs.rmSync(webDir, { recursive: true, force: true });
fs.mkdirSync(webDir, { recursive: true });

for (const name of requiredFiles) {
  const source = path.join(repoRoot, name);
  if (!fs.existsSync(source)) {
    if (name === 'favicon.ico') {
      console.warn(`Optional asset not found: ${name}`);
      continue;
    }
    throw new Error(`Required StudyAI website file is missing: ${source}`);
  }
  fs.copyFileSync(source, path.join(webDir, name));
}

const indexPath = path.join(webDir, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

// A native Capacitor build must not launch the browser/PWA install prompt.
html = html.replace(/<script\\b[^>]*\\bsrc=["']install\\.js["'][^>]*><\\/script>/gi, '');
html = html.replace(/<link\\b[^>]*\\brel=["']manifest["'][^>]*>/gi, '');

// The native APK runs from its own packaged web bundle. Its offline startup
// must not be intercepted by the website's separate PWA service worker.
html = html.replace(
  /if\\s*\\(\\s*['"]serviceWorker['"]\\s+in\\s+navigator[^)]*\\)\\s*\\)\\s*\\{\\s*navigator\\.serviceWorker\\.register\\(['"]sw\\.js['"]\\)\\.catch\\(\\(\\)\\s*=>\\s*\\{\\s*\\}\\)\\s*\\}\\s*/g,
  ''
);
if (html.includes("navigator.serviceWorker.register('sw.js')")) {
  throw new Error('Could not disable the website service worker in the native app bundle.');
}

fs.writeFileSync(indexPath, html, 'utf8');
console.log('Prepared StudyAI native web bundle from the repository root.');
console.log(`Copied: ${requiredFiles.filter(name => fs.existsSync(path.join(webDir, name))).join(', ')}`);
