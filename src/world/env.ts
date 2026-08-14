import * as THREE from 'three';
import { pixelTex } from '../core/tex';

/**
 * Environment texture generators for this take's palette: the human city in
 * warm sodium amber, machine elements in cold teal. Values here are art.
 */

const WARM = '#d9973f';
const COLD = '#79c8d9';

/** A dark facade with sparse sodium windows, grime, and a storefront base. */
export function facadeTex(wPx: number, hPx: number, warmth = 0.75): THREE.CanvasTexture {
  return pixelTex(wPx, hPx, (ctx) => {
    ctx.fillStyle = '#231f1e';
    ctx.fillRect(0, 0, wPx, hPx);
    for (let i = 0; i < wPx * hPx * 0.05; i++) {
      ctx.fillStyle = Math.random() < 0.5 ? '#1b1817' : '#2b2624';
      ctx.globalAlpha = 0.35;
      ctx.fillRect(Math.random() * wPx, Math.random() * hPx, 1.5, 1.5);
    }
    ctx.globalAlpha = 1;
    // parapet
    ctx.fillStyle = '#191615';
    ctx.fillRect(0, 0, wPx, 5);

    // windows
    const winW = 6;
    const winH = 8;
    const gapX = 6;
    const floorH = 15;
    const cols = Math.max(1, Math.floor((wPx - 6) / (winW + gapX)));
    const startX = (wPx - cols * (winW + gapX) + gapX) / 2;
    const groundH = 24;
    for (let fy = 9; fy + winH + 2 < hPx - groundH; fy += floorH) {
      for (let c = 0; c < cols; c++) {
        const wx = startX + c * (winW + gapX);
        ctx.fillStyle = '#100e0e';
        ctx.fillRect(wx - 1, fy - 1, winW + 2, winH + 2);
        const roll = Math.random();
        if (roll < 0.22) {
          ctx.fillStyle = Math.random() < warmth ? WARM : COLD;
          ctx.fillRect(wx, fy, winW, winH);
          ctx.fillStyle = 'rgba(0,0,0,0.4)';
          if (Math.random() < 0.6) ctx.fillRect(wx, fy + winH * 0.55, winW, winH * 0.45);
          if (Math.random() < 0.4) ctx.fillRect(wx + winW * 0.5, fy, winW * 0.5, winH);
        } else {
          ctx.fillStyle = roll < 0.6 ? '#141312' : '#0f0e0d';
          ctx.fillRect(wx, fy, winW, winH);
          ctx.fillStyle = 'rgba(140,120,90,0.1)';
          ctx.fillRect(wx, fy, winW, 2);
        }
        // grime streak below some windows
        if (Math.random() < 0.35) {
          ctx.fillStyle = 'rgba(10,9,8,0.4)';
          ctx.fillRect(wx + Math.random() * winW, fy + winH + 2, 1.5, 4 + Math.random() * 6);
        }
      }
    }
    // drain pipe
    if (Math.random() < 0.5) {
      const px = Math.random() < 0.5 ? 2 : wPx - 4;
      ctx.fillStyle = '#161312';
      ctx.fillRect(px, 5, 2.5, hPx - 5);
    }
    // storefront base — shuttered, dark
    const gy = hPx - groundH;
    ctx.fillStyle = '#1a1716';
    ctx.fillRect(0, gy, wPx, groundH);
    ctx.fillStyle = '#131110';
    for (let sy = gy + 4; sy < hPx - 4; sy += 3) ctx.fillRect(3, sy, wPx - 6, 1);
  });
}

/** Neon sign: bordered housing, halo text with a hot core. */
export function signTex(text: string, color: string, w = 256, h = 76): THREE.CanvasTexture {
  return pixelTex(w, h, (ctx) => {
    ctx.fillStyle = '#070606';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.75;
    ctx.lineWidth = 2;
    ctx.strokeRect(4.5, 4.5, w - 9, h - 9);
    ctx.globalAlpha = 1;
    ctx.font = 'bold 32px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = color;
    ctx.shadowBlur = 13;
    ctx.fillStyle = color;
    ctx.fillText(text, w / 2, h / 2 + 2, w - 22);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, w / 2, h / 2 + 2, w - 22);
  });
}

