/**
 * Генерирует растровые иконки из public/favicon.svg
 * и OG-картинку 1200x630 из public/og.svg.
 *
 * Запуск: node scripts/generate-assets.mjs
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const pub = path.join(process.cwd(), 'public');
const faviconSvg = path.join(pub, 'favicon.svg');
const ogSvg = path.join(pub, 'og.svg');

if (!fs.existsSync(faviconSvg)) {
  console.error('public/favicon.svg not found');
  process.exit(1);
}

const svg = fs.readFileSync(faviconSvg);

const icons = [
  ['favicon-16x16.png', 16],
  ['favicon-32x32.png', 32],
  ['apple-touch-icon.png', 180],
  ['icon-192.png', 192],
  ['icon-512.png', 512],
];

for (const [name, size] of icons) {
  await sharp(svg, { density: 384 })
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(pub, name));
  console.log(`  ${name} (${size}x${size})`);
}

if (fs.existsSync(ogSvg)) {
  await sharp(fs.readFileSync(ogSvg), { density: 144 })
    .resize(1200, 630)
    .png()
    .toFile(path.join(pub, 'og.png'));
  console.log('  og.png (1200x630)');
} else {
  console.warn('  public/og.svg not found — OG image skipped');
}

console.log('assets: done');
