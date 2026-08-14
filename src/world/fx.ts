import * as THREE from 'three';
import { glowTex, softTex } from '../core/tex';
import type { Ticker } from './types';

/** Wind-blown rain streaks as additive line segments. */
export class Rain implements Ticker {
  readonly object: THREE.LineSegments;
  private readonly heads: Float32Array;
  private readonly positions: THREE.BufferAttribute;
  private readonly count: number;
  private readonly top: number;
  private readonly span: number;
  camX = 0;

  constructor(count = 300, top = 13, span = 36, opacity = 0.28) {
    this.count = count;
    this.top = top;
    this.span = span;
    this.heads = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) this.spawn(i, Math.random() * top);
    const geo = new THREE.BufferGeometry();
    this.positions = new THREE.BufferAttribute(new Float32Array(count * 6), 3);
    geo.setAttribute('position', this.positions);
    this.object = new THREE.LineSegments(
      geo,
      new THREE.LineBasicMaterial({
        color: 0x6d84a3,
        transparent: true,
        opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    this.object.frustumCulled = false;
  }

  private spawn(i: number, y: number) {
    this.heads[i * 3] = this.camX + (Math.random() - 0.5) * this.span;
    this.heads[i * 3 + 1] = y;
    this.heads[i * 3 + 2] = -13 + Math.random() * 18;
  }

  update(dt: number) {
    const arr = this.positions.array as Float32Array;
    const vx = -2.1;
    const vy = -18.5;
    for (let i = 0; i < this.count; i++) {
      this.heads[i * 3] += vx * dt;
      this.heads[i * 3 + 1] += vy * dt;
      if (this.heads[i * 3 + 1] < 0) this.spawn(i, this.top - Math.random() * 2);
      const x = this.heads[i * 3];
      const y = this.heads[i * 3 + 1];
      const z = this.heads[i * 3 + 2];
      arr[i * 6] = x;
      arr[i * 6 + 1] = y;
      arr[i * 6 + 2] = z;
      arr[i * 6 + 3] = x - vx * 0.012;
      arr[i * 6 + 4] = y - vy * 0.012;
      arr[i * 6 + 5] = z;
    }
    this.positions.needsUpdate = true;
  }
}

/**
 * A fake wet-street reflection: a vertical gradient streak laid flat on the
 * ground under a light, pointing at the camera. Opacity follows the light's
 * live intensity, so a flickering sign flickers in its own reflection —
 * the classic neon-noir cheat, and it costs one quad per light.
 */
export class WetStreak implements Ticker {
  readonly mesh: THREE.Mesh;
  private readonly mat: THREE.MeshBasicMaterial;
  private readonly baseOpacity: number;
  private readonly light: THREE.PointLight;
  private readonly baseIntensity: number;

  constructor(light: THREE.PointLight, color: string, width = 1.6, length = 7, opacity = 0.22) {
    this.light = light;
    this.baseIntensity = Math.max(light.intensity, 0.001);
    this.baseOpacity = opacity;
    const tex = softTex(32, 128, (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, color);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      // Broken water surface: punch horizontal gaps out of the streak.
      ctx.globalCompositeOperation = 'destination-out';
      for (let i = 0; i < 26; i++) {
        ctx.globalAlpha = 0.25 + Math.random() * 0.5;
        ctx.fillRect(0, Math.random() * h, w, 1 + Math.random() * 2);
      }
    });
    this.mat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, length), this.mat);
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.position.set(light.position.x, 0.015, light.position.z + length / 2 + 0.4);
  }

  update(_dt: number) {
    this.mat.opacity = this.baseOpacity * Math.min(1.2, this.light.intensity / this.baseIntensity);
  }
}

/** Small ground flecks that twinkle — cheap rain-on-asphalt sparkle. */
export class Sparkles implements Ticker {
  readonly group = new THREE.Group();
  private readonly items: { mat: THREE.MeshBasicMaterial; phase: number; speed: number }[] = [];
  private t = 0;

  constructor(points: [number, number][], color = '#cfe0f4', size = 0.06) {
    const geo = new THREE.PlaneGeometry(size, size * 0.4);
    for (const [x, z] of points) {
      const mat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, 0.05, z);
      this.group.add(mesh);
      this.items.push({ mat, phase: Math.random() * 10, speed: 0.4 + Math.random() * 1.4 });
    }
  }

  update(dt: number) {
    this.t += dt;
    for (const it of this.items) {
      const s = Math.sin(this.t * it.speed + it.phase);
      it.mat.opacity = Math.max(0, s) ** 6 * 0.65;
    }
  }
}

/** Looping steam wisps from a street vent. */
export class Steam implements Ticker {
  readonly group = new THREE.Group();
  private readonly puffs: { mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial; phase: number; speed: number }[] = [];
  private t = Math.random() * 10;

