/**
 * Copy extension files to dist folder after build
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

// Ensure dist directory exists
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Copy manifest.json
const manifestSrc = path.join(rootDir, 'manifest.json');
const manifestDest = path.join(distDir, 'manifest.json');
fs.copyFileSync(manifestSrc, manifestDest);
console.log('Copied: manifest.json');

// Copy icons
const iconsSrc = path.join(rootDir, 'public', 'icons');
const iconsDest = path.join(distDir, 'icons');

if (fs.existsSync(iconsSrc)) {
  if (!fs.existsSync(iconsDest)) {
    fs.mkdirSync(iconsDest, { recursive: true });
  }

  const icons = fs.readdirSync(iconsSrc);
  icons.forEach(icon => {
    fs.copyFileSync(
      path.join(iconsSrc, icon),
      path.join(iconsDest, icon)
    );
    console.log(`Copied: icons/${icon}`);
  });
}

// Copy background script
const bgSrc = path.join(rootDir, 'src', 'background', 'background.js');
const bgDestDir = path.join(distDir, 'src', 'background');
const bgDest = path.join(bgDestDir, 'background.js');

if (!fs.existsSync(bgDestDir)) {
  fs.mkdirSync(bgDestDir, { recursive: true });
}
fs.copyFileSync(bgSrc, bgDest);
console.log('Copied: src/background/background.js');

// Copy content script
const contentSrc = path.join(rootDir, 'src', 'content', 'content.js');
const contentDestDir = path.join(distDir, 'src', 'content');
const contentDest = path.join(contentDestDir, 'content.js');

if (!fs.existsSync(contentDestDir)) {
  fs.mkdirSync(contentDestDir, { recursive: true });
}
fs.copyFileSync(contentSrc, contentDest);
console.log('Copied: src/content/content.js');

console.log('');
console.log('Extension build complete!');
console.log('');
console.log('To install in Chrome:');
console.log('1. Open chrome://extensions/');
console.log('2. Enable "Developer mode"');
console.log('3. Click "Load unpacked"');
console.log('4. Select the "dist" folder');
