import * as THREE from 'three';
import { pixelTex, platePixelate, rowsTex, softTex } from '../core/tex';
import { cordonTapeTex, facadeTex, midStripTex, signTex, skyTexFallback, streetGroundTex } from './env';
import { NeonSign, Sparkles, Steam, Walkers, WetStreak } from './fx';
import type { Hotspot, Ticker, WorldScene } from './types';

/**
 * Sector 7 after the murder — my composition. Not an arcade strip: a wet,
 * half-dark block with a police cordon at the alley mouth, one working
 * sodium lamp over the studio door, a noodle stand steaming against the
 * cold, a dead camera, and a patrol drone dragging its searchlight through
 * the rain. Warm sodium for the human street; the only cold light is the
 * Memory Den — and the machine looking for something.
 */

const AMBER = '#e0a04a';
const TEAL = '#63d8e8';
const PINK = '#e86ea8';

/* ── Props ─────────────────────────────────────────────────────────── */

/** The noodle stand — a warm island: canopy, counter, hanging lamp, vendor. */
function buildNoodleStand(scene: THREE.Scene, x: number, z: number): THREE.PointLight {
  const stand = pixelTex(44, 34, (ctx) => {
    // canopy
    ctx.fillStyle = '#71322a';
    ctx.fillRect(0, 0, 44, 6);
    ctx.fillStyle = '#4d221d';
    for (let i = 0; i < 44; i += 8) ctx.fillRect(i, 4, 4, 2);
    // posts
    ctx.fillStyle = '#241d16';
    ctx.fillRect(1, 6, 3, 28);
    ctx.fillRect(40, 6, 3, 28);
    // counter
    ctx.fillStyle = '#39301f';
    ctx.fillRect(3, 18, 38, 4);
    ctx.fillStyle = '#241d12';
    ctx.fillRect(3, 22, 38, 12);
    // steam pots
    ctx.fillStyle = '#3d4147';
    ctx.fillRect(8, 14, 8, 4);
    ctx.fillRect(19, 15, 6, 3);
    // hanging menu strips
    ctx.fillStyle = '#c8b490';
    ctx.fillRect(28, 7, 4, 9);
    ctx.fillRect(34, 7, 4, 7);
    ctx.fillStyle = '#8c2f28';
    ctx.fillRect(29, 8, 2, 2);
    ctx.fillRect(35, 8, 2, 2);
  });
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(2.9, 2.25),
    new THREE.MeshStandardMaterial({ map: stand, transparent: true, alphaTest: 0.4, roughness: 0.9 }),
  );
  mesh.position.set(x, 1.125, z);
  scene.add(mesh);

  // The vendor — a warm-lit figure behind the counter.
  const vendor = rowsTex(
    [
      '....hhhh....',
      '...hhhhhh...',
      '...hffffh...',
      '...hffffh...',
      '....ffff....',
      '...aaaaaa...',
      '..aaaaaaaa..',
      '..aaaaaaaa..',
      '..aawwwwaa..',
      '..aawwwwaa..',
      '..aaaaaaaa..',
      '..aaaaaaaa..',
      '...aaaaaa...',
      '...aaaaaa...',
    ],
    { h: '#2a2320', f: '#c79a72', a: '#5c4a33', w: '#d8cbb2' },
  );
  const vendorMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(0.72, 0.84),
    new THREE.MeshStandardMaterial({ map: vendor, transparent: true, alphaTest: 0.4, roughness: 0.95 }),
  );
  vendorMesh.position.set(x + 0.1, 1.32, z - 0.4);
  scene.add(vendorMesh);

  const lamp = new THREE.PointLight(AMBER, 9, 8, 2);
  lamp.position.set(x, 2.3, z + 0.8);
  scene.add(lamp);
  return lamp;
}

/** The dead camera on its pole — a small cold detail that matters. */
function buildCamera(scene: THREE.Scene, x: number, z: number) {
  const poleMat = new THREE.MeshStandardMaterial({ color: '#131110', roughness: 0.9 });
  const pole = new THREE.Mesh(new THREE.BoxGeometry(0.14, 5.2, 0.14), poleMat);
  pole.position.set(x, 2.6, z);
  scene.add(pole);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.22, 0.26), poleMat);
  head.position.set(x + 0.22, 4.6, z);
  head.rotation.z = -0.28;
  scene.add(head);
  // Its status LED — dead things blink red, slowly.
  const led = new THREE.Mesh(
    new THREE.PlaneGeometry(0.05, 0.05),
    new THREE.MeshBasicMaterial({ color: '#ff4a3c', transparent: true }),
  );
  led.position.set(x + 0.38, 4.58, z + 0.14);
  scene.add(led);
  return led.material as THREE.MeshBasicMaterial;
}

