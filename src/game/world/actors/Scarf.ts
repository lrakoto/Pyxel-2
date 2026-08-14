import * as THREE from 'three';
import { TUNING } from '../../../tuning';

/**
 * Cole's loose scarf tail: a thin cloth ribbon simulated as a verlet chain of
 * point masses anchored at his neck. Gravity pulls it down, air-drag damps
 * it, and a wind force proportional to his velocity (plus turbulent gusts)
 * pushes it back and aloft. Distance constraints keep the segments together.
 * Because each point carries its own momentum, motion propagates down the
 * cloth — the tip lags and overshoots, a wave runs through it when he starts
 * or stops, and the gusts make it flutter — rather than swinging as one rigid
 * flap.
 *
 * The sim runs in world space (so it isn't fought by Cole's mirror-flip); the
 * mesh is added straight to the scene and its anchor is driven from his neck.
 * The outline picks up the neon color currently hitting Cole for an edge glow.
 *
 * Every parameter is read live from TUNING.scarf* so the in-app sliders tune
 * it without restart; length/width changes rebuild the ribbon geometry live.
 */
const SCARF_Z = 0.06;

export class Scarf {
  readonly mesh: THREE.Mesh;
  private readonly material: THREE.MeshStandardMaterial;
  private geo!: THREE.PlaneGeometry;
  private rows = 0;
  private readonly cols = 2;
  private length = TUNING.scarfLength;
  private width = TUNING.scarfWidth; // half-width
  private segLen = 0;
  private readonly env = { value: new THREE.Color(0, 0, 0) };
  private readonly glow = { value: TUNING.scarfGlow };
  private readonly dirX = { value: 0 };
  private readonly glintPos = { value: 0.5 };
  private readonly glintIntensity = { value: 0 };
  private t = 0;
  // Verlet point positions and their previous positions, in world space.
  private x: number[] = [];
  private y: number[] = [];
  private ox: number[] = [];
  private oy: number[] = [];

  constructor() {
    this.material = new THREE.MeshStandardMaterial({
      color: '#ee3333', // bright red; the edge glow reads against it
      roughness: 0.55,
      metalness: 0.1,
      emissive: new THREE.Color('#cc2222'),
      emissiveIntensity: 0.25,
      side: THREE.DoubleSide,
    });
    this.material.onBeforeCompile = (shader) => {
      shader.uniforms.uScarfEnv = this.env;
      shader.uniforms.uScarfGlow = this.glow;
      shader.uniforms.uScarfDirX = this.dirX;
      shader.uniforms.uScarfGlintPos = this.glintPos;
      shader.uniforms.uScarfGlintIntensity = this.glintIntensity;
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying float vScarfT;\nvarying float vScarfU;')
        .replace(
          '#include <begin_vertex>',
          '#include <begin_vertex>\nvScarfT = uv.y;\nvScarfU = uv.x;',
        );
      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          '#include <common>\nvarying float vScarfT;\nvarying float vScarfU;\nuniform vec3 uScarfEnv;\nuniform float uScarfGlow;\nuniform float uScarfDirX;\nuniform float uScarfGlintPos;\nuniform float uScarfGlintIntensity;',
        )
        .replace(
          '#include <tonemapping_fragment>',
           `// Directional edge glow: only the side facing the light source
            float bx = uScarfDirX > 0.0
              ? smoothstep(0.40, 0.5, vScarfU - 0.5)
              : smoothstep(0.40, 0.5, 0.5 - vScarfU);
            float border = bx;
            gl_FragColor.rgb += uScarfEnv * border * uScarfGlow;

            // Scarf glint catch — moves with the cloth sim
            float gy = 1.0 - smoothstep(0.01, 0.06, abs(vScarfT - uScarfGlintPos));
            float gx = 1.0 - smoothstep(0.0, 0.15, abs(vScarfU - 0.5));
            gl_FragColor.rgb += uScarfEnv * gx * gy * uScarfGlintIntensity;
            #include <tonemapping_fragment>`,
        );
    };

