import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';

const frontendRoot = new URL('../', import.meta.url);
const sources = {};
for (const variant of ['production', 'development', 'share-viewer']) {
  const png = await fs.readFile(new URL(`branding/source/${variant}.png`, frontendRoot));
  assert.deepEqual(png.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const width = png.readUInt32BE(16);
  assert.equal(width, png.readUInt32BE(20), 'Source artwork must be square');
  sources[variant] = { width, uri: `data:image/png;base64,${png.toString('base64')}` };
}
const check = process.argv.includes('--check');

function render(size, { variant = 'production', padded = false } = {}) {
  const { width, uri } = sources[variant];
  // The manifest uses the same PWA icon for any and maskable: keep the visible
  // flame inside the central 80% safe circle, on an opaque white background.
  const padding = padded ? width / 8 : 0;
  const extent = width + padding * 2;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${extent}" height="${extent}"
    viewBox="${-padding} ${-padding} ${extent} ${extent}">
    <image width="${width}" height="${width}" href="${uri}" />
  </svg>`;
  return Buffer.from(new Resvg(svg, {
    fitTo: { mode: 'width', value: size },
    background: padded ? '#ffffff' : 'rgba(0, 0, 0, 0)',
  }).render().asPng());
}

function ico(images) {
  // ICO supports embedded PNG images; include native 16/32/48 px variants.
  const header = Buffer.alloc(6 + 16 * images.length);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, png }, index) => {
    const entry = 6 + 16 * index;
    header[entry] = size;
    header[entry + 1] = size;
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(png.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += png.length;
  });
  return Buffer.concat([header, ...images.map(({ png }) => png)]);
}

const prod = render(32);
const dev = render(32, { variant: 'development' });
const share = { variant: 'share-viewer' };
const icons = {
  'favicon.png': prod,
  'favicon_dev.png': dev,
  'apple-touch-icon.png': render(180, { padded: true }),
  'pwa-192.png': render(192, { padded: true }),
  'pwa-512.png': render(512, { padded: true }),
};

const outputs = new Map();
for (const [name, png] of Object.entries(icons)) {
  outputs.set(`public/${name}`, png);
  outputs.set(`../backend/priv/static/${name}`, png);
}
outputs.set('packages/core/favicon.png', dev);
outputs.set('packages/share-viewer/public/favicon.png', render(32, share));
outputs.set('packages/share-viewer/public/favicon.ico', ico(
  [16, 32, 48].map(size => ({ size, png: render(size, share) })),
));
outputs.set('packages/share-viewer/public/apple-touch-icon.png', render(180, { ...share, padded: true }));
outputs.set('../plugins/flambe/assets/flambe.png', render(512));
outputs.set('branding/flambe.png', render(128));

for (const [relativePath, bytes] of outputs) {
  const target = new URL(relativePath, frontendRoot);
  if (check) {
    assert.deepEqual(await fs.readFile(target), bytes, `Regenerate ${fileURLToPath(target)}`);
  } else {
    await fs.writeFile(target, bytes);
  }
}
console.log(`${check ? 'Verified' : 'Generated'} ${outputs.size} branding assets from branding/source/`);
