import * as THREE from 'three';
import { pixelTex, softTex } from '../core/tex';

/**
 * Detective Xander Darius Cole — drawn fresh for this take. 32×56 texels,
 * side profile, warm charcoal coat with a sodium-lit right edge, low hat,
 * dark red scarf whose loose tail is a small verlet ribbon. The palette
 * keeps him on the warm side of the game's amber/teal split: Cole belongs
 * to Everybody.
 */

const W = 32;
const H = 56;
export const COLE_HEIGHT = 1.84;
const SPEED = 4.0;

const P = {
  hat: '#1b1713',
  brim: '#26201a',
  band: '#5c4326',
  skin: '#c79a72',
  shade: '#7d5c42',
  lens: '#101216',
  lensEdge: '#2b3f4a',
  coat: '#2e2a26',
  coatDark: '#1d1a17',
  lapel: '#403a33',
  edge: '#8a6c3f',
  scarf: '#8e2f2f',
  scarfDark: '#5e1f22',
  belt: '#151210',
  legs: '#221f1c',
  legHi: '#2d2925',
  boots: '#12100e',
};

interface Pose {
  stride?: number;
  crouch?: number;
}

function drawCole({ stride = 0, crouch = 0 }: Pose = {}): THREE.CanvasTexture {
  return pixelTex(W, H, (ctx) => {
    const rect = (c: string, x: number, y: number, w: number, h: number) => {
      ctx.fillStyle = c;
      ctx.fillRect(Math.round(x), Math.round(y + crouch), w, h);
    };
    const poly = (c: string, pts: [number, number][]) => {
      ctx.fillStyle = c;
      ctx.beginPath();
      pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y + crouch) : ctx.moveTo(x, y + crouch)));
      ctx.closePath();
      ctx.fill();
    };

    // Hat: low crown, band catching sodium light, brim dipped forward.
    rect(P.hat, 11, 2, 10, 6);
    rect(P.hat, 10, 4, 12, 4);
    rect(P.band, 10, 8, 13, 1);
    rect(P.brim, 7, 9, 20, 2);
    rect('#0b0906', 9, 10, 17, 1);
    rect(P.edge, 21, 3, 1, 5);

    // Head in profile: rear hair, warm face, slim lens, nose and jaw.
    rect('#241a12', 11, 11, 4, 8);
    rect(P.shade, 13, 11, 9, 9);
    rect(P.skin, 15, 12, 8, 6);
    rect(P.skin, 22, 14, 3, 2);
    rect(P.skin, 23, 15, 2, 2);
    rect(P.lens, 16, 13, 8, 2);
    rect(P.lensEdge, 21, 13, 2, 1);
    rect(P.shade, 16, 18, 7, 1);
    rect(P.skin, 17, 19, 5, 1);

    // Scarf wrap at the throat (the tail is simulated separately).
    rect(P.scarfDark, 11, 20, 12, 2);
    rect(P.scarf, 12, 22, 10, 2);

    // Coat: broad shoulders, long body, warm-lit right edge.
    poly(P.coatDark, [[6, 24], [12, 22], [24, 23], [27, 28], [24, 44], [17, 47], [8, 45], [5, 30]]);
    poly(P.coat, [[8, 24], [13, 23], [23, 24], [25, 29], [22, 43], [16, 46], [9, 44], [7, 30]]);
    poly(P.lapel, [[10, 24], [15, 23], [13, 33], [9, 29]]);
    poly(P.lapel, [[20, 24], [23, 27], [19, 33], [16, 24]]);
    rect(P.belt, 10, 34, 13, 2);
    rect('#6b5533', 16, 34, 3, 2);
    // Split coat tails.
    poly(P.coatDark, [[10, 36], [16, 37], [15, 46], [8, 44]]);
    poly('#17140f', [[16, 37], [22, 36], [24, 43], [17, 46]]);
    // Sodium rim on the leading edge.
    rect(P.edge, 24, 26, 1, 15);

    // Arms counter-swing.
    const arm = Math.round(stride * 2);
    poly(P.coat, [[8, 25], [11, 26], [10 + arm, 36], [7 + arm, 36], [6, 29]]);
    rect(P.boots, 7 + arm, 35, 4, 4);
    poly(P.coat, [[22, 25], [25, 28], [23 - arm, 36], [20 - arm, 35], [20, 28]]);
    rect(P.boots, 20 - arm, 35, 4, 4);

    // Legs: six-phase stride.
    const front = Math.round(stride * 5);
    const back = Math.round(-stride * 4);
    poly(P.legHi, [[14, 43], [18, 43], [20 + front, 49], [19 + front, 53], [16 + front, 53], [16, 48]]);
    poly(P.legs, [[10, 43], [14, 43], [12 + back, 49], [11 + back, 53], [8 + back, 53], [9, 48]]);
    rect(P.boots, 15 + front, 52, 7, 3);
    rect(P.boots, 7 + back, 52, 7, 3);
    rect('#3a332b', 17 + front, 52, 3, 1);
  });
}