  constructor() {
    const tex = glowTex(32, 'rgba(196, 208, 224, 0.5)', 0.6);
    for (let i = 0; i < 5; i++) {
      const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.7), mat);
      this.group.add(mesh);
      this.puffs.push({ mesh, mat, phase: i / 5, speed: 0.26 + Math.random() * 0.1 });
    }
  }

  update(dt: number) {
    this.t += dt;
    for (const p of this.puffs) {
      const s = (this.t * p.speed + p.phase) % 1;
      p.mesh.position.set(Math.sin(s * 6 + p.phase * 18) * 0.12, 0.2 + s * 1.9, 0);
      p.mesh.scale.setScalar(0.6 + s * 1.6);
      p.mat.opacity = Math.sin(s * Math.PI) * 0.24;
    }
  }
}

/** The marker over an uncollected hotspot: a slow-pulsing four-point star. */
export class Marker implements Ticker {
  readonly sprite: THREE.Sprite;
  private phase = Math.random() * Math.PI * 2;
  /** Set each frame by the game: 0..1 proximity emphasis. */
  near = 0;

  constructor(color = '#79e8ff') {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255,255,255,0.95)');
    grad.addColorStop(0.3, color);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);
    ctx.strokeStyle = 'rgba(235,250,255,0.85)';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(16, 4);
    ctx.lineTo(16, 28);
    ctx.moveTo(4, 16);
    ctx.lineTo(28, 16);
    ctx.stroke();
    const tex = new THREE.CanvasTexture(canvas);
    this.sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: tex,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        opacity: 0.7,
      }),
    );
    this.sprite.scale.setScalar(0.2);
  }

  update(dt: number) {
    if (!this.sprite.visible) return;
    this.phase += dt * (2.2 + this.near * 3.5);
    const pulse = 0.7 + 0.3 * Math.sin(this.phase);
    const mat = this.sprite.material as THREE.SpriteMaterial;
    mat.opacity = (0.28 + 0.5 * this.near) * pulse + 0.12;
    this.sprite.scale.setScalar(0.16 * (1 + this.near * 0.7) * (0.9 + 0.2 * pulse));
  }

  dispose() {
    const mat = this.sprite.material as THREE.SpriteMaterial;
    mat.map?.dispose();
    mat.dispose();
  }
}

/** Distant silhouettes drifting along the far sidewalk. */
export class Walkers implements Ticker {
  readonly group = new THREE.Group();
  private readonly items: { mesh: THREE.Mesh; speed: number; dir: number }[] = [];

  constructor(count: number, z: number, tones = ['#221f24', '#26221f', '#1e2226']) {
    for (let i = 0; i < count; i++) {
      const tone = tones[i % tones.length];
      const h = 1.35 + Math.random() * 0.25;
      const tex = softTex(12, 26, (ctx) => {
        ctx.fillStyle = tone;
        // hooded silhouette
        ctx.beginPath();
        ctx.ellipse(6, 4, 3.4, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(2.4, 6, 7.2, 14);
        ctx.fillRect(3.4, 20, 2.2, 6);
        ctx.fillRect(6.6, 20, 2.2, 6);
      });
      tex.magFilter = THREE.NearestFilter;
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(h * (12 / 26), h),
        new THREE.MeshStandardMaterial({ map: tex, transparent: true, alphaTest: 0.4, roughness: 0.95 }),
      );
      mesh.position.set(-26 + Math.random() * 52, h / 2, z - Math.random() * 1.2);
      this.group.add(mesh);
      this.items.push({ mesh, speed: 0.5 + Math.random() * 0.9, dir: Math.random() < 0.5 ? 1 : -1 });
    }
  }

  update(dt: number) {
    for (const it of this.items) {
      it.mesh.position.x += it.dir * it.speed * dt;
      if (it.mesh.position.x > 27) it.mesh.position.x = -27;
      if (it.mesh.position.x < -27) it.mesh.position.x = 27;
      it.mesh.scale.x = it.dir;
      it.mesh.position.y =
        (it.mesh.geometry as THREE.PlaneGeometry).parameters.height / 2 +
        Math.abs(Math.sin(performance.now() * 0.008 * it.speed + it.mesh.position.x)) * 0.02;
    }
  }
}

/** A neon sign quad + matched point light with organic flicker. */
export class NeonSign implements Ticker {
  readonly group = new THREE.Group();
  readonly light: THREE.PointLight;
  private readonly mat: THREE.MeshBasicMaterial;
  private readonly base: number;
  private target = 1;
  private level = 1;
  /** Chance per second of a brown-out dip. */
  flickerRate = 1.0;

  constructor(tex: THREE.Texture, w: number, h: number, x: number, y: number, z: number, color: string, intensity = 22) {
    this.base = intensity;
    this.mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), this.mat);
    mesh.position.set(x, y, z);
    this.light = new THREE.PointLight(color, intensity, 15, 2);
    this.light.position.set(x, y - 0.7, z + 2.4);
    this.group.add(mesh, this.light);
  }

  update(dt: number) {
    if (Math.random() < dt * this.flickerRate) {
      this.target = Math.random() < 0.2 ? 0.15 + Math.random() * 0.3 : 1;
    }
    this.level += (this.target - this.level) * Math.min(1, dt * 16);
    this.light.intensity = this.base * this.level;
    this.mat.opacity = 0.5 + 0.5 * this.level;
  }
}
