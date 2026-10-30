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
  'studyai-intro.webp'
];

fs.rmSync(webDir, { recursive: true, force: true });
fs.mkdirSync(webDir, { recursive: true });

for (const name of requiredFiles) {
  const source = path.join(repoRoot, name);
  if (!fs.existsSync(source)) {
    throw new Error(`Required StudyAI website file is missing: ${source}`);
  }
  fs.copyFileSync(source, path.join(webDir, name));
}

const indexPath = path.join(webDir, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

// In the APK, Capacitor provides the app container and install lifecycle.
// Remove the website-only PWA install prompt and manifest link.
html = html.replace('<script src="install.js" defer></script>', '');
html = html.replace('<link rel="manifest" href="manifest.webmanifest">', '');

// This APK contains its own app shell. Do not register the website's
// service worker inside the Capacitor WebView.
html = html.replace(
  "navigator.serviceWorker.register('sw.js').catch(()=>{})",
  ''
);
if (html.includes("navigator.serviceWorker.register('sw.js')")) {
  throw new Error('Could not disable the website service worker in the native app bundle.');
}

fs.writeFileSync(indexPath, html, 'utf8');
console.log('Prepared StudyAI native web bundle from the repository root.');
console.log(`Copied: ${requiredFiles.join(', ')}`);