const FRAMES = {
  idle: drawCole(),
  walk: [-1, -0.6, -0.15, 0.15, 0.6, 1].map((stride) => drawCole({ stride })),
};

/** Loose scarf tail: a small verlet chain rendered as a ribbon strip. */
class ScarfTail {
  readonly mesh: THREE.Mesh;
  private readonly N = 8;
  private readonly segLen = 0.12;
  private readonly x: number[] = [];
  private readonly y: number[] = [];
  private readonly ox: number[] = [];
  private readonly oy: number[] = [];
  private readonly geo: THREE.PlaneGeometry;
  private t = 0;

  constructor() {
    this.geo = new THREE.PlaneGeometry(0.09, this.N * this.segLen, 1, this.N - 1);
    const mat = new THREE.MeshStandardMaterial({
      color: '#a33636',
      emissive: '#5e1616',
      emissiveIntensity: 0.35,
      roughness: 0.6,
      side: THREE.DoubleSide,
    });
    this.mesh = new THREE.Mesh(this.geo, mat);
    this.mesh.frustumCulled = false;
    for (let i = 0; i < this.N; i++) {
      this.x[i] = 0;
      this.y[i] = -i * this.segLen;
      this.ox[i] = 0;
      this.oy[i] = this.y[i];
    }
  }

  update(dt: number, ax: number, ay: number, vx: number) {
    this.t += dt;
    const h = Math.min(dt, 1 / 30);
    this.x[0] = ax;
    this.y[0] = ay;
    for (let i = 1; i < this.N; i++) {
      const tip = i / (this.N - 1);
      const gust = Math.sin(this.t * 3.1 + i * 0.8) * 2.2 + Math.sin(this.t * 6.7 + i) * 1.1;
      const fx = -Math.sign(vx) * Math.abs(vx) * 1.4 * tip + gust * (0.3 + 0.6 * tip);
      const fy = -5 + Math.abs(vx) * 1.5 * tip;
      const dx = (this.x[i] - this.ox[i]) * 0.85;
      const dy = (this.y[i] - this.oy[i]) * 0.85;
      this.ox[i] = this.x[i];
      this.oy[i] = this.y[i];
      this.x[i] += dx + fx * h * h;
      this.y[i] += dy + fy * h * h;
    }
    for (let pass = 0; pass < 10; pass++) {
      for (let i = 0; i < this.N - 1; i++) {
        const dx = this.x[i + 1] - this.x[i];
        const dy = this.y[i + 1] - this.y[i];
        const d = Math.hypot(dx, dy) || 1e-5;
        const diff = (d - this.segLen) / d;
        if (i === 0) {
          this.x[i + 1] -= dx * diff;
          this.y[i + 1] -= dy * diff;
        } else {
          this.x[i] += dx * diff * 0.5;
          this.y[i] += dy * diff * 0.5;
          this.x[i + 1] -= dx * diff * 0.5;
          this.y[i + 1] -= dy * diff * 0.5;
        }
      }
    }
    const pos = this.geo.attributes.position as THREE.BufferAttribute;
    for (let r = 0; r < this.N; r++) {
      const a = Math.max(0, r - 1);
      const b = Math.min(this.N - 1, r + 1);
      let tx = this.x[b] - this.x[a];
      let ty = this.y[b] - this.y[a];
      const tl = Math.hypot(tx, ty) || 1;
      tx /= tl;
      ty /= tl;
      const half = 0.045;
      pos.setXYZ(r * 2, this.x[r] + -ty * half, this.y[r] + tx * half, 0.05);
      pos.setXYZ(r * 2 + 1, this.x[r] + ty * half, this.y[r] - tx * half, 0.05);
    }
    pos.needsUpdate = true;
  }
}

/**
 * The playable detective: lit sprite billboard with a soft neon rim (edge
 * detection on the sprite's alpha, tinted by the nearest key lights) and the
 * scarf tail. Movement is plain left/right within scene bounds.
 */
export class Cole {
  readonly mesh: THREE.Mesh;
  readonly shadow: THREE.Mesh;
  readonly scarf = new ScarfTail();
  x = 0;
  facing = 1;

  private readonly material: THREE.MeshStandardMaterial;
  private bounds = { min: -14, max: 14 };
  private walkTimer = 0;
  private walkIdx = 0;
  private prevX = 0;
  private readonly rimColor = { value: new THREE.Color(0, 0, 0) };
  private readonly rimDir = { value: 0 };