    this.build();
    this.mesh = new THREE.Mesh(this.geo, this.material);
    this.mesh.frustumCulled = false; // vertices are driven well outside the base bounds
  }

  /** (Re)builds the ribbon geometry and verlet points for the current size. */
  private build() {
    const segs = THREE.MathUtils.clamp(Math.round(this.length / 0.062), 6, 28);
    const old = this.geo;
    this.geo = new THREE.PlaneGeometry(this.width * 2, this.length, 1, segs);
    this.rows = segs + 1;
    this.segLen = this.length / (this.rows - 1);
    this.x = [];
    this.y = [];
    this.ox = [];
    this.oy = [];
    for (let i = 0; i < this.rows; i++) {
      this.x[i] = 0;
      this.y[i] = -i * this.segLen;
      this.ox[i] = 0;
      this.oy[i] = this.y[i];
    }
    old?.dispose();
  }

  update(dt: number, anchorX: number, anchorY: number, coleVx: number, env: THREE.Color, dirX: number) {
    this.t += dt;
    this.env.value.copy(env);
    this.glow.value = TUNING.scarfGlow;
    this.dirX.value = dirX;
    if (this.length !== TUNING.scarfLength || this.width !== TUNING.scarfWidth) {
      this.length = TUNING.scarfLength;
      this.width = TUNING.scarfWidth;
      this.build();
      this.mesh.geometry = this.geo;
    }
    const h = Math.min(dt, 1 / 30); // clamp the step so a stall can't explode the sim

    // Pin the top point to the neck.
    this.x[0] = anchorX;
    this.y[0] = anchorY;
    this.ox[0] = anchorX;
    this.oy[0] = anchorY;

    const gravity = -TUNING.scarfGravity;
    const speed = Math.abs(coleVx);
    const windX = -Math.sign(coleVx) * speed * TUNING.scarfWind; // air drags it backward
    const loft = speed * TUNING.scarfLoft; // lifts toward horizontal at speed
    const drag = TUNING.scarfDamping; // air-drag damping
    const flutter = TUNING.scarfFlutter; // gust strength
    for (let i = 1; i < this.rows; i++) {
      const tip = i / (this.rows - 1);
      // Turbulent gusts, stronger toward the free end, plus an always-on breeze.
      const gust = (Math.sin(this.t * 3.2 + i * 0.7) * 0.6 + Math.sin(this.t * 6.4 + i * 1.3) * 0.35) * flutter;
      const breeze = Math.sin(this.t * 1.3 + i * 0.45) * 0.25 * flutter;
      const fx = windX * tip + (gust + breeze) * (0.35 + 0.55 * tip);
      const fy = gravity + loft * tip + gust * 0.35;
      const vx = (this.x[i] - this.ox[i]) * drag;
      const vy = (this.y[i] - this.oy[i]) * drag;
      this.ox[i] = this.x[i];
      this.oy[i] = this.y[i];
      this.x[i] += vx + fx * h * h;
      this.y[i] += vy + fy * h * h;
    }

    // Satisfy segment-length constraints. More passes = stiffer chain that
    // stretches less, which reads as cloth rather than a springy rope.
    const passes = Math.round(TUNING.scarfStiffness);
    for (let pass = 0; pass < passes; pass++) {
      for (let i = 0; i < this.rows - 1; i++) {
        const dx = this.x[i + 1] - this.x[i];
        const dy = this.y[i + 1] - this.y[i];
        const dist = Math.hypot(dx, dy) || 1e-5;
        const diff = (dist - this.segLen) / dist;
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

    // Lay the ribbon's two edges across each chain point, offset along the
    // local perpendicular so the width stays constant as the cloth bends.
    const pos = this.geo.attributes.position as THREE.BufferAttribute;
    for (let r = 0; r < this.rows; r++) {
      const a = Math.max(0, r - 1);
      const b = Math.min(this.rows - 1, r + 1);
      let tx = this.x[b] - this.x[a];
      let ty = this.y[b] - this.y[a];
      const tl = Math.hypot(tx, ty) || 1;
      tx /= tl;
      ty /= tl;
      const nx = -ty; // perpendicular to the tangent
      const ny = tx;
      for (let c = 0; c < this.cols; c++) {
        const s = (c === 0 ? -1 : 1) * this.width;
        const i = r * this.cols + c;
        pos.setXYZ(i, this.x[r] + nx * s, this.y[r] + ny * s, SCARF_Z);
      }
    }
    pos.needsUpdate = true;

    // Glint drifts along the scarf driven by the cloth sim turbulence
    this.glintPos.value = 0.3 + 0.5 * (0.5 + 0.5 * Math.sin(this.t * 1.5));
    this.glintIntensity.value = TUNING.scarfGlow * (0.2 + 0.15 * Math.abs(Math.sin(this.t * 2.1)));
  }
}
