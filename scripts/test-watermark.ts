import sharp from 'sharp';
import fs from 'fs';
import { watermarkImageBuffer } from '../lib/watermark';

(async () => {
  const cases: [number, number, string][] = [
    [1200, 800, 'landscape'],
    [600, 1200, 'portrait'],
    [500, 500, 'square'],
    [2000, 500, 'panorama'],
    [300, 200, 'small'],
    [120, 80, 'tiny'],
  ];
  for (const [w, h, name] of cases) {
    const img = await sharp({ create: { width: w, height: h, channels: 3, background: { r: 40, g: 80, b: 120 } } }).jpeg().toBuffer();
    const out = await watermarkImageBuffer(img);
    const meta = await sharp(out).metadata();
    console.log(name, `${w}x${h}`, '→', `${meta.width}x${meta.height}`, 'ok');
    fs.writeFileSync(`wm-${name}.jpg`, out);
  }
})();