  constructor() {
    this.material = new THREE.MeshStandardMaterial({
      map: FRAMES.idle,
      transparent: true,
      alphaTest: 0.5,
      roughness: 0.9,
      metalness: 0,
      side: THREE.DoubleSide,
    });
    this.material.onBeforeCompile = (shader) => {
      shader.uniforms.uRimColor = this.rimColor;
      shader.uniforms.uRimDir = this.rimDir;
      shader.fragmentShader =
        `uniform vec3 uRimColor;\nuniform float uRimDir;\n` +
        shader.fragmentShader.replace(
          '#include <tonemapping_fragment>',
          `#ifdef USE_MAP
             vec2 texel = vec2(1.0/32.0, 1.0/56.0);
             float eL = 1.0 - texture2D(map, vMapUv - vec2(texel.x, 0.0)).a;
             float eR = 1.0 - texture2D(map, vMapUv + vec2(texel.x, 0.0)).a;
             float eU = 1.0 - texture2D(map, vMapUv + vec2(0.0, texel.y)).a;
             float edge = max(uRimDir, 0.0) * eR + max(-uRimDir, 0.0) * eL + 0.35 * eU;
             gl_FragColor.rgb += uRimColor * clamp(edge, 0.0, 1.4);
           #endif
           #include <tonemapping_fragment>`,
        );
    };
    const w = COLE_HEIGHT * (W / H);
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, COLE_HEIGHT), this.material);
    this.mesh.position.set(0, COLE_HEIGHT / 2, 0);

    const shadowTex = softTex(64, 64, (ctx) => {
      const g = ctx.createRadialGradient(32, 32, 1, 32, 32, 30);
      g.addColorStop(0, 'rgba(0,0,0,0.5)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 64, 64);
    });
    this.shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(1.15, 0.32),
      new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }),
    );
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.position.y = 0.02;
  }

  addTo(scene: THREE.Scene) {
    scene.add(this.mesh, this.shadow, this.scarf.mesh);
  }

  removeFrom(scene: THREE.Scene) {
    scene.remove(this.mesh, this.shadow, this.scarf.mesh);
  }

  setBounds(min: number, max: number) {
    this.bounds = { min, max };
  }

  place(x: number, facing = 1) {
    this.x = x;
    this.prevX = x;
    this.facing = facing;
  }

  update(dt: number, left: boolean, right: boolean) {
    const dir = (right ? 1 : 0) - (left ? 1 : 0);
    if (dir !== 0) {
      this.facing = dir;
      this.x = THREE.MathUtils.clamp(this.x + dir * SPEED * dt, this.bounds.min, this.bounds.max);
      this.walkTimer += dt;
      if (this.walkTimer >= 0.11) {
        this.walkTimer -= 0.11;
        this.walkIdx = (this.walkIdx + 1) % FRAMES.walk.length;
      }
      this.material.map = FRAMES.walk[this.walkIdx];
    } else {
      this.material.map = FRAMES.idle;
      this.walkTimer = 0.1;
    }

    const breathe = Math.sin(performance.now() * 0.0028) * 0.008;
    const bob = dir !== 0 ? Math.abs(Math.sin(performance.now() * 0.012)) * 0.03 : breathe;
    this.mesh.position.set(this.x, COLE_HEIGHT / 2 + bob, 0);
    this.mesh.scale.x = this.facing;
    this.shadow.position.x = this.x;

    const vx = dt > 0 ? (this.x - this.prevX) / dt : 0;
    this.prevX = this.x;
    this.scarf.update(dt, this.x + 0.04 * this.facing, COLE_HEIGHT * 0.62 + bob, vx);
  }

  /** Aggregates the scene's key lights into the rim tint each frame. */
  updateRim(lights: THREE.PointLight[]) {
    let r = 0;
    let g = 0;
    let b = 0;
    let dirX = 0;
    let total = 0;
    for (const l of lights) {
      const dx = l.position.x - this.x;
      const dy = l.position.y - 1.2;
      const dz = l.position.z;
      const d2 = Math.max(dx * dx + dy * dy + dz * dz, 1);
      const w = l.intensity / d2;
      r += l.color.r * w;
      g += l.color.g * w;
      b += l.color.b * w;
      dirX += (dx / Math.sqrt(d2)) * w;
      total += w;
    }
    if (total <= 0.001) {
      this.rimColor.value.setScalar(0);
      return;
    }
    const peak = Math.max(r, g, b);
    this.rimColor.value.setRGB(r / peak, g / peak, b / peak).multiplyScalar(Math.min(total * 1.5, 2.1));
    this.rimDir.value = THREE.MathUtils.clamp(dirX / total, -1, 1) * this.facing;
  }
}
