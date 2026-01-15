/**
 * Generate extension icons
 * Run with: node scripts/generate-icons.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Icon sizes needed for Chrome extension
const sizes = [16, 32, 48, 128];

const iconsDir = path.join(__dirname, '..', 'public', 'icons');

// Ensure directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

console.log('Creating placeholder icons...');
console.log('Icon directory:', iconsDir);
console.log('');

// Create minimal valid PNG files (1x1 yellow pixel)
// These are placeholders - replace with proper icons for production
sizes.forEach(size => {
  const filename = `icon${size}.png`;
  const filepath = path.join(iconsDir, filename);

  // Minimal valid PNG (1x1 yellow pixel)
  const pngData = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, // IHDR length
    0x49, 0x48, 0x44, 0x52, // IHDR type
    0x00, 0x00, 0x00, 0x01, // width = 1
    0x00, 0x00, 0x00, 0x01, // height = 1
    0x08, 0x02, // bit depth = 8, color type = 2 (RGB)
    0x00, 0x00, 0x00, // compression, filter, interlace
    0x90, 0x77, 0x53, 0xDE, // IHDR CRC
    0x00, 0x00, 0x00, 0x0C, // IDAT length
    0x49, 0x44, 0x41, 0x54, // IDAT type
    0x08, 0xD7, 0x63, 0xF8, 0xDF, 0x9F, 0x01, 0x00, 0x04, 0x18, 0x01, 0x05, // compressed yellow pixel
    0x70, 0x5B, 0xCE, 0x4A, // IDAT CRC
    0x00, 0x00, 0x00, 0x00, // IEND length
    0x49, 0x45, 0x4E, 0x44, // IEND type
    0xAE, 0x42, 0x60, 0x82  // IEND CRC
  ]);

  fs.writeFileSync(filepath, pngData);
  console.log(`Created: ${filename}`);
});

console.log('');
console.log('Done! For production, replace these with proper icons.');
console.log('Recommended: Use a 128x128 duck/flow icon and resize to other sizes.');
