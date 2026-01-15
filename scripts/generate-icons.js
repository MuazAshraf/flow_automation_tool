/**
 * Generate extension icons using canvas
 * Run with: node scripts/generate-icons.js
 */

const fs = require('fs');
const path = require('path');

// Simple PNG generator for solid color icons
function createPNG(size, color = '#FFD93D') {
  // PNG header and IHDR chunk
  const width = size;
  const height = size;

  // Create raw RGBA pixel data
  const pixels = [];
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size * 0.4;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x - centerX;
      const dy = y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= radius) {
        // Inside circle - yellow duck color
        pixels.push(255, 215, 61, 255); // RGBA
      } else {
        // Outside - transparent
        pixels.push(0, 0, 0, 0);
      }
    }
  }

  // For simplicity, we'll create a basic BMP-like structure
  // This is a placeholder - real icons should be created with proper tools
  return Buffer.from(pixels);
}

// Icon sizes needed for Chrome extension
const sizes = [16, 32, 48, 128];

const iconsDir = path.join(__dirname, '..', 'public', 'icons');

// Ensure directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

console.log('Note: This script creates placeholder icons.');
console.log('For production, replace with proper PNG icons (16x16, 32x32, 48x48, 128x128)');
console.log('');
console.log('Icon directory:', iconsDir);
console.log('');

// Create placeholder text files explaining what icons are needed
sizes.forEach(size => {
  const filename = `icon${size}.png`;
  const filepath = path.join(iconsDir, filename);

  // Create a simple 1x1 yellow pixel PNG (minimal valid PNG)
  // This is just a placeholder - replace with real icons
  const pngHeader = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, // IHDR length
    0x49, 0x48, 0x44, 0x52, // IHDR
    0x00, 0x00, 0x00, 0x01, // width = 1
    0x00, 0x00, 0x00, 0x01, // height = 1
    0x08, 0x06, // 8-bit RGBA
    0x00, 0x00, 0x00, // compression, filter, interlace
    0x1F, 0x15, 0xC4, 0x89, // CRC
    0x00, 0x00, 0x00, 0x0A, // IDAT length
    0x49, 0x44, 0x41, 0x54, // IDAT
    0x78, 0x9C, 0x63, 0xFC, 0xCF, 0xC0, 0x00, 0x00, 0x01, 0x69, 0x00, 0x69, // compressed pixel
    0x00, 0x00, 0x00, 0x00, // IEND length
    0x49, 0x45, 0x4E, 0x44, // IEND
    0xAE, 0x42, 0x60, 0x82  // CRC
  ]);

  fs.writeFileSync(filepath, pngHeader);
  console.log(`Created placeholder: ${filename}`);
});

console.log('');
console.log('Done! Replace these with proper icons for production.');
