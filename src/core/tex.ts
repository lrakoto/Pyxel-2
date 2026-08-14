import * as THREE from 'three';

/**
 * Canvas-texture helpers. Every piece of art in the game is generated at
 * runtime from these — the only binary asset is the painted skyline plate.
 */

type Draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => void;

/** Crisp pixel texture: NearestFilter, sRGB, no mipmaps. */
export function pixelTex(w: number, h: number, draw: Draw): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d')!, w, h);
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Smooth-filtered texture for gradients and glows. */
export function softTex(w: number, h: number, draw: Draw): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d')!, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Pixel-map sprite: one character per texel, '.' or ' ' = transparent. */
export function rowsTex(rows: string[], palette: Record<string, string>): THREE.CanvasTexture {
  return pixelTex(rows[0].length, rows.length, (ctx) => {
    rows.forEach((row, y) => {
      [...row].forEach((ch, x) => {
        const color = palette[ch];
        if (color) {
          ctx.fillStyle = color;
          ctx.fillRect(x, y, 1, 1);
        }
      });
    });
  });
}

/** Radial glow sprite in a color, transparent edge. */
export function glowTex(size: number, color: string, coreAlpha = 0.9): THREE.CanvasTexture {
  return softTex(size, size, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 1, w / 2, h / 2, w / 2);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = coreAlpha;
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
}

/**
 * Pixelation pass for the painted skyline plate: downsample with smoothing,
 * posterize, warm-tint, and return as crisp pixels.
 */
export async function platePixelate(
  url: string,
  opts: { width: number; posterize?: number; brightness?: number; tint?: [number, number, number] },
): Promise<THREE.CanvasTexture> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error(`plate failed: ${url}`));
    el.src = url;
  });
  const w = opts.width;
  const h = Math.round(w * (img.height / img.width));
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(img, 0, 0, w, h);

  const levels = opts.posterize ?? 0;
  const bright = opts.brightness ?? 1;
  const tint = opts.tint ?? [1, 1, 1];
  const data = ctx.getImageData(0, 0, w, h);
  const px = data.data;
  const step = levels > 1 ? 255 / (levels - 1) : 0;
  for (let i = 0; i < px.length; i += 4) {
    for (let ch = 0; ch < 3; ch++) {
      let v = px[i + ch] * bright * tint[ch];
      if (levels > 1) v = Math.round(v / step) * step;
      px[i + ch] = Math.min(255, v);
    }
  }
  ctx.putImageData(data, 0, 0);

  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