/** The patrol drone: a dark chevron dragging a searchlight cone. */
class PatrolDrone implements Ticker {
  readonly group = new THREE.Group();
  readonly light: THREE.PointLight;
  private readonly cone: THREE.Mesh;
  private t = 0;

  constructor() {
    const body = new THREE.Mesh(
      new THREE.PlaneGeometry(0.7, 0.22),
      new THREE.MeshStandardMaterial({ color: '#101418', roughness: 0.6, metalness: 0.4 }),
    );
    const eye = new THREE.Mesh(
      new THREE.PlaneGeometry(0.1, 0.05),
      new THREE.MeshBasicMaterial({ color: TEAL }),
    );
    eye.position.set(0.18, -0.03, 0.01);
    const coneTex = softTex(64, 128, (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, 'rgba(120, 220, 235, 0.28)');
      g.addColorStop(1, 'rgba(120, 220, 235, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(w * 0.42, 0);
      ctx.lineTo(w * 0.58, 0);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();
    });
    this.cone = new THREE.Mesh(
      new THREE.PlaneGeometry(2.2, 5.4),
      new THREE.MeshBasicMaterial({
        map: coneTex,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    this.cone.position.set(0, -2.8, -0.05);
    this.light = new THREE.PointLight(TEAL, 5, 9, 2);
    this.light.position.set(0, -4.2, 1.4);
    this.group.add(body, eye, this.cone, this.light);
    this.group.position.set(0, 5.6, -3.5);
  }

  update(dt: number) {
    this.t += dt;
    const x = Math.sin(this.t * 0.16) * 12;
    const drift = Math.sin(this.t * 1.7) * 0.12;
    this.group.position.x = x;
    this.group.position.y = 5.6 + drift;
    const sway = Math.sin(this.t * 0.55) * 0.16;
    this.cone.rotation.z = sway;
    this.light.position.x = -Math.sin(sway) * 4.4;
  }
}

/** The holo billboard: the EVERYBODY™ ad, glitching between two frames. */
class Billboard implements Ticker {
  readonly mesh: THREE.Mesh;
  readonly light: THREE.PointLight;
  private readonly a: THREE.Texture;
  private readonly b: THREE.Texture;
  private readonly mat: THREE.MeshBasicMaterial;
  private t = 0;

  constructor(x: number, y: number, z: number) {
    const frame = (broken: boolean) =>
      pixelTex(160, 90, (ctx, w, h) => {
        ctx.fillStyle = '#0a0d10';
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = '#20303a';
        ctx.strokeRect(1.5, 1.5, w - 3, h - 3);
        ctx.textAlign = 'center';
        ctx.font = 'bold 22px monospace';
        ctx.shadowBlur = 10;
        if (!broken) {
          ctx.shadowColor = TEAL;
          ctx.fillStyle = TEAL;
          ctx.fillText('EVERYBODY™', w / 2, 40);
          ctx.shadowBlur = 0;
          ctx.font = '11px monospace';
          ctx.fillStyle = '#9fc6ce';
          ctx.fillText('BE MORE THAN ONE', w / 2, 62);
        } else {
          ctx.shadowColor = PINK;
          ctx.fillStyle = PINK;
          ctx.fillText('N̸O̸BODY', w / 2, 44);
          ctx.shadowBlur = 0;
          ctx.font = '11px monospace';
          ctx.fillStyle = '#c78ca8';
          ctx.fillText('B̷E̷ ̷N̷O̷ ̷ONE', w / 2, 64);
        }
        // scanlines
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        for (let sy = 0; sy < h; sy += 3) ctx.fillRect(0, sy, w, 1);
      });
    this.a = frame(false);
    this.b = frame(true);
    this.mat = new THREE.MeshBasicMaterial({ map: this.a, transparent: true, opacity: 0.92 });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 2.5), this.mat);
    this.mesh.position.set(x, y, z);
    this.light = new THREE.PointLight(TEAL, 10, 12, 2);
    this.light.position.set(x, y - 1, z + 2.4);
  }

  update(dt: number) {
    this.t += dt;
    // Mostly the ad; occasionally the glitch bleeds through.
    const glitch = Math.sin(this.t * 0.7) > 0.965 || Math.random() < dt * 0.35;
    this.mat.map = glitch ? this.b : this.a;
    this.mat.opacity = glitch ? 0.75 + Math.random() * 0.2 : 0.92;
    this.light.color.set(glitch ? PINK : TEAL);
  }
}

/* ── The scene ─────────────────────────────────────────────────────── */

export function buildStreet(): WorldScene {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#050508');
  scene.fog = new THREE.Fog('#0b0a10', 12, 80);
  const tickers: Ticker[] = [];
  const keyLights: THREE.PointLight[] = [];

  // Sky: procedural fallback, upgraded to the painted plate warm-tinted.
  const skyMat = new THREE.MeshBasicMaterial({ map: skyTexFallback(), fog: false });
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(240, 120), skyMat);
  sky.position.set(0, 18, -80);
  scene.add(sky);
  platePixelate('/env/skyline.png', { width: 1280, posterize: 14, brightness: 0.82, tint: [1.06, 0.97, 0.88] })
    .then((tex) => {
      const img = tex.image as HTMLCanvasElement;
      const hWorld = 240 * (img.height / img.width);
      sky.geometry.dispose();
      sky.geometry = new THREE.PlaneGeometry(240, hWorld);
      sky.position.y = hWorld / 2 - 15;
      skyMat.map = tex;
      skyMat.needsUpdate = true;
    })
    .catch(() => undefined);