/** Wet asphalt + sidewalk band with a lit curb. */
export function streetGroundTex(): THREE.CanvasTexture {
  const w = 256;
  const h = 128;
  const t = pixelTex(w, h, (ctx) => {
    // sidewalk (far side, texture top)
    ctx.fillStyle = '#181512';
    ctx.fillRect(0, 0, w, 52);
    ctx.fillStyle = '#110f0d';
    for (let x = 0; x < w; x += 30) ctx.fillRect(x, 0, 1.5, 52);
    for (let i = 0; i < 500; i++) {
      ctx.fillStyle = Math.random() < 0.5 ? '#141210' : '#1d1a16';
      ctx.fillRect(Math.random() * w, Math.random() * 52, 1.5, 1.5);
    }
    // curb — sodium-lit lip
    ctx.fillStyle = '#4d4232';
    ctx.fillRect(0, 52, w, 3);
    ctx.fillStyle = '#060505';
    ctx.fillRect(0, 55, w, 2);
    // asphalt
    ctx.fillStyle = '#0e0d0c';
    ctx.fillRect(0, 57, w, h - 57);
    const shades = ['#0a0909', '#121110', '#171512', '#0c0b0a'];
    for (let i = 0; i < 2400; i++) {
      ctx.fillStyle = shades[(Math.random() * shades.length) | 0];
      ctx.fillRect(Math.random() * w, 57 + Math.random() * (h - 57), 1 + Math.random() * 2, 1 + Math.random());
    }
    // rain-bright flecks
    for (let i = 0; i < 70; i++) {
      ctx.fillStyle = Math.random() < 0.35 ? '#e8d9bc' : '#8f9db0';
      ctx.globalAlpha = 0.35 + Math.random() * 0.5;
      ctx.fillRect(Math.random() * w, 60 + Math.random() * (h - 62), 1.5, 1);
    }
    ctx.globalAlpha = 1;
    // tar patches
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = 'rgba(4,4,4,0.55)';
      ctx.fillRect(Math.random() * w, 62 + Math.random() * (h - 68), 16 + Math.random() * 28, 5 + Math.random() * 8);
    }
  });
  t.wrapS = THREE.RepeatWrapping;
  t.repeat.set(5, 1);
  return t;
}

/** Night sky with a warm smog horizon and dark tower silhouettes. */
export function skyTexFallback(): THREE.CanvasTexture {
  return pixelTex(512, 256, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#05060b');
    g.addColorStop(0.6, '#0d1018');
    g.addColorStop(1, '#2b1c14');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 42; i++) {
      const bw = 8 + Math.random() * 22;
      const bh = 28 + Math.random() * 110;
      const x = Math.random() * w;
      ctx.fillStyle = '#080a10';
      ctx.fillRect(x, h - bh, bw, bh);
      ctx.fillStyle = Math.random() < 0.75 ? '#d9973f' : '#79c8d9';
      const n = Math.floor(bw * bh * 0.003);
      for (let k = 0; k < n; k++) {
        ctx.globalAlpha = 0.35 + Math.random() * 0.5;
        ctx.fillRect(x + 2 + Math.random() * (bw - 4), h - bh + 2 + Math.random() * (bh - 8), 1.5, 1.5);
      }
      ctx.globalAlpha = 1;
    }
  });
}

/** Mid-distance silhouette strip, transparent above the roofline. */
export function midStripTex(): THREE.CanvasTexture {
  const w = 1024;
  const h = 150;
  return pixelTex(w, h, (ctx) => {
    let x = 0;
    while (x < w) {
      const bw = 26 + Math.random() * 56;
      const bh = 34 + Math.random() * 70;
      const top = h - bh;
      const shade = 10 + Math.floor(Math.random() * 5);
      ctx.fillStyle = `rgb(${shade + 3}, ${shade + 2}, ${shade})`;
      ctx.fillRect(x, top, bw, bh);
      ctx.fillStyle = 'rgba(190, 140, 70, 0.2)';
      ctx.fillRect(x, top, 1.5, bh);
      const cols = Math.floor(bw / 7);
      const rows = Math.floor(bh / 9);
      for (let cy = 0; cy < rows; cy++) {
        for (let cx = 0; cx < cols; cx++) {
          if (Math.random() > 0.09) continue;
          ctx.globalAlpha = 0.4 + Math.random() * 0.4;
          ctx.fillStyle = Math.random() < 0.75 ? '#d9973f' : '#79c8d9';
          ctx.fillRect(x + 3 + cx * 7, top + 4 + cy * 9, 2.5, 3);
        }
      }
      ctx.globalAlpha = 1;
      if (Math.random() < 0.6) {
        const ax = x + 4 + Math.random() * (bw - 8);
        const ah = 8 + Math.random() * 16;
        ctx.fillStyle = '#0a0b0e';
        ctx.fillRect(ax, top - ah, 1.5, ah);
      }
      x += bw + (Math.random() < 0.5 ? 4 + Math.random() * 18 : 0);
    }
  });
}

