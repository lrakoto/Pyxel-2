import * as THREE from 'three';
import { pixelTex, softTex } from '../core/tex';
import { interiorFloorTex, interiorWallTex } from './env';
import type { Hotspot, Ticker, WorldScene } from './types';

/**
 * Marlon Graves' studio — the crime scene. One room, one shaft of cold
 * skylight over the chalk outline, and the painting burning quietly on the
 * back wall like an accusation. Warm darkness everywhere the harvest didn't
 * touch; cold light everywhere it did.
 */

/** The painting: half-faces sharing features, threaded with neural traces. */
function paintingTex(): THREE.CanvasTexture {
  return pixelTex(256, 180, (ctx) => {
    const bg = ctx.createLinearGradient(0, 0, 0, 180);
    bg.addColorStop(0, '#0a0912');
    bg.addColorStop(1, '#070610');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 256, 180);

    // Half-faces: overlapping translucent ovals with borrowed features.
    const pals = [
      ['#8a705c', '#5a7ba0'], ['#77604f', '#9a6ab0'], ['#655244', '#5aa08a'],
      ['#94765c', '#b07a4a'], ['#5c4b40', '#8a5aa0'],
    ];
    for (let i = 0; i < 56; i++) {
      const cx = Math.random() * 256;
      const cy = Math.random() * 170;
      const rx = 6 + Math.random() * 14;
      const ry = rx * (1.2 + Math.random() * 0.3);
      const [skin, glow] = pals[(Math.random() * pals.length) | 0];
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate((Math.random() - 0.5) * 0.9);
      ctx.globalAlpha = 0.16 + Math.random() * 0.22;
      ctx.fillStyle = skin;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, -Math.PI / 2, Math.PI / 2); // half face only
      ctx.fill();
      // one eye, if any
      if (Math.random() < 0.5) {
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = '#0c0a08';
        ctx.fillRect(rx * 0.25, -ry * 0.2, 2.4, 1.4);
        ctx.fillStyle = glow;
        ctx.fillRect(rx * 0.25 + 0.6, -ry * 0.2, 1, 1);
      }
      // a mouth borrowed from someone else
      if (Math.random() < 0.35) {
        ctx.globalAlpha = 0.4;
        ctx.strokeStyle = '#241a14';
        ctx.beginPath();
        ctx.moveTo(rx * 0.1, ry * 0.35);
        ctx.lineTo(rx * 0.5, ry * 0.35 + (Math.random() - 0.5) * 2);
        ctx.stroke();
      }
      ctx.restore();
    }
    ctx.globalAlpha = 1;

    // Neural threads stitching the faces together.
    ctx.lineCap = 'round';
    for (let i = 0; i < 34; i++) {
      const x1 = Math.random() * 256;
      const y1 = Math.random() * 170;
      const x2 = x1 + (Math.random() - 0.5) * 70;
      const y2 = y1 + (Math.random() - 0.5) * 70;
      const a = 0.06 + Math.random() * 0.1;
      ctx.strokeStyle = `rgba(99,216,232,${a})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.bezierCurveTo(x1 + 12, y1 - 6, x2 - 12, y2 + 6, x2, y2);
      ctx.stroke();
      ctx.strokeStyle = `rgba(180,240,248,${a * 1.4})`;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
    // Convergence — every thread leans toward one dark point.
    const g = ctx.createRadialGradient(150, 84, 2, 150, 84, 34);
    g.addColorStop(0, 'rgba(99,216,232,0.22)');
    g.addColorStop(1, 'rgba(99,216,232,0)');
    ctx.fillStyle = g;
    ctx.fillRect(110, 44, 80, 80);
    ctx.fillStyle = '#05050a';
    ctx.beginPath();
    ctx.arc(150, 84, 3.2, 0, Math.PI * 2);
    ctx.fill();

    // Scratched title.
    ctx.fillStyle = 'rgba(210,210,220,0.55)';
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('EVERYBODY / NOBODY', 128, 174);
  });
}

/** Chalk outline with the iridescent residue trailing toward the drain. */
function outlineTex(): THREE.CanvasTexture {
  return pixelTex(140, 64, (ctx) => {
    ctx.clearRect(0, 0, 140, 64);
    ctx.strokeStyle = 'rgba(225,225,232,0.55)';
    ctx.lineWidth = 1.7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(56, 12, 7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(52, 19); ctx.lineTo(42, 25); ctx.lineTo(40, 43);
    ctx.moveTo(60, 19); ctx.lineTo(70, 25); ctx.lineTo(72, 43);
    ctx.moveTo(52, 21); ctx.lineTo(50, 48); ctx.lineTo(51, 61);
    ctx.moveTo(60, 21); ctx.lineTo(62, 48); ctx.lineTo(61, 61);
    ctx.moveTo(48, 61); ctx.lineTo(54, 61);
    ctx.moveTo(58, 61); ctx.lineTo(64, 61);
    ctx.stroke();
    // chalk dust
    for (let i = 0; i < 70; i++) {
      ctx.fillStyle = `rgba(225,225,232,${0.05 + Math.random() * 0.08})`;
      ctx.fillRect(34 + Math.random() * 46, 4 + Math.random() * 58, 1, 1);
    }
    // residue sheen, smeared right toward the drain
    const g = ctx.createLinearGradient(50, 0, 130, 0);
    g.addColorStop(0, 'rgba(120,90,170,0.24)');
    g.addColorStop(0.5, 'rgba(80,130,160,0.16)');
    g.addColorStop(1, 'rgba(70,160,140,0.05)');
    ctx.fillStyle = g;
    ctx.fillRect(46, 22, 88, 30);
    for (let i = 0; i < 8; i++) {
      const x = 60 + Math.random() * 66;
      const y = 26 + Math.random() * 22;
      const gg = ctx.createRadialGradient(x, y, 0, x, y, 4);
      gg.addColorStop(0, 'rgba(150,110,200,0.3)');
      gg.addColorStop(1, 'rgba(150,110,200,0)');
      ctx.fillStyle = gg;
      ctx.fillRect(x - 4, y - 4, 8, 8);
    }
  });
}

/** The harvest rig: cradle, cables, drive tower, jack arm. */
function rigTex(): THREE.CanvasTexture {
  return pixelTex(56, 36, (ctx) => {
    // bench top
    ctx.fillStyle = '#241c13';
    ctx.fillRect(0, 26, 56, 10);
    // drive tower with cold status column
    ctx.fillStyle = '#14181d';
    ctx.fillRect(6, 6, 12, 20);
    ctx.fillStyle = '#0c0f13';
    ctx.fillRect(8, 8, 8, 16);
    for (let y = 9; y < 23; y += 3) {
      ctx.fillStyle = Math.random() < 0.6 ? '#2c8a96' : '#173a40';
      ctx.fillRect(9, y, 2, 1);
    }
    // the cradle — a half-crown of electrodes
    ctx.strokeStyle = '#3a4148';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(36, 20, 9, Math.PI, 0);
    ctx.stroke();
    ctx.fillStyle = '#63d8e8';
    for (let i = 0; i < 5; i++) {
      const a = Math.PI + (i / 4) * Math.PI;
      ctx.globalAlpha = 0.7;
      ctx.fillRect(36 + Math.cos(a) * 9 - 1, 20 + Math.sin(a) * 9 - 1, 2, 2);
    }
    ctx.globalAlpha = 1;
    // jack arm with the blood
    ctx.strokeStyle = '#2b3138';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(45, 12);
    ctx.bezierCurveTo(49, 14, 50, 20, 47, 24);
    ctx.stroke();
    ctx.fillStyle = '#131519';
    ctx.fillRect(45, 22, 5, 4);
    ctx.fillStyle = 'rgba(122,32,26,0.75)';
    ctx.fillRect(46, 24, 3, 2);
    // cables spilling off the bench
    ctx.strokeStyle = '#20242a';
    ctx.lineWidth = 1.4;
    for (const [sx, ex] of [[18, 4], [22, 10], [30, 20]]) {
      ctx.beginPath();
      ctx.moveTo(sx, 26);
      ctx.bezierCurveTo(sx - 3, 30, ex + 4, 31, ex, 35);
      ctx.stroke();
    }
  });
}

/** Marlon's wall, written in the dark with a dying marker. */
function wallWritingTex(): THREE.CanvasTexture {
  return pixelTex(150, 72, (ctx) => {
    ctx.clearRect(0, 0, 150, 72);
    ctx.fillStyle = 'rgba(16,13,11,0.85)';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    const lines = ['THEY TAKE WHAT', 'MAKES YOU  YOU', 'WE ARE EVERYBODY', 'WE ARE NOBODY', '', 'FIND THE FIRST ONE'];
    lines.forEach((line, i) => {
      if (!line) return;
      for (let pass = 0; pass < 2; pass++) {
        ctx.fillText(line, 75 + (Math.random() - 0.5) * 2, 11 + i * 11 + (Math.random() - 0.5) * 1.5);
      }
    });
    // the last line, underlined hard
    ctx.fillRect(28, 68, 94, 1.6);
    // drips
    ctx.strokeStyle = 'rgba(16,13,11,0.4)';
    ctx.lineWidth = 0.6;
    for (let i = 0; i < 5; i++) {
      const x = 30 + Math.random() * 90;
      const y = 10 + Math.random() * 46;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + 4 + Math.random() * 8);
      ctx.stroke();
    }
  });
}

/** An easel with the slashed canvas — the dissolving woman, cut. */
function slashedTex(): THREE.CanvasTexture {
  return pixelTex(64, 84, (ctx) => {
    ctx.fillStyle = '#171310';
    ctx.fillRect(0, 0, 64, 84);
    // her face, coming apart into light toward the right edge
    for (let i = 0; i < 40; i++) {
      const x = 8 + Math.random() * 40;
      const y = 12 + Math.random() * 52;
      const drift = (x - 8) / 40;
      ctx.globalAlpha = 0.16 + Math.random() * 0.25;
      ctx.fillStyle = drift > 0.6 && Math.random() < drift ? '#d8c9a8' : '#9a7a5e';
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((Math.random() - 0.5) * 0.4);
      ctx.fillRect(0, 0, 3 + Math.random() * 8, 2 + Math.random() * 4);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    // light motes leaving her
    for (let i = 0; i < 12; i++) {
      ctx.fillStyle = `rgba(230,215,180,${0.15 + Math.random() * 0.25})`;
      ctx.fillRect(40 + Math.random() * 20, 10 + Math.random() * 56, 1.5, 1.5);
    }
    // the slash: through the eyes, canvas parted
    ctx.strokeStyle = '#060504';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(10, 26);
    ctx.lineTo(52, 34);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(200,190,170,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(10, 28);
    ctx.lineTo(52, 36);
    ctx.stroke();
  });
}

export function buildStudio(): WorldScene {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#060507');
  scene.fog = new THREE.Fog('#0a0809', 10, 46);
  const tickers: Ticker[] = [];
  const keyLights: THREE.PointLight[] = [];

  // Room shell.
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 14),
    new THREE.MeshStandardMaterial({ map: interiorFloorTex(true), roughness: 0.7, metalness: 0.04 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, -2);
  scene.add(floor);

  const backWall = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 7),
    new THREE.MeshStandardMaterial({ map: interiorWallTex(260, 96), roughness: 0.92 }),
  );
  backWall.position.set(0, 3.5, -7.5);
  scene.add(backWall);
  const sideMat = new THREE.MeshStandardMaterial({ map: interiorWallTex(160, 96), roughness: 0.92 });
  const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(12, 7), sideMat);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(-9.5, 3.5, -1.5);
  scene.add(leftWall);
  const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(12, 7), sideMat);
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.position.set(9.5, 3.5, -1.5);
  scene.add(rightWall);
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(20, 14), new THREE.MeshStandardMaterial({ color: '#0a0807', roughness: 0.95 }));
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(0, 6.6, -2);
  scene.add(ceiling);

  // The skylight shaft: cold light falling on the outline.
  const shaftTex = softTex(96, 192, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, 'rgba(140, 190, 210, 0.22)');
    g.addColorStop(1, 'rgba(140, 190, 210, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(w * 0.3, 0);
    ctx.lineTo(w * 0.7, 0);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();
  });
  const shaft = new THREE.Mesh(
    new THREE.PlaneGeometry(3.6, 6.5),
    new THREE.MeshBasicMaterial({ map: shaftTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }),
  );
  shaft.position.set(1.2, 3.4, -2.6);
  scene.add(shaft);
  const skyLight = new THREE.PointLight('#a8ccd8', 8, 10, 2);
  skyLight.position.set(1.2, 5.4, -2.2);
  scene.add(skyLight);
  keyLights.push(skyLight);
  // Rain drumming faintly inside the shaft.
  tickers.push({
    update: () => {
      const f = 0.92 + Math.random() * 0.16;
      skyLight.intensity = 8 * f;
      (shaft.material as THREE.MeshBasicMaterial).opacity = 0.85 * f;
    },
  });

  // The painting, its frame, and its cold self-glow.
  const painting = new THREE.Mesh(
    new THREE.PlaneGeometry(4.6, 3.25),
    new THREE.MeshBasicMaterial({ map: paintingTex() }),
  );
  painting.position.set(-0.5, 3.4, -7.42);
  scene.add(painting);
  const frameMat = new THREE.MeshStandardMaterial({ color: '#241610', roughness: 0.85 });
  for (const [w, h, px, py] of [
    [4.9, 0.14, -0.5, 5.1], [4.9, 0.14, -0.5, 1.72], [0.14, 3.5, -2.9, 3.4], [0.14, 3.5, 1.9, 3.4],
  ] as const) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.08), frameMat);
    bar.position.set(px, py, -7.4);
    scene.add(bar);
  }
  const paintingGlow = new THREE.PointLight('#3f8ea0', 6, 9, 2);
  paintingGlow.position.set(-0.5, 3.4, -5.6);
  scene.add(paintingGlow);
  keyLights.push(paintingGlow);
  tickers.push({
    update: () => {
      paintingGlow.intensity = 6 + Math.sin(performance.now() * 0.0011) * 1.2;
    },
  });

  // Chalk outline under the shaft; residue smeared toward the drain.
  const outline = new THREE.Mesh(
    new THREE.PlaneGeometry(4.4, 2.0),
    new THREE.MeshBasicMaterial({ map: outlineTex(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }),
  );
  outline.rotation.x = -Math.PI / 2;
  outline.position.set(1.6, 0.02, -2.4);
  scene.add(outline);
  // Floor drain.
  const drain = new THREE.Mesh(
    new THREE.PlaneGeometry(0.6, 0.6),
    new THREE.MeshStandardMaterial({
      map: pixelTex(16, 16, (ctx) => {
        ctx.fillStyle = '#0b0a09';
        ctx.beginPath();
        ctx.arc(8, 8, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1c1a17';
        for (let i = 3; i < 14; i += 3) ctx.fillRect(3, i, 10, 1);
      }),
      transparent: true,
      alphaTest: 0.4,
      roughness: 0.6,
    }),
  );
  drain.rotation.x = -Math.PI / 2;
  drain.position.set(4.2, 0.015, -2.3);
  scene.add(drain);
  const residueGlow = new THREE.PointLight('#7a5ab0', 2.4, 4, 2);
  residueGlow.position.set(2.4, 0.5, -2.2);
  scene.add(residueGlow);
  keyLights.push(residueGlow);

  // The harvest rig on its bench.
  const bench = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.75, 1), new THREE.MeshStandardMaterial({ color: '#241c13', roughness: 0.85 }));
  bench.position.set(6, 0.375, -4.4);
  scene.add(bench);
  const rig = new THREE.Mesh(
    new THREE.PlaneGeometry(1.9, 1.22),
    new THREE.MeshStandardMaterial({ map: rigTex(), transparent: true, alphaTest: 0.3, roughness: 0.7 }),
  );
  rig.position.set(6, 1.1, -4.35);
  scene.add(rig);
  const rigLight = new THREE.PointLight('#2c8a96', 3, 5, 2);
  rigLight.position.set(6, 1.4, -3.6);
  scene.add(rigLight);
  keyLights.push(rigLight);
  tickers.push({
    update: () => {
      // The drive light breathes: whatever it ran, it finished — mostly.
      rigLight.intensity = 2.2 + Math.max(0, Math.sin(performance.now() * 0.0009)) * 1.6;
    },
  });

  // The wall writing, left wall.
  const writing = new THREE.Mesh(
    new THREE.PlaneGeometry(3.4, 1.65),
    new THREE.MeshBasicMaterial({ map: wallWritingTex(), transparent: true, opacity: 0.9 }),
  );
  writing.rotation.y = Math.PI / 2;
  writing.position.set(-9.42, 2.9, -3.2);
  scene.add(writing);

  // Easel with the slashed canvas + a scatter of leaning canvases.
  const easelMat = new THREE.MeshStandardMaterial({ color: '#33261a', roughness: 0.9 });
  const easelGroup = new THREE.Group();
  for (const [lx, lz] of [[-0.3, 0.14], [0.3, 0.14], [0, -0.3]] as const) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.4, 0.06), easelMat);
    leg.position.set(lx, 1.2, lz);
    easelGroup.add(leg);
  }
  const slashed = new THREE.Mesh(
    new THREE.PlaneGeometry(1.15, 1.5),
    new THREE.MeshBasicMaterial({ map: slashedTex() }),
  );
  slashed.position.set(0, 1.45, 0.06);
  easelGroup.add(slashed);
  easelGroup.position.set(-4.6, 0, -5.2);
  scene.add(easelGroup);
  // leaning blanks
  for (let i = 0; i < 4; i++) {
    const c = new THREE.Mesh(
      new THREE.PlaneGeometry(0.9, 1.15),
      new THREE.MeshStandardMaterial({ color: i % 2 ? '#1c1712' : '#211a14', roughness: 0.95 }),
    );
    c.position.set(-6.6 + i * 0.28, 0.55, -6.9 + i * 0.12);
    c.rotation.z = (Math.random() - 0.5) * 0.12;
    c.rotation.x = -0.12;
    scene.add(c);
  }

  // Marlon's journal on a paint crate.
  const crate = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.55, 0.7), new THREE.MeshStandardMaterial({ color: '#2a2014', roughness: 0.9 }));
  crate.position.set(-2.4, 0.275, -3.6);
  scene.add(crate);
  const journal = new THREE.Mesh(
    new THREE.PlaneGeometry(0.55, 0.4),
    new THREE.MeshBasicMaterial({
      map: pixelTex(22, 16, (ctx) => {
        ctx.fillStyle = '#31261a';
        ctx.fillRect(0, 0, 22, 16);
        ctx.fillStyle = '#8f8266';
        ctx.fillRect(1, 1, 9, 14);
        ctx.fillRect(12, 1, 9, 14);
        ctx.fillStyle = '#4a4232';
        for (let y = 3; y < 14; y += 2) {
          ctx.fillRect(2, y, 7, 1);
          ctx.fillRect(13, y, 7, 1);
        }
      }),
    }),
  );
  journal.rotation.x = -Math.PI / 2;
  journal.position.set(-2.4, 0.56, -3.55);
  scene.add(journal);

  // The entry door, right wall.
  const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.6, 1.4), new THREE.MeshStandardMaterial({ color: '#171310', roughness: 0.9 }));
  doorFrame.position.set(9.44, 1.3, 0.6);
  scene.add(doorFrame);
  const spill = new THREE.PointLight('#e0a04a', 3.2, 5, 2);
  spill.position.set(8.6, 1.8, 0.8);
  scene.add(spill);
  keyLights.push(spill);

  // A dying work lamp on a cord, mid-room — the warmth Marlon worked by.
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), new THREE.MeshBasicMaterial({ color: '#ffd9a0' }));
  bulb.position.set(-3, 3.4, -2.6);
  scene.add(bulb);
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 3.2), new THREE.MeshBasicMaterial({ color: '#0b0908' }));
  cord.position.set(-3, 5.0, -2.6);
  scene.add(cord);
  const workLamp = new THREE.PointLight('#e8b268', 11, 12, 2);
  workLamp.position.set(-3, 3.3, -2.2);
  scene.add(workLamp);
  keyLights.push(workLamp);
  tickers.push({
    update: (dt: number) => {
      // Organic flicker with the occasional brown-out.
      void dt;
      const t = performance.now() * 0.001;
      const dip = Math.sin(t * 13.7) * Math.sin(t * 3.1) < -0.93 ? 0.45 : 1;
      workLamp.intensity = 11 * (0.92 + Math.random() * 0.1) * dip;
      (bulb.material as THREE.MeshBasicMaterial).color.setScalar(0.75 * dip + 0.25);
    },
  });

  scene.add(new THREE.AmbientLight('#3a332c', 0.85));
  const fill = new THREE.DirectionalLight('#2e3648', 0.35);
  fill.position.set(2, 6, 8);
  scene.add(fill);

  /* ── Hotspots ───────────────────────────────────────────────────── */

  const hotspots: Hotspot[] = [
    {
      x: -8.6, radius: 1.8, glintY: 2.9, label: 'the wall', kind: 'examine',
      fragment: 'wall-writing',
      lines: (cf) => cf.hasFragment('wall-writing')
        ? ['FIND THE FIRST ONE. Underlined twice, by a hand losing the strength to hold a marker. Everything else in this room follows from that line.']
        : [
            'Writing on the plaster, black marker, the letters degrading line by line — a steady hand becoming an unsteady one.',
            'THEY TAKE WHAT MAKES YOU YOU. THE CITY RUNS ON STOLEN DREAMS. WE ARE EVERYBODY. WE ARE NOBODY.',
            'And underneath, underlined twice, pressed hard enough to gouge the plaster: FIND THE FIRST ONE.',
            'I photograph it in sections. Testimony, written by a man watching himself be deleted.',
          ],
    },
    {
      x: -4.6, radius: 1.6, glintY: 2.0, label: 'the slashed canvas', kind: 'examine',
      fragment: 'slashed-canvas',
      lines: (cf) => cf.hasFragment('slashed-canvas')
        ? ['Her face keeps coming apart at the edges no matter how long I look. Someone cut her eyes out of the world twice — once with a blade, once with whatever did the rest.']
        : [
            'Seven canvases in the room. Six lean against the wall untouched. The seventh is on the easel, and it has been attacked.',
            'A woman, dissolving into light — painted with more tenderness than anything else here. The slash goes precisely through her eyes.',
            'Rage doesn’t cut that straight. This was removal.',
          ],
    },
    {
      x: -2.4, radius: 1.4, glintY: 1.2, label: 'the journal', kind: 'examine',
      fragment: 'last-entry',
      lines: (cf) => cf.hasFragment('last-entry')
        ? ['"I have to get this out before—" The pen line runs off the page. Whatever came next, he chose to spend it painting instead of writing.']
        : [
            'A paint-crusted journal, open to the last entry. The handwriting matches the wall — early wall, steady hand.',
            '"They don’t know I can hear them. The fragments. They’re not gone — they’re here. In the work. In ME. I can hear everybody. I can hear nobody. I have to get this out before—"',
            'The sentence ends in a line that runs off the page.',
          ],
    },
    {
      x: -0.5, radius: 1.7, glintY: 3.3, label: 'the painting', kind: 'examine',
      fragment: 'the-painting',
      lines: (cf) => cf.hasFragment('the-painting')
        ? ['Hundreds of half-faces, sharing each other’s features, all leaning toward the small dark point at the center. A map, waiting for someone who reads maps.']
        : [
            'His last work, still on the wall — the only thing in this room the killer didn’t touch. Or couldn’t.',
            'Hundreds of half-faces. Look closer: they share features. An eye repeated across nine strangers. One mouth, borrowed by a dozen. People made of other people.',
            'My wrist lamp, UV band. Under the pigment: thread-fine traces, machine-precise, converging on a single dark point. Neural signatures — baked into paint.',
            'This isn’t a picture of something. It’s a map of everyone.',
          ],
    },
    {
      x: 2.2, radius: 1.5, glintY: 0.75, label: 'the outline', kind: 'examine',
      fragment: 'the-body',
      lines: (cf) => cf.hasFragment('the-body')
        ? ['The chalk is already fading. The city didn’t even use permanent chalk.']
        : [
            'The outline lies exactly under the skylight, arms at the sides — composed. Nobody falls that neatly.',
            'The coroner’s file on my wrist: no wounds, no toxins, no struggle. Cardiac arrest. And a footnote in smaller type: every neural implant in his skull burned out from the inside.',
            'The rain drums on the glass above like it’s trying to restart him.',
          ],
    },
    {
      x: 4.1, radius: 1.3, glintY: 0.55, label: 'the residue', kind: 'examine',
      fragment: 'residue',
      lines: (cf) => cf.hasFragment('residue')
        ? ['The vial in my coat catches the skylight — a color that isn’t on any chart. The only physical trace that anything left this room.']
        : [
            'An oily film, pooled and smeared from the outline toward the floor drain — as if something liquid tried to leave the room the polite way.',
            'It shifts color when I move: violet, then teal, then a hue I don’t have a name for and won’t remember in an hour.',
            'I scrape a sample into a vial. Whatever a person is made of, I think I’m holding some.',
          ],
    },
    {
      x: 6, radius: 1.6, glintY: 1.5, label: 'the rig', kind: 'examine',
      fragment: 'harvest-rig',
      lines: (cf) => cf.hasFragment('harvest-rig')
        ? ['The drive light still breathes every few seconds, like the machine is dreaming about what it did.']
        : [
            'A neural cradle wired to a drive tower. Consumer shell, but the electrode crown is medical grade and the firmware plate has been filed blank.',
            'The log survives: one session, last night, 01:12 to 01:53. Forty-one minutes. Operation class: EXTRACTION. Not backup. Not recording. Extraction.',
            'There is dried blood on the jack arm. Whoever ran this didn’t bother being gentle — or Marlon stopped being able to hold still.',
          ],
    },
    {
      x: 8.2, radius: 1.4, glintY: 1.6, label: 'the door', kind: 'examine',
      fragment: 'picked-lock',
      lines: (cf) => cf.hasFragment('picked-lock')
        ? ['Picked, oiled, closed again on the way out. Whoever it was walked in like an appointment and left like weather.']
        : [
            'The lock tells the whole entrance story: picked — beautifully. No scratches around the keyway, tension marks like watchmaker’s work.',
            'And the hinges have been oiled. Recently. You oil a hinge when you plan to come back, or when you don’t want a sound on the way out.',
            'Nothing in this room is broken. Except him.',
          ],
    },
    {
      x: 9.1, radius: 1.2, label: 'leave the studio', kind: 'door',
      door: { target: 'street', spawnX: -11.4 },
    },
  ];

  return {
    id: 'studio',
    name: "MARLON GRAVES' STUDIO",
    scene,
    exterior: false,
    bounds: { min: -8.8, max: 9.1 },
    cam: { y: 2.2, z: 11.5, lookY: 1.6 },
    hotspots,
    keyLights,
    tickers,
  };
}