  // Mid-distance silhouettes.
  const strip = new THREE.Mesh(
    new THREE.PlaneGeometry(180, 180 * (150 / 1024)),
    new THREE.MeshBasicMaterial({ map: midStripTex(), transparent: true }),
  );
  strip.position.set(0, 180 * (150 / 1024) / 2 - 3.5, -36);
  scene.add(strip);

  // Ground.
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(120, 26),
    new THREE.MeshStandardMaterial({ map: streetGroundTex(), roughness: 0.35, metalness: 0.08 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, 0, -3.5);
  scene.add(ground);

  // Building row: fronts as boxes with dark sides.
  const sideMat = new THREE.MeshBasicMaterial({ color: '#0b0a09' });
  const topMat = new THREE.MeshBasicMaterial({ color: '#090808' });
  const xs = [-44, -35, -26, -17.5, -9, 0.5, 9, 17.5, 26, 35, 44];
  xs.forEach((x, i) => {
    const w = 6.5 + ((i * 7) % 5) * 0.55;
    const h = 8.5 + ((i * 5) % 7);
    const frontZ = -8.4 - (i % 3) * 0.5;
    const front = new THREE.MeshBasicMaterial({ map: facadeTex(Math.round(w * 13), Math.round(h * 13)) });
    front.color.setScalar(0.75 + ((i * 3) % 4) * 0.05);
    const box = new THREE.Mesh(new THREE.BoxGeometry(w, h, 3.2), [sideMat, sideMat, topMat, sideMat, front, sideMat]);
    box.position.set(x, h / 2, frontZ - 1.6);
    scene.add(box);
  });

  // The alley mouth at the far left: a darker recess with the studio door.
  const alleyWall = new THREE.Mesh(new THREE.PlaneGeometry(6, 7), new THREE.MeshStandardMaterial({ color: '#0c0a09', roughness: 0.95 }));
  alleyWall.position.set(-13.5, 3.5, -8.0);
  scene.add(alleyWall);
  const doorTex = pixelTex(26, 48, (ctx) => {
    ctx.fillStyle = '#1c1712';
    ctx.fillRect(0, 0, 26, 48);
    ctx.fillStyle = '#120e0a';
    ctx.fillRect(2, 2, 22, 44);
    ctx.fillStyle = '#241d15';
    ctx.fillRect(4, 4, 18, 40);
    ctx.fillStyle = '#0d0a07';
    for (let y = 8; y < 42; y += 8) ctx.fillRect(5, y, 16, 1.5);
    // handle + scratched plate
    ctx.fillStyle = '#5c4a33';
    ctx.fillRect(18, 24, 3, 4);
    ctx.fillStyle = '#8a7a5c';
    ctx.fillRect(8, 6, 10, 3);
  });
  const door = new THREE.Mesh(
    new THREE.PlaneGeometry(1.35, 2.5),
    new THREE.MeshStandardMaterial({ map: doorTex, roughness: 0.9 }),
  );
  door.position.set(-12.5, 1.25, -7.9);
  scene.add(door);
  // The one working sodium lamp, hung over the studio door.
  const lampFixture = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.3), new THREE.MeshBasicMaterial({ color: '#151210' }));
  lampFixture.position.set(-12.5, 3.15, -7.7);
  scene.add(lampFixture);
  const doorLamp = new THREE.PointLight(AMBER, 14, 9, 2);
  doorLamp.position.set(-12.5, 2.7, -6.6);
  scene.add(doorLamp);
  keyLights.push(doorLamp);
  const doorStreak = new WetStreak(doorLamp, 'rgba(224,160,74,0.8)', 1.7, 6, 0.2);
  scene.add(doorStreak.mesh);
  tickers.push(doorStreak);

  // Police cordon: two stanchions + tape across the alley mouth.
  const stanchionMat = new THREE.MeshStandardMaterial({ color: '#17140f', roughness: 0.8 });
  for (const sx of [-14.4, -10.6]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.09, 1.1, 0.09), stanchionMat);
    post.position.set(sx, 0.55, -5.6);
    scene.add(post);
  }
  const tape = new THREE.Mesh(
    new THREE.PlaneGeometry(3.8, 0.16),
    new THREE.MeshStandardMaterial({ map: cordonTapeTex(), transparent: true, roughness: 0.7, side: THREE.DoubleSide }),
  );
  tape.position.set(-12.5, 0.95, -5.6);
  tape.rotation.y = 0.04;
  scene.add(tape);

  // Neon: minimal and meaningful. Noodles (warm), Memory Den (cold pink).
  const noodleSign = new NeonSign(signTex('麺 NOODLE', AMBER), 3.0, 0.9, 0.5, 3.3, -8.1, AMBER, 18);
  scene.add(noodleSign.group);
  tickers.push(noodleSign);
  keyLights.push(noodleSign.light);
  const noodleStreak = new WetStreak(noodleSign.light, 'rgba(224,160,74,0.75)', 2.0, 7, 0.2);
  scene.add(noodleStreak.mesh);
  tickers.push(noodleStreak);

  const denSign = new NeonSign(signTex('MEMORY DEN', PINK), 4.4, 1.25, 12.4, 3.6, -8.1, PINK, 22);
  denSign.flickerRate = 0.6;
  scene.add(denSign.group);
  tickers.push(denSign);
  keyLights.push(denSign.light);
  const denStreak = new WetStreak(denSign.light, 'rgba(232,110,168,0.8)', 2.6, 8, 0.24);
  scene.add(denStreak.mesh);
  tickers.push(denStreak);
  // The Den's doorway glow.
  const denDoorTex = pixelTex(30, 50, (ctx) => {
    ctx.fillStyle = '#141018';
    ctx.fillRect(0, 0, 30, 50);
    ctx.fillStyle = '#0d0a10';
    ctx.fillRect(3, 3, 24, 47);
    const g = ctx.createLinearGradient(0, 0, 0, 50);
    g.addColorStop(0, 'rgba(232,110,168,0.5)');
    g.addColorStop(1, 'rgba(99,216,232,0.25)');
    ctx.fillStyle = g;
    ctx.fillRect(5, 5, 20, 44);
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    for (let y = 5; y < 49; y += 4) ctx.fillRect(5, y, 20, 2);
  });
  const denDoor = new THREE.Mesh(
    new THREE.PlaneGeometry(1.5, 2.5),
    new THREE.MeshStandardMaterial({ map: denDoorTex, roughness: 0.8 }),
  );
  denDoor.position.set(12.4, 1.25, -7.9);
  scene.add(denDoor);

  // The billboard — the city selling what it steals.
  const billboard = new Billboard(5.5, 5.4, -8.0);
  scene.add(billboard.mesh, billboard.light);
  tickers.push(billboard);
  keyLights.push(billboard.light);

  // Noodle stand + vendor.
  const standLamp = buildNoodleStand(scene, 0, -6.2);
  keyLights.push(standLamp);

  // Dead camera on its pole, mid-block.
  const camLed = buildCamera(scene, -6.5, -6.0);
  tickers.push({
    update: () => {
      camLed.opacity = 0.25 + 0.75 * Math.max(0, Math.sin(performance.now() * 0.0016)) ** 8;
    },
  });

  // Steam, walkers, sparkles, drone.
  for (const sx of [-3.5, 8.5]) {
    const s = new Steam();
    s.group.position.set(sx, 0, -4.6);
    scene.add(s.group);
    tickers.push(s);
  }
  const walkers = new Walkers(5, -6.9);
  scene.add(walkers.group);
  tickers.push(walkers);
  const pts: [number, number][] = [];
  for (let i = 0; i < 42; i++) pts.push([-16 + Math.random() * 32, -5 + Math.random() * 8]);
  const sparkles = new Sparkles(pts);
  scene.add(sparkles.group);
  tickers.push(sparkles);
  const drone = new PatrolDrone();
  scene.add(drone.group);
  tickers.push(drone);
  keyLights.push(drone.light);

  // Base light: cold moon fill + faint warm ambient.
  scene.add(new THREE.AmbientLight('#2a2620', 0.5));
  const moon = new THREE.DirectionalLight('#3d4b66', 0.4);
  moon.position.set(3, 10, 6);
  scene.add(moon);

  /* ── Hotspots ───────────────────────────────────────────────────── */

  const hotspots: Hotspot[] = [
    {
      x: -11, radius: 1.7, glintY: 1.0, label: 'the cordon', kind: 'examine',
      fragment: 'cordon-log',
      lines: () => [
        'NAPD tape, already sagging in the rain. I thumb the seal chip: cordon logged 02:14, category "unattended death," case auto-filed to nobody in particular.',
        'No forced-entry flag. No follow-up scheduled. The city has decided this is furniture.',
        'The tape reads DO NOT CROSS. I cross.',
      ],
    },
    {
      x: -12.5, radius: 1.3, label: 'the studio door', kind: 'door',
      door: { target: 'studio', spawnX: -6.8 },
    },
    {
      x: -6.5, radius: 1.8, glintY: 4.3, label: 'the camera', kind: 'examine',
      fragment: 'dead-camera',
      lines: (cf) => cf.hasFragment('dead-camera')
        ? [
            'Still looping its forty seconds of rain. Somewhere, an editor is confident nobody would ever look twice.',
          ]
        : [
            'A municipal eye on a municipal pole. Status LED blinking the slow red of a dead thing pretending to work.',
            'I pull the feed on my wrist unit. The last three weeks are the same forty seconds of rain, looped. Clean splice. Municipal encryption.',
            'Someone edited this street out of the city’s memory — and had the keys to do it politely.',
          ],
    },
    {
      x: 0, radius: 2.0, glintY: 1.7, label: 'the noodle vendor', kind: 'examine',
      fragment: 'vendor-account',
      lines: (cf) => cf.hasFragment('vendor-account')
        ? [
            '"Still raining, detective." He refills my broth without being asked. In Sector 7 that counts as friendship.',
          ]
        : [
            'The only warm light on the block that isn’t selling anything but soup. The vendor doesn’t look up. "You’re here about the painter."',
            '"He had a visitor. Courier jacket, gray. A regular — always after midnight, always polite. Paid for two bowls once. The painter never came down for his."',
            '"That night?" He wipes the counter twice before answering. "That night the courier left calm. Like a man leaving an appointment."',
          ],
    },
    {
      x: 5.5, radius: 2.0, glintY: 4.6, label: 'the billboard', kind: 'examine',
      lines: () => [
        'EVERYBODY™ — BE MORE THAN ONE. A lifestyle brand for shared-experience implants. The ad runs on a loop above a street where a man was emptied.',
        'Every few seconds the panel glitches and, for one frame, sells the opposite. Nobody looks up. That’s the trick of this city: the confession is in plain sight, at billboard scale.',
      ],
    },
    {
      x: 12.4, radius: 1.5, label: 'the Memory Den', kind: 'door',
      door: {
        target: 'den',
        spawnX: -4.2,
        locked: (cf) =>
          cf.hasFlag('den-unlocked')
            ? null
            : 'The shutter is down. Pink light bleeds under it like something alive. Whatever the Den keeps, it keeps for people who arrive knowing what to ask.',
      },
    },
  ];

  return {
    id: 'street',
    name: 'NEW ANGELES — SECTOR 7',
    scene,
    exterior: true,
    bounds: { min: -14.2, max: 14 },
    cam: { y: 2.3, z: 13.5, lookY: 1.7 },
    hotspots,
    keyLights,
    tickers,
  };
}
