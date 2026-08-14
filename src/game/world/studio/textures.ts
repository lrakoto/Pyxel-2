import * as THREE from 'three';
import { canvasTexture } from '../../../engine/textures';

/**
 * Procedural textures for Marlon Graves' studio interior — walls, floor,
 * the "Everybody/Nobody" painting, unfinished canvases, the neural device,
 * the chalk body outline, and the wall writing.
 */

/** Cracked concrete wall with exposed brick patches, conduit, and water stains. */
export function wallTexture(wPx: number, hPx: number): THREE.CanvasTexture {
  return canvasTexture(wPx, hPx, (ctx) => {
    // Base — damp concrete, warm dark
    ctx.fillStyle = '#2a2520';
    ctx.fillRect(0, 0, wPx, hPx);

    // Concrete noise — fine grain
    for (let i = 0; i < wPx * hPx * 0.12; i++) {
      const v = Math.random();
      const shade = v < 0.5
        ? `rgba(18,15,12,${0.15 + Math.random() * 0.25})`
        : `rgba(55,48,40,${0.1 + Math.random() * 0.15})`;
      ctx.fillStyle = shade;
      ctx.fillRect(Math.random() * wPx, Math.random() * hPx, 1.5, 1.5);
    }

    // Exposed brick patches — where the concrete has crumbled
    for (let patch = 0; patch < 4; patch++) {
      const px = Math.random() * wPx;
      const py = Math.random() * hPx;
      const pw = 20 + Math.random() * 40;
      const ph = 15 + Math.random() * 30;
      for (let by = 0; by < ph; by += 5) {
        for (let bx = 0; bx < pw; bx += 10) {
          const r = 45 + Math.random() * 15;
          const g = 25 + Math.random() * 10;
          const b = 18 + Math.random() * 8;
          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.fillRect(px + bx, py + by, 9, 4);
          ctx.fillStyle = `rgba(20,12,8,0.4)`;
          ctx.fillRect(px + bx, py + by + 4, 9, 1);
        }
      }
    }

    // Cracks — deeper, more branching
    ctx.strokeStyle = 'rgba(12,8,6,0.55)';
    ctx.lineWidth = 0.9;
    for (let i = 0; i < 12; i++) {
      ctx.beginPath();
      let x = Math.random() * wPx;
      let y = Math.random() * hPx;
      ctx.moveTo(x, y);
      for (let s = 0; s < 16; s++) {
        x += (Math.random() - 0.5) * 25;
        y += (Math.random() - 0.5) * 25;
        ctx.lineTo(x, y);
        // Occasional branch
        if (Math.random() < 0.2) {
          ctx.moveTo(x, y);
          ctx.lineTo(x + (Math.random() - 0.5) * 10, y + (Math.random() - 0.5) * 10);
          ctx.moveTo(x, y);
        }
      }
      ctx.stroke();
    }

    // Water stains — multiple layers for depth
    for (let i = 0; i < 8; i++) {
      const x = Math.random() * wPx;
      const y = Math.random() * hPx;
      const r = 15 + Math.random() * 40;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(25,18,12,0.35)');
      g.addColorStop(0.5, 'rgba(25,18,12,0.15)');
      g.addColorStop(1, 'rgba(25,18,12,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }

    // Electrical conduit — horizontal run near the top
    ctx.fillStyle = '#1a1612';
    ctx.fillRect(0, 20, wPx, 4);
    ctx.fillStyle = '#2a2620';
    ctx.fillRect(0, 20, wPx, 1);
    // Conduit brackets
    for (let bx = 30; bx < wPx; bx += 40) {
      ctx.fillStyle = '#0a0806';
      ctx.fillRect(bx, 18, 3, 8);
    }

    // Baseboard strip at the bottom
    ctx.fillStyle = '#15110d';
    ctx.fillRect(0, hPx - 8, wPx, 8);
    ctx.fillStyle = '#1f1a14';
    ctx.fillRect(0, hPx - 8, wPx, 2);
  });
}

/** Cracked tile floor with paint splatters, dust, and debris. */
export function floorTexture(wPx: number, hPx: number): THREE.CanvasTexture {
  return canvasTexture(wPx, hPx, (ctx) => {
    // Base
    ctx.fillStyle = '#1c1815';
    ctx.fillRect(0, 0, wPx, hPx);

    // Tile grid — irregular, aged
    const tileW = 28;
    const tileH = 28;
    for (let ty = 0; ty < hPx; ty += tileH) {
      for (let tx = 0; tx < wPx; tx += tileW) {
        const shade = 22 + Math.floor(Math.random() * 12);
        ctx.fillStyle = `rgb(${shade},${shade - 2},${shade - 5})`;
        ctx.fillRect(tx, ty, tileW - 1, tileH - 1);
        // Tile edge darkening
        ctx.fillStyle = 'rgba(8,5,3,0.4)';
        ctx.fillRect(tx, ty, tileW - 1, 1);
        ctx.fillRect(tx, ty, 1, tileH - 1);
        // Grime buildup in corners
        if (Math.random() < 0.4) {
          ctx.fillStyle = `rgba(12,8,5,${0.3 + Math.random() * 0.2})`;
          ctx.fillRect(tx + tileW - 6, ty + tileH - 6, 5, 5);
        }
        // Fine dust
        if (Math.random() < 0.15) {
          for (let d = 0; d < 3; d++) {
            ctx.fillStyle = `rgba(${30 + Math.random() * 10},${25 + Math.random() * 8},${18 + Math.random() * 5},0.15)`;
            ctx.fillRect(tx + Math.random() * tileW, ty + Math.random() * tileH, 2, 2);
          }
        }
      }
    }

    // Paint splatters — this is an art studio
    const splatterColors = [
      [180, 60, 50], [60, 80, 140], [140, 50, 80], [180, 120, 40],
      [50, 120, 80], [120, 40, 100], [200, 80, 60],
    ];
    for (let i = 0; i < 40; i++) {
      const cx = Math.random() * wPx;
      const cy = Math.random() * hPx;
      const color = splatterColors[Math.floor(Math.random() * splatterColors.length)];
      const alpha = 0.15 + Math.random() * 0.25;
      ctx.fillStyle = `rgba(${color[0]},${color[1]},${color[2]},${alpha})`;
      // Main splat
      ctx.beginPath();
      ctx.arc(cx, cy, 2 + Math.random() * 5, 0, Math.PI * 2);
      ctx.fill();
      // Drip
      if (Math.random() < 0.5) {
        ctx.fillRect(cx, cy, 1, 3 + Math.random() * 8);
      }
      // Secondary droplets
      for (let d = 0; d < 3; d++) {
        const dx = cx + (Math.random() - 0.5) * 15;
        const dy = cy + (Math.random() - 0.5) * 15;
        ctx.beginPath();
        ctx.arc(dx, dy, 1 + Math.random() * 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Cracks — deeper and more varied
    ctx.strokeStyle = 'rgba(8,5,3,0.6)';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      let x = Math.random() * wPx;
      let y = Math.random() * hPx;
      ctx.moveTo(x, y);
      for (let s = 0; s < 12; s++) {
        x += (Math.random() - 0.5) * 35;
        y += (Math.random() - 0.5) * 35;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Broken tile — a few tiles with chunks missing
    for (let i = 0; i < 6; i++) {
      const tx = Math.floor(Math.random() * (wPx / tileW)) * tileW;
      const ty = Math.floor(Math.random() * (hPx / tileH)) * tileH;
      ctx.fillStyle = '#080604';
      ctx.fillRect(tx + 5, ty + 5, 8 + Math.random() * 10, 8 + Math.random() * 10);
    }
  });
}

/**
 * The "Everybody/Nobody" painting — the story's central artifact.
 * Dozens of fragmented faces dissolving into neural traces, with a
 * luminous convergence point and the title scratched into the canvas.
 */
export function everybodyNobodyTexture(): THREE.CanvasTexture {
  return canvasTexture(256, 192, (ctx) => {
    // Dark canvas background — aged, varnished
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 192);
    bgGrad.addColorStop(0, '#0a0810');
    bgGrad.addColorStop(0.5, '#0e0a14');
    bgGrad.addColorStop(1, '#080610');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 256, 192);

    // Fractured face fragments — each "face" is a cluster of strokes
    const faceColors = [
      { skin: [140, 110, 90], hair: [40, 30, 25], glow: [100, 180, 255] },
      { skin: [120, 95, 80], hair: [60, 40, 30], glow: [180, 100, 255] },
      { skin: [100, 85, 70], hair: [30, 25, 20], glow: [100, 220, 180] },
      { skin: [150, 120, 95], hair: [80, 50, 30], glow: [255, 180, 100] },
      { skin: [90, 75, 65], hair: [20, 18, 15], glow: [200, 120, 255] },
    ];

    // Draw ~50 fragmented faces at various sizes and positions
    for (let i = 0; i < 50; i++) {
      const cx = Math.random() * 256;
      const cy = Math.random() * 192;
      const size = 8 + Math.random() * 28;
      const pal = faceColors[Math.floor(Math.random() * faceColors.length)];
      const alpha = 0.2 + Math.random() * 0.35;
      const angle = Math.random() * Math.PI * 2;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);

      // Face fragment — an irregular shard of skin-tone
      ctx.fillStyle = `rgba(${pal.skin[0]},${pal.skin[1]},${pal.skin[2]},${alpha})`;
      ctx.beginPath();
      ctx.moveTo(-size * 0.4, -size * 0.5);
      ctx.lineTo(size * 0.4, -size * 0.3);
      ctx.lineTo(size * 0.5, size * 0.4);
      ctx.lineTo(-size * 0.3, size * 0.5);
      ctx.closePath();
      ctx.fill();

      // Sometimes a hint of an eye — just a dark dot
      if (Math.random() < 0.4) {
        ctx.fillStyle = `rgba(10,8,6,${alpha * 0.8})`;
        ctx.beginPath();
        ctx.arc(-size * 0.1, -size * 0.1, 1.5, 0, Math.PI * 2);
        ctx.fill();
        // Iris hint — a tiny glow
        ctx.fillStyle = `rgba(${pal.glow[0]},${pal.glow[1]},${pal.glow[2]},${alpha * 0.5})`;
        ctx.beginPath();
        ctx.arc(-size * 0.1, -size * 0.1, 0.8, 0, Math.PI * 2);
        ctx.fill();
      }

      // Sometimes a mouth — a darker stroke
      if (Math.random() < 0.3) {
        ctx.strokeStyle = `rgba(${pal.skin[0] - 40},${pal.skin[1] - 30},${pal.skin[2] - 25},${alpha * 0.6})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(-size * 0.15, size * 0.2);
        ctx.lineTo(size * 0.15, size * 0.2);
        ctx.stroke();
      }

      // Hair fragment — darker patch at top
      if (Math.random() < 0.35) {
        ctx.fillStyle = `rgba(${pal.hair[0]},${pal.hair[1]},${pal.hair[2]},${alpha * 0.7})`;
        ctx.fillRect(-size * 0.3, -size * 0.5, size * 0.6, size * 0.15);
      }

      ctx.restore();
    }

    // Neural traces — thin glowing lines connecting fragments, like a neural map
    ctx.lineCap = 'round';
    for (let i = 0; i < 30; i++) {
      const x1 = Math.random() * 256;
      const y1 = Math.random() * 192;
      const x2 = x1 + (Math.random() - 0.5) * 60;
      const y2 = y1 + (Math.random() - 0.5) * 60;
      const glowAlpha = 0.08 + Math.random() * 0.1;
      // Outer glow
      ctx.strokeStyle = `rgba(80,150,255,${glowAlpha * 0.5})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.bezierCurveTo(x1 + 10, y1 - 5, x2 - 10, y2 + 5, x2, y2);
      ctx.stroke();
      // Core line
      ctx.strokeStyle = `rgba(120,200,255,${glowAlpha})`;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.bezierCurveTo(x1 + 10, y1 - 5, x2 - 10, y2 + 5, x2, y2);
      ctx.stroke();
    }

    // Bright nodes — where neural traces converge
    for (let i = 0; i < 15; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 192;
      const g = ctx.createRadialGradient(x, y, 0, x, y, 4);
      g.addColorStop(0, 'rgba(150,220,255,0.4)');
      g.addColorStop(0.5, 'rgba(80,150,255,0.15)');
      g.addColorStop(1, 'rgba(80,150,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - 4, y - 4, 8, 8);
    }

    // Central "convergence" — the painting's focal point where fragments merge
    const cgx = 128;
    const cgy = 90;
    const cg = ctx.createRadialGradient(cgx, cgy, 5, cgx, cgy, 40);
    cg.addColorStop(0, 'rgba(100,180,255,0.12)');
    cg.addColorStop(0.5, 'rgba(80,120,200,0.05)');
    cg.addColorStop(1, 'rgba(80,120,200,0)');
    ctx.fillStyle = cg;
    ctx.fillRect(cgx - 40, cgy - 40, 80, 80);

    // Title scratched into the canvas — small, at the bottom
    ctx.fillStyle = 'rgba(200,200,210,0.5)';
    ctx.font = '7px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('EVERYBODY / NOBODY', 128, 185);
    ctx.textAlign = 'left';

    // Varnish cracks — aging on the painting surface
    ctx.strokeStyle = 'rgba(40,30,25,0.15)';
    ctx.lineWidth = 0.3;
    for (let i = 0; i < 20; i++) {
      ctx.beginPath();
      let x = Math.random() * 256;
      let y = Math.random() * 192;
      ctx.moveTo(x, y);
      for (let s = 0; s < 6; s++) {
        x += (Math.random() - 0.5) * 20;
        y += (Math.random() - 0.5) * 20;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  });
}

/** An unfinished painting on an easel — two variants of urgent brushwork. */
export function unfinishedPainting(variant: number): THREE.CanvasTexture {
  return canvasTexture(80, 100, (ctx) => {
    // Canvas base — raw, slightly stained
    ctx.fillStyle = '#1a1614';
    ctx.fillRect(0, 0, 80, 100);
    // Canvas texture
    for (let i = 0; i < 200; i++) {
      ctx.fillStyle = `rgba(40,35,30,${Math.random() * 0.1})`;
      ctx.fillRect(Math.random() * 80, Math.random() * 100, 1, 1);
    }

    if (variant === 0) {
      // Face dissolving into light — warmer palette
      ctx.fillStyle = 'rgba(80,60,50,0.2)';
      ctx.fillRect(10, 15, 60, 70);

      // Face strokes — a woman's profile emerging then dissolving
      for (let i = 0; i < 35; i++) {
        const x = 10 + Math.random() * 60;
        const y = 15 + Math.random() * 70;
        const w = 3 + Math.random() * 12;
        const h = 2 + Math.random() * 6;
        const r = 100 + Math.random() * 60;
        const g = 70 + Math.random() * 40;
        const b = 60 + Math.random() * 40;
        const alpha = 0.2 + Math.random() * 0.3;
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        // Brush stroke — slightly directional
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(Math.random() * 0.5 - 0.25);
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
      }
      // Dissolution — light particles at the edge
      for (let i = 0; i < 15; i++) {
        const x = 50 + Math.random() * 30;
        const y = 20 + Math.random() * 60;
        ctx.fillStyle = `rgba(200,180,150,${0.1 + Math.random() * 0.2})`;
        ctx.beginPath();
        ctx.arc(x, y, 1 + Math.random() * 2, 0, Math.PI * 2);
        ctx.fill();
      }
      // Unfinished bottom — raw canvas
      ctx.fillStyle = '#1a1614';
      ctx.fillRect(0, 75, 80, 25);
    } else {
      // Cityscape of faces — darker, cooler
      for (let i = 0; i < 40; i++) {
        const x = Math.random() * 80;
        const y = Math.random() * 100;
        const w = 3 + Math.random() * 10;
        const h = 2 + Math.random() * 8;
        const r = 40 + Math.random() * 30;
        const g = 40 + Math.random() * 30;
        const b = 50 + Math.random() * 40;
        const alpha = 0.2 + Math.random() * 0.3;
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.fillRect(x, y, w, h);
      }
      // Window-eyes — a few glowing dots
      for (let i = 0; i < 8; i++) {
        const x = Math.random() * 80;
        const y = Math.random() * 100;
        ctx.fillStyle = `rgba(180,200,255,${0.2 + Math.random() * 0.2})`;
        ctx.fillRect(x, y, 2, 2);
      }
      // Unfinished right side — raw canvas
      ctx.fillStyle = '#1a1614';
      ctx.fillRect(50, 0, 30, 100);
    }
  });
}

/** The neural interface device — detailed tech tangle on the workbench. */
export function deviceTexture(): THREE.CanvasTexture {
  return canvasTexture(48, 32, (ctx) => {
    // Workbench surface behind device
    ctx.fillStyle = '#2a2018';
    ctx.fillRect(0, 0, 48, 32);

    // Main device body — a laptop-like unit
    ctx.fillStyle = '#1a1e28';
    ctx.fillRect(6, 10, 28, 14);
    ctx.fillStyle = '#2a2e38';
    ctx.fillRect(6, 10, 28, 2);

    // Screen — dark with faint blue glow
    ctx.fillStyle = '#0a2a4a';
    ctx.fillRect(8, 13, 18, 9);
    // Screen glow
    const sg = ctx.createRadialGradient(17, 17, 0, 17, 17, 12);
    sg.addColorStop(0, 'rgba(100,180,255,0.15)');
    sg.addColorStop(1, 'rgba(100,180,255,0)');
    ctx.fillStyle = sg;
    ctx.fillRect(8, 13, 18, 9);

    // Drive light — pulsing green
    ctx.fillStyle = '#2aff8a';
    ctx.fillRect(28, 16, 2, 2);
    const dg = ctx.createRadialGradient(29, 17, 0, 29, 17, 4);
    dg.addColorStop(0, 'rgba(42,255,138,0.4)');
    dg.addColorStop(1, 'rgba(42,255,138,0)');
    ctx.fillStyle = dg;
    ctx.fillRect(25, 13, 8, 8);

    // Neural jack receiver — to the right of the laptop
    ctx.fillStyle = '#1a1614';
    ctx.fillRect(36, 8, 8, 16);
    // Jack port — dark circle with blood crust
    ctx.fillStyle = '#0a0806';
    ctx.beginPath();
    ctx.arc(40, 16, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#3a1a1a';
    ctx.lineWidth = 1;
    ctx.stroke();
    // Blood crust — reddish around the port
    ctx.fillStyle = 'rgba(120,30,20,0.4)';
    ctx.beginPath();
    ctx.arc(40, 16, 4, 0, Math.PI * 2);
    ctx.fill();

    // Cables — thicker, more visible
    ctx.strokeStyle = '#2a2e38';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    // Cable from jack to laptop
    ctx.beginPath();
    ctx.moveTo(36, 20);
    ctx.bezierCurveTo(34, 22, 32, 20, 34, 24);
    ctx.stroke();
    // Cables hanging off the bench
    ctx.beginPath();
    ctx.moveTo(6, 14);
    ctx.bezierCurveTo(3, 14, 1, 18, 2, 24);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(6, 18);
    ctx.bezierCurveTo(3, 18, 0, 22, 1, 28);
    ctx.stroke();
    // Neural patch cable — glowing blue
    ctx.strokeStyle = 'rgba(80,140,255,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, 24);
    ctx.bezierCurveTo(40, 28, 38, 30, 36, 30);
    ctx.stroke();

    // Small indicator LEDs on the laptop
    ctx.fillStyle = '#ff8844';
    ctx.fillRect(30, 20, 1, 1);
    ctx.fillStyle = '#44ff88';
    ctx.fillRect(32, 20, 1, 1);
  });
}

/** Chalk body outline with the iridescent harvesting residue. */
export function bodyOutlineTexture(): THREE.CanvasTexture {
  return canvasTexture(128, 64, (ctx) => {
    ctx.clearRect(0, 0, 128, 64);

    // Chalk outline — rough, hand-drawn
    ctx.strokeStyle = 'rgba(220,220,230,0.55)';
    ctx.lineWidth = 1.8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    // Head
    ctx.arc(64, 10, 7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    // Neck
    ctx.moveTo(60, 17);
    ctx.lineTo(60, 20);
    ctx.moveTo(68, 17);
    ctx.lineTo(68, 20);
    // Shoulders
    ctx.moveTo(60, 20);
    ctx.lineTo(50, 24);
    ctx.moveTo(68, 20);
    ctx.lineTo(78, 24);
    // Arms (at sides)
    ctx.moveTo(50, 24);
    ctx.lineTo(48, 42);
    ctx.moveTo(78, 24);
    ctx.lineTo(80, 42);
    // Hands
    ctx.moveTo(46, 42);
    ctx.lineTo(50, 44);
    ctx.moveTo(82, 42);
    ctx.lineTo(78, 44);
    // Torso
    ctx.moveTo(60, 20);
    ctx.lineTo(58, 48);
    ctx.moveTo(68, 20);
    ctx.lineTo(70, 48);
    // Legs
    ctx.moveTo(58, 48);
    ctx.lineTo(59, 62);
    ctx.moveTo(70, 48);
    ctx.lineTo(69, 62);
    // Feet
    ctx.moveTo(57, 62);
    ctx.lineTo(62, 62);
    ctx.moveTo(71, 62);
    ctx.lineTo(66, 62);
    ctx.stroke();

    // Chalk dust — scatter around the lines
    for (let i = 0; i < 80; i++) {
      const x = 40 + Math.random() * 48;
      const y = 5 + Math.random() * 57;
      ctx.fillStyle = `rgba(220,220,230,${0.05 + Math.random() * 0.1})`;
      ctx.fillRect(x, y, 1, 1);
    }

    // Iridescent residue — oil-on-water sheen
    const ig = ctx.createRadialGradient(64, 33, 3, 64, 33, 28);
    ig.addColorStop(0, 'rgba(100,70,140,0.22)');
    ig.addColorStop(0.3, 'rgba(80,100,160,0.15)');
    ig.addColorStop(0.6, 'rgba(60,140,120,0.08)');
    ig.addColorStop(1, 'rgba(60,140,120,0)');
    ctx.fillStyle = ig;
    ctx.fillRect(0, 0, 128, 64);

    // Brighter residue spots — where the "harvesting" happened
    for (let i = 0; i < 5; i++) {
      const x = 55 + Math.random() * 18;
      const y = 25 + Math.random() * 20;
      const g = ctx.createRadialGradient(x, y, 0, x, y, 5);
      g.addColorStop(0, 'rgba(120,90,170,0.25)');
      g.addColorStop(1, 'rgba(120,90,170,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - 5, y - 5, 10, 10);
    }
  });
}

/** Wall writing texture — Marlon's testimony rendered in shaky marker. */
export function wallWritingTexture(): THREE.CanvasTexture {
  return canvasTexture(128, 64, (ctx) => {
    ctx.clearRect(0, 0, 128, 64);
    // Black marker text — shaky, desperate
    ctx.fillStyle = 'rgba(20,18,16,0.8)';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    const lines = [
      'THEY TAKE',
      'WHAT MAKES',
      'YOU  YOU',
      '',
      'THE CITY RUNS',
      'ON STOLEN',
      'DREAMS',
    ];
    lines.forEach((line, i) => {
      if (!line) return;
      const y = 8 + i * 8;
      // Multiple passes for a shaky, overwritten look
      for (let pass = 0; pass < 2; pass++) {
        const ox = (Math.random() - 0.5) * 2;
        const oy = (Math.random() - 0.5) * 1;
        ctx.fillText(line, 64 + ox, y + oy);
      }
    });
    ctx.textAlign = 'left';

    // Dripping ink
    ctx.strokeStyle = 'rgba(20,18,16,0.4)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 4; i++) {
      const x = 30 + Math.random() * 68;
      ctx.beginPath();
      ctx.moveTo(x, 8 + Math.random() * 40);
      ctx.lineTo(x, 8 + Math.random() * 40 + 5 + Math.random() * 8);
      ctx.stroke();
    }
  });
}