/** Diagonal-striped police cordon tape with tiny lettering. */
export function cordonTapeTex(): THREE.CanvasTexture {
  const t = pixelTex(128, 12, (ctx, w, h) => {
    ctx.fillStyle = '#c8a428';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#141210';
    for (let x = -h; x < w + h; x += 14) {
      ctx.beginPath();
      ctx.moveTo(x, h);
      ctx.lineTo(x + h, 0);
      ctx.lineTo(x + h + 6, 0);
      ctx.lineTo(x + 6, h);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = '#141210';
    ctx.font = 'bold 7px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('NAPD', w * 0.28, 9);
    ctx.fillText('NAPD', w * 0.78, 9);
  });
  t.wrapS = THREE.RepeatWrapping;
  return t;
}

/** Interior wall: damp plaster over brick, warm-dark. */
export function interiorWallTex(wPx: number, hPx: number, base = '#262019'): THREE.CanvasTexture {
  return pixelTex(wPx, hPx, (ctx) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, wPx, hPx);
    for (let i = 0; i < wPx * hPx * 0.1; i++) {
      const v = Math.random();
      ctx.fillStyle = v < 0.5 ? 'rgba(14,11,8,0.2)' : 'rgba(60,50,38,0.14)';
      ctx.fillRect(Math.random() * wPx, Math.random() * hPx, 1.5, 1.5);
    }
    // water stains
    for (let i = 0; i < 7; i++) {
      const x = Math.random() * wPx;
      const y = Math.random() * hPx;
      const r = 14 + Math.random() * 36;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(18,13,9,0.3)');
      g.addColorStop(1, 'rgba(18,13,9,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    // cracks
    ctx.strokeStyle = 'rgba(10,7,5,0.5)';
    ctx.lineWidth = 0.9;
    for (let i = 0; i < 10; i++) {
      ctx.beginPath();
      let x = Math.random() * wPx;
      let y = Math.random() * hPx;
      ctx.moveTo(x, y);
      for (let s = 0; s < 14; s++) {
        x += (Math.random() - 0.5) * 22;
        y += (Math.random() - 0.5) * 22;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    // baseboard
    ctx.fillStyle = '#151009';
    ctx.fillRect(0, hPx - 7, wPx, 7);
  });
}

/** Interior floor: old boards / tiles with paint and grime. */
export function interiorFloorTex(paint = true): THREE.CanvasTexture {
  return pixelTex(256, 256, (ctx) => {
    ctx.fillStyle = '#191410';
    ctx.fillRect(0, 0, 256, 256);
    for (let ty = 0; ty < 256; ty += 26) {
      for (let tx = 0; tx < 256; tx += 26) {
        const s = 18 + Math.floor(Math.random() * 10);
        ctx.fillStyle = `rgb(${s + 6},${s},${s - 4})`;
        ctx.fillRect(tx, ty, 25, 25);
        ctx.fillStyle = 'rgba(6,4,3,0.45)';
        ctx.fillRect(tx, ty, 25, 1);
        ctx.fillRect(tx, ty, 1, 25);
      }
    }
    if (paint) {
      const colors = [
        [168, 62, 48], [58, 84, 132], [150, 118, 44], [64, 110, 84], [120, 52, 96],
      ];
      for (let i = 0; i < 34; i++) {
        const [r, g, b] = colors[(Math.random() * colors.length) | 0];
        ctx.fillStyle = `rgba(${r},${g},${b},${0.14 + Math.random() * 0.2})`;
        const cx = Math.random() * 256;
        const cy = Math.random() * 256;
        ctx.beginPath();
        ctx.arc(cx, cy, 2 + Math.random() * 5, 0, Math.PI * 2);
        ctx.fill();
        if (Math.random() < 0.5) ctx.fillRect(cx, cy, 1, 3 + Math.random() * 7);
      }
    }
    ctx.strokeStyle = 'rgba(6,4,3,0.5)';
    for (let i = 0; i < 7; i++) {
      ctx.beginPath();
      let x = Math.random() * 256;
      let y = Math.random() * 256;
      ctx.moveTo(x, y);
      for (let s = 0; s < 10; s++) {
        x += (Math.random() - 0.5) * 30;
        y += (Math.random() - 0.5) * 30;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  });
}
