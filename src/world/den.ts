import * as THREE from 'three';
import { glowTex, pixelTex, rowsTex } from '../core/tex';
import { interiorFloorTex, interiorWallTex } from './env';
import type { Hotspot, Ticker, WorldScene } from './types';

/**
 * The Memory Den — Lyra's archive. A narrow shop lined floor-to-ceiling with
 * memory cartridges, each one a life's moment kept cold. The room inverts
 * the street's palette: the machine light here is the warm one, because
 * Lyra chose what to do with what she is.
 */

const CYAN = '#7fe9ff';

/** A shelf wall of cartridge slots, a scatter of them glowing. */
function shelfTex(wPx: number, hPx: number): THREE.CanvasTexture {
  return pixelTex(wPx, hPx, (ctx) => {
    ctx.fillStyle = '#161217';
    ctx.fillRect(0, 0, wPx, hPx);
    const cw = 7;
    const ch = 10;
    for (let y = 4; y + ch < hPx - 4; y += ch + 3) {
      // shelf board
      ctx.fillStyle = '#241c22';
      ctx.fillRect(2, y + ch, wPx - 4, 2);
      for (let x = 4; x + cw < wPx - 4; x += cw + 2) {
        const lit = Math.random();
        if (lit < 0.14) {
          // a glowing cartridge
          const warm = Math.random() < 0.4;
          ctx.fillStyle = warm ? '#d9973f' : '#63d8e8';
          ctx.globalAlpha = 0.75;
          ctx.fillRect(x, y + 1, cw, ch - 1);
          ctx.globalAlpha = 1;
          ctx.fillStyle = warm ? '#f4d9a8' : '#c8f2f8';
          ctx.fillRect(x + 2, y + 3, cw - 4, 2);
        } else {
          ctx.fillStyle = lit < 0.55 ? '#1d1a20' : '#221e26';
          ctx.fillRect(x, y + 1, cw, ch - 1);
          ctx.fillStyle = '#2c2733';
          ctx.fillRect(x + 1, y + 2, cw - 2, 1);
        }
      }
    }
  });
}

/** Lyra: hooded figure, face a band of patient cyan light. */
function lyraTex(): THREE.CanvasTexture {
  return rowsTex(
    [
      '....cccccc....',
      '...cCCCCCCc...',
      '..cC......Cc..',
      '..cC.GGGG.Cc..',
      '..cC.gggg.Cc..',
      '..cChGGGGhCc..',
      '..cChhgghhCc..',
      '...cChhhhCc...',
      '....cCCCCc....',
      '...cssssssc...',
      '..cssssssssc..',
      '..cssssssssc..',
      '.csssssssssxc.',
      '.csssssssssxc.',
      '.cssssssssssc.',
      '.cssssssssssc.',
      '.csssssssssc..',
      '.csssssssssc..',
      '..cssssssssc..',
      '..csssssssc...',
      '..csssssssc...',
      '..cssssssc....',
      '..css..ssc....',
      '..css..ssc....',
      '..cs....sc....',
      '..cs....sc....',
      '.ccs....scc...',
      '.BBB....BBB...',
    ],
    {
      c: '#0b0d13',
      C: '#161a24',
      G: '#c2f4ff',
      g: '#7fe9ff',
      h: '#27414d',
      s: '#141721',
      x: '#4d2140',
      B: '#0c0f16',
    },
  );
}

