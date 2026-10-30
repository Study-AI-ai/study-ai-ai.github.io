import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const here = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(here, '..');
const repoRoot = path.resolve(appRoot, '..');
const assetsDir = path.join(appRoot, 'assets');
const logoPath = path.join(repoRoot, 'studyai-logo.svg');

if (!fs.existsSync(logoPath)) {
  throw new Error('studyai-logo.svg is missing from the repository root.');
}

const logo = fs.readFileSync(logoPath, 'utf8');
const pathMatches = [...logo.matchAll(/<path\s+d="([\s\S]*?)"\s+fill="([^"]+)"\s*\/>/g)];
const markPaths = pathMatches
  .filter(match => ['#fff', '#ffdf57', '#e9dbff'].includes(match[2].toLowerCase()))
  .map(match => `<path d="${match[1]}" fill="${match[2]}"/>`);

if (markPaths.length !== 3) {
  throw new Error(`Expected 3 StudyAI logo symbol paths, found ${markPaths.length}.`);
}

fs.mkdirSync(assetsDir, { recursive: true });
const backgroundSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8a7ffa"/><stop offset=".38" stop-color="#a65ce8"/><stop offset="1" stop-color="#f24fac"/></linearGradient></defs>
<rect width="1024" height="1024" fill="url(#bg)"/>
<path d="M0 160 Q24 76 58 0 M0 280 Q18 222 16 156 M946 0 Q982 38 1010 122 M0 910 Q26 884 16 846" fill="none" stroke="#fff" stroke-opacity=".13" stroke-width="6" stroke-linecap="round"/>
</svg>`;
const markSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="524" height="524" viewBox="0 0 524 524">${markPaths.join('')}</svg>`;
const splashSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="2732" height="2732" viewBox="0 0 2732 2732">
<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8a7ffa"/><stop offset=".38" stop-color="#a65ce8"/><stop offset="1" stop-color="#f24fac"/></linearGradient></defs>
<rect width="2732" height="2732" fill="url(#bg)"/>
<g transform="translate(940 940) scale(1.62)">${markPaths.join('')}</g>
</svg>`;

await sharp(Buffer.from(logo)).resize(1024, 1024).png().toFile(path.join(assetsDir, 'icon-only.png'));
await sharp(Buffer.from(markSvg))
  .resize(720, 720, { fit: 'contain' })
  .extend({ top: 152, bottom: 152, left: 152, right: 152, background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toFile(path.join(assetsDir, 'icon-foreground.png'));
await sharp(Buffer.from(backgroundSvg)).png().toFile(path.join(assetsDir, 'icon-background.png'));
await sharp(Buffer.from(splashSvg)).png().toFile(path.join(assetsDir, 'splash.png'));
await sharp(Buffer.from(splashSvg)).png().toFile(path.join(assetsDir, 'splash-dark.png'));

console.log('Generated official StudyAI icon and launch artwork (1024px icons, 2732px splash screens).');
