#!/usr/bin/env node
/**
 * Generates the two exact-size PNGs Amazon requires for Alexa Skill certification.
 *
 * Usage:
 *   node scripts/generate-skill-icons.js [source.png]
 *
 * If no source is provided, falls back to assets/icon.png (or a generated placeholder).
 * Outputs:
 *   public/skill-icon-108.png  (small icon)
 *   public/skill-icon-512.png  (large icon)
 *
 * Both must be square, opaque (no transparency), and PNG.
 * Amazon rejects icons that don't match these constraints exactly.
 *
 * Requires: sharp (npm i --no-save sharp)
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(ROOT, 'public');
const SIZES = [108, 512];
const BRAND_BG = '#131921';  // Amazon Dark — matches app theme

async function main() {
  let sharp;
  try {
    sharp = require('sharp');
  } catch {
    console.error('\n✗ Missing dependency: sharp');
    console.error('  Run: npm install --no-save sharp\n');
    process.exit(1);
  }

  const sourceArg = process.argv[2];
  const candidatePaths = [
    sourceArg,
    path.join(ROOT, 'assets/icon.png'),
    path.join(ROOT, 'assets/adaptive-icon.png'),
  ].filter(Boolean);

  const source = candidatePaths.find(p => fs.existsSync(p));

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  if (!source) {
    console.log('⚠  No source icon found. Generating a placeholder from scratch.');
    console.log('   (Provide one with: node scripts/generate-skill-icons.js path/to/icon.png)\n');
    await generatePlaceholders(sharp);
  } else {
    console.log(`→ Source: ${path.relative(ROOT, source)}\n`);
    await resizeSource(sharp, source);
  }

  console.log('\n✓ Icons written to public/. Ready for Alexa Skill submission.');
  console.log('  Referenced in alexa-skill/skill-package/skill.json as:');
  console.log('    smallIconUri: https://YOUR-DOMAIN/skill-icon-108.png');
  console.log('    largeIconUri: https://YOUR-DOMAIN/skill-icon-512.png');
}

async function resizeSource(sharp, source) {
  for (const size of SIZES) {
    const output = path.join(OUTPUT_DIR, `skill-icon-${size}.png`);
    await sharp(source)
      .resize(size, size, { fit: 'cover', position: 'center' })
      .flatten({ background: BRAND_BG })  // strip transparency (Amazon requirement)
      .png({ compressionLevel: 9 })
      .toFile(output);
    const bytes = fs.statSync(output).size;
    console.log(`  ✓ ${path.relative(ROOT, output)}  ${size}×${size}  ${formatBytes(bytes)}`);
  }
}

async function generatePlaceholders(sharp) {
  // Draw a themed placeholder: rounded square with a stylized remote glyph.
  for (const size of SIZES) {
    const svg = renderPlaceholderSvg(size);
    const output = path.join(OUTPUT_DIR, `skill-icon-${size}.png`);
    await sharp(Buffer.from(svg))
      .flatten({ background: BRAND_BG })
      .png({ compressionLevel: 9 })
      .toFile(output);
    const bytes = fs.statSync(output).size;
    console.log(`  ✓ ${path.relative(ROOT, output)}  ${size}×${size}  ${formatBytes(bytes)}`);
  }
}

function renderPlaceholderSvg(size) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.28;
  const strokeW = Math.max(2, size * 0.02);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#131921"/>
      <stop offset="1" stop-color="#1A2535"/>
    </linearGradient>
    <radialGradient id="ring" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0.7" stop-color="#00CAFF" stop-opacity="0"/>
      <stop offset="1" stop-color="#00CAFF" stop-opacity="0.4"/>
    </radialGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#bg)"/>
  <circle cx="${cx}" cy="${cy}" r="${r * 1.4}" fill="url(#ring)"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#00CAFF" stroke-width="${strokeW}"/>
  <circle cx="${cx}" cy="${cy}" r="${r * 0.35}" fill="#00CAFF"/>
  <circle cx="${cx}" cy="${cy}" r="${r * 0.18}" fill="#131921"/>
  <rect x="${cx - r * 0.06}" y="${cy - r * 0.72}" width="${r * 0.12}" height="${r * 0.2}" fill="#FF9900" rx="${r * 0.03}"/>
</svg>`;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

main().catch(err => {
  console.error('\n✗ Icon generation failed:', err.message);
  process.exit(1);
});