export function buildDen(): WorldScene {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#08070b');
  scene.fog = new THREE.Fog('#0b0910', 8, 40);
  const tickers: Ticker[] = [];
  const keyLights: THREE.PointLight[] = [];

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 12),
    new THREE.MeshStandardMaterial({ map: interiorFloorTex(false), roughness: 0.55, metalness: 0.08 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, -1.5);
  scene.add(floor);

  // Shelf wall behind the counter — the archive.
  const shelves = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 6.4),
    new THREE.MeshStandardMaterial({ map: shelfTex(300, 140), roughness: 0.85 }),
  );
  shelves.position.set(0, 3.2, -6);
  scene.add(shelves);
  const sideMat = new THREE.MeshStandardMaterial({ map: interiorWallTex(140, 90, '#1c161d'), roughness: 0.92 });
  const left = new THREE.Mesh(new THREE.PlaneGeometry(10, 6.4), sideMat);
  left.rotation.y = Math.PI / 2;
  left.position.set(-6.8, 3.2, -1);
  scene.add(left);
  const right = new THREE.Mesh(new THREE.PlaneGeometry(10, 6.4), sideMat);
  right.rotation.y = -Math.PI / 2;
  right.position.set(6.8, 3.2, -1);
  scene.add(right);
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(14, 12), new THREE.MeshStandardMaterial({ color: '#0b090d', roughness: 0.95 }));
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(0, 6.2, -1.5);
  scene.add(ceiling);

  // Archive shimmer: a few cartridge glows that breathe out of phase.
  const glow = glowTex(48, 'rgba(127,233,255,0.8)');
  const warmGlow = glowTex(48, 'rgba(217,151,63,0.8)');
  const motes: { mesh: THREE.Mesh; phase: number; speed: number }[] = [];
  for (let i = 0; i < 14; i++) {
    const warm = Math.random() < 0.4;
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(0.28, 0.28),
      new THREE.MeshBasicMaterial({
        map: warm ? warmGlow : glow,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    m.position.set(-6.4 + Math.random() * 12.8, 0.8 + Math.random() * 4.8, -5.9);
    scene.add(m);
    motes.push({ mesh: m, phase: Math.random() * 10, speed: 0.3 + Math.random() * 0.8 });
  }
  tickers.push({
    update: () => {
      const t = performance.now() * 0.001;
      for (const mo of motes) {
        (mo.mesh.material as THREE.MeshBasicMaterial).opacity =
          0.18 + 0.5 * Math.max(0, Math.sin(t * mo.speed + mo.phase)) ** 3;
      }
    },
  });

  // The counter.
  const counter = new THREE.Mesh(
    new THREE.BoxGeometry(5.4, 1.05, 1.1),
    new THREE.MeshStandardMaterial({ color: '#221a20', roughness: 0.7, metalness: 0.15 }),
  );
  counter.position.set(1.6, 0.525, -3.4);
  scene.add(counter);
  // Counter edge light — warm: her hospitality.
  const counterStrip = new THREE.Mesh(
    new THREE.PlaneGeometry(5.4, 0.06),
    new THREE.MeshBasicMaterial({ color: '#d9973f' }),
  );
  counterStrip.position.set(1.6, 1.06, -2.84);
  scene.add(counterStrip);
  const counterLamp = new THREE.PointLight('#d9973f', 6, 7, 2);
  counterLamp.position.set(1.6, 1.8, -2.6);
  scene.add(counterLamp);
  keyLights.push(counterLamp);

  // Lyra, behind the counter, patient.
  const lyra = new THREE.Mesh(
    new THREE.PlaneGeometry(1.68 * (14 / 28), 1.68),
    new THREE.MeshStandardMaterial({ map: lyraTex(), transparent: true, alphaTest: 0.4, roughness: 0.9 }),
  );
  lyra.position.set(1.9, 0.84 + 0.5, -4.3);
  scene.add(lyra);
  const face = new THREE.PointLight(CYAN, 1.8, 5, 2);
  face.position.set(1.9, 1.9, -3.9);
  scene.add(face);
  keyLights.push(face);
  tickers.push({
    update: () => {
      // Her face-light breathes far slower than a human breath.
      face.intensity = 1.5 + 0.8 * (0.5 + 0.5 * Math.sin(performance.now() * 0.0006));
    },
  });

  // One cartridge on the far right, alone on a pedestal: the first one.
  const pedestal = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.1, 0.5), new THREE.MeshStandardMaterial({ color: '#1b151c', roughness: 0.8 }));
  pedestal.position.set(4.9, 0.55, -4.6);
  scene.add(pedestal);
  const first = new THREE.Mesh(
    new THREE.PlaneGeometry(0.22, 0.3),
    new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0.5 }),
  );
  first.position.set(4.9, 1.28, -4.5);
  scene.add(first);
  const firstGlow = new THREE.PointLight(CYAN, 0.6, 4, 2);
  firstGlow.position.set(4.9, 1.4, -4.1);
  scene.add(firstGlow);
  keyLights.push(firstGlow);
  tickers.push({
    update: () => {
      // It has been waiting. It pulses like something listening.
      const p = 0.4 + 0.6 * Math.max(0, Math.sin(performance.now() * 0.0013)) ** 2;
      (first.material as THREE.MeshBasicMaterial).opacity = 0.3 + p * 0.5;
      firstGlow.intensity = 0.4 + p * 1.4;
    },
  });

  scene.add(new THREE.AmbientLight('#332c36', 0.75));

  const hotspots: Hotspot[] = [
    {
      x: -3.2, radius: 1.8, glintY: 2.6, label: 'the archive', kind: 'examine',
      lines: () => [
        'Shelves to the ceiling, each slot a cartridge, each cartridge a moment someone couldn’t afford to keep: a wedding, a grandmother’s kitchen, a night it didn’t rain.',
        'A handful glow. Warm for the loved ones. Cold for the evidence.',
      ],
    },
    {
      x: 1.6, radius: 2.2, glintY: 2.2, label: 'Lyra', kind: 'talk',
      talk: 'lyra',
    },
    {
      x: 4.9, radius: 1.4, glintY: 1.7, label: 'the lone cartridge', kind: 'examine',
      lines: (cf) => cf.hasFlag('ending')
        ? ['Quiet now. Spent, or resting. Its label, in careful hand-lettering: № 1.']
        : ['A single cartridge on its own pedestal, pulsing slowly — the only one in the room she keeps out of reach of customers. Its label, hand-lettered: № 1.'],
    },
    {
      x: -5.6, radius: 1.2, label: 'back to the street', kind: 'door',
      door: { target: 'street', spawnX: 12.0 },
    },
  ];

  return {
    id: 'den',
    name: 'THE MEMORY DEN',
    scene,
    exterior: false,
    bounds: { min: -5.9, max: 5.6 },
    cam: { y: 2.1, z: 9.5, lookY: 1.55 },
    hotspots,
    keyLights,
    tickers,
  };
}
