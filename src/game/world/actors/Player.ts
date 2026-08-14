import * as THREE from 'three';
import { loadSheet, hasSheet, type SpriteSheet } from '../../../engine/sprites/SpriteLibrary';
import { SpriteAnimator } from '../../../engine/sprites/SpriteAnimator';
import { COLE_W, COLE_H, COLE_FRAMES } from './sprites';
import { Scarf } from './Scarf';

/**
 * Detective Cole: side-profile pixel sprite facing his direction of travel
 * (mirrored when he turns) — wide-brim hat, dark trench coat with lapel and
 * back-seam shading, and a scarf wrapped at the neck. Body frames are drawn
 * at 32x56 in actors/sprites.ts (the detail level the Aseprite pipeline
 * imports at), so a compiled real sheet is a content drop with the same
 * proportions and anchor points. The loose scarf tail is a separate cloth
 * ribbon (see Scarf) so it can react to wind/gravity independently.
 */
const SPRITE_W = COLE_W;
const SPRITE_H = COLE_H;

export interface MoveInput {
  left: boolean;
  right: boolean;
  /** Edge-triggered: true on the frame a jump should start (caller debounces). */
  jump?: boolean;
}

/** Optional bounds override, set by the area on transition. */
export interface MoveBounds {
  min: number;
  max: number;
}

/**
 * Wet rim glow: a camera-facing sprite has one flat normal, so fresnel can't
 * find its edges. Instead the shader samples the sprite's alpha one texel to
 * each side — opaque pixels bordering transparency are the silhouette — and
 * tints them with the color of the neon lights currently hitting Cole,
 * weighted toward the side the light comes from.
 */
const RIM_DECLS = `
uniform vec3 uRimColor;
uniform float uRimDirX;
uniform float uRimUp;
uniform vec2 uRimTexel;
uniform float uSpeed;
uniform vec3 uGlintColor0;
uniform float uGlintPos0;
uniform float uGlintSize0;
uniform vec3 uGlintColor1;
uniform float uGlintPos1;
uniform float uGlintSize1;
`;

const RIM_GLSL = `
#ifdef USE_MAP
  float rimL = 1.0 - texture2D(map, vMapUv - vec2(uRimTexel.x, 0.0)).a;
  float rimR = 1.0 - texture2D(map, vMapUv + vec2(uRimTexel.x, 0.0)).a;
  float rimU = 1.0 - texture2D(map, vMapUv + vec2(0.0, uRimTexel.y)).a;
  float rimEdge = max(uRimDirX, 0.0) * rimR
                + max(-uRimDirX, 0.0) * rimL
                + uRimUp * rimU;
  gl_FragColor.rgb += uRimColor * clamp(rimEdge, 0.0, 1.5);

  // Per-light reflections on sunglasses
  float lensLeft = 0.48;
  float lensRight = 0.74;
  float lensWidth = lensRight - lensLeft;
  vec3 glintAccum = vec3(0.0);

  float pos0 = lensLeft + uGlintPos0 * lensWidth;
  float d0 = sqrt((vMapUv.x - pos0) * (vMapUv.x - pos0) + (vMapUv.y - 0.80) * (vMapUv.y - 0.80));
  float g0 = 1.0 - smoothstep(0.008, uGlintSize0, d0);
  glintAccum += uGlintColor0 * g0;

  float pos1 = lensLeft + uGlintPos1 * lensWidth;
  float d1 = sqrt((vMapUv.x - pos1) * (vMapUv.x - pos1) + (vMapUv.y - 0.80) * (vMapUv.y - 0.80));
  float g1 = 1.0 - smoothstep(0.008, uGlintSize1, d1);
  glintAccum += uGlintColor1 * g1;

  // Soft edge fade so reflections wrap around the curved lens surface
  float lensFade = smoothstep(0.46, 0.50, vMapUv.x)
                * (1.0 - smoothstep(0.72, 0.76, vMapUv.x))
                * smoothstep(0.75, 0.78, vMapUv.y)
                * (1.0 - smoothstep(0.82, 0.84, vMapUv.y));
  glintAccum *= lensFade;

  float glintPresent = clamp(length(glintAccum) * 8.0, 0.0, 1.0);
  gl_FragColor.rgb += glintAccum * 2.5 + vec3(glintPresent * 0.3);
#endif
`;

const SPEED = 4.2;
const WORLD_BOUND = 16;
/** Seconds per walk frame — cadence of the walk cycle. */
const WALK_FRAME = 0.11;
/** How long the land-impact pose holds before settling to idle. */
const LAND_TIME = 0.12;
const HEIGHT = 1.86;
// Jump: tuned so a tap clears ~1.4 world units and hangs for ~0.7s.
const JUMP_V = 6.4;
const GRAVITY = 18;

// World-space y of Cole's neck, where the scarf hangs from.
const NECK_Y = HEIGHT * 0.625;

export class Player {
  readonly mesh: THREE.Mesh;
  readonly shadowObject: THREE.Mesh;
  x = 0;

  private readonly material: THREE.MeshStandardMaterial;
  private readonly scarf = new Scarf();
  private facing = 1;
  private prevX = 0;
  private jumpY = 0; // height of feet above the ground (0 = grounded)
  private vy = 0;
  /** Frame texel size for the rim shader; updated if a .aseprite sheet takes over. */
  private spriteW = SPRITE_W;
  private spriteH = SPRITE_H;
  // Aseprite-driven state (present once a real sheet has loaded).
  private sheet: SpriteSheet | null = null;
  private animator: SpriteAnimator | null = null;
  private sheetReady = false;
  private currentTag = '';
  // Procedural-frame animation state (the default path).
  private procState: 'idle' | 'walk' | 'air' = 'idle';
  private procTimer = 0;
  private procIdx = 0;
  private landTimer = 0;
  private readonly rimUniforms = {
    uRimColor: { value: new THREE.Color(0, 0, 0) },
    uRimDirX: { value: 0 },
    uRimUp: { value: 0.3 },
    uRimTexel: { value: new THREE.Vector2(1 / SPRITE_W, 1 / SPRITE_H) },
    uSpeed: { value: 0 },
    uGlintColor0: { value: new THREE.Color(0, 0, 0) },
    uGlintPos0: { value: 0.5 },
    uGlintSize0: { value: 0.035 },
    uGlintColor1: { value: new THREE.Color(0, 0, 0) },
    uGlintPos1: { value: 0.5 },
    uGlintSize1: { value: 0.035 },
  };

  constructor() {
    this.material = new THREE.MeshStandardMaterial({
      map: COLE_FRAMES.idle[0],
      transparent: true,
      alphaTest: 0.5,
      roughness: 0.9,
      metalness: 0,
      side: THREE.DoubleSide,
    });
    this.material.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, this.rimUniforms);
      shader.fragmentShader = RIM_DECLS + shader.fragmentShader.replace(
        '#include <tonemapping_fragment>',
        `${RIM_GLSL}\n#include <tonemapping_fragment>`,
      );
    };
    const width = HEIGHT * (SPRITE_W / SPRITE_H);
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, HEIGHT), this.material);
    this.mesh.position.set(0, HEIGHT / 2, 0);

    // Ground shadow
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 64;
    shadowCanvas.height = 64;
    const sctx = shadowCanvas.getContext('2d')!;
    const grad = sctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(0,0,0,0.55)');
    grad.addColorStop(0.3, 'rgba(0,0,0,0.30)');
    grad.addColorStop(0.6, 'rgba(0,0,0,0.10)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    sctx.fillStyle = grad;
    sctx.fillRect(0, 0, 64, 64);
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    this.shadowObject = new THREE.Mesh(
      new THREE.PlaneGeometry(1.2, 0.35),
      new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0.8 }),
    );
    this.shadowObject.rotation.x = -Math.PI / 2;
    this.shadowObject.position.set(0, 0.02, -4);
    this.shadowObject.renderOrder = -1;

    // Upgrade path: when the compiled Aseprite sheet appears, swap the
    // procedural frames for the real animation. Everything else (rim, scarf,
    // muzzle point) keeps working because the world-space proportions stay
    // the same.
    void this.tryUpgradeArt();
  }

  private async tryUpgradeArt() {
    if (!(await hasSheet('cole'))) return;
    const sheet = await loadSheet('cole');
    if (!sheet || this.sheetReady) return;
    this.sheet = sheet;
    this.sheetReady = true;
    this.spriteW = sheet.frames[0]?.w ?? SPRITE_W;
    this.spriteH = sheet.frames[0]?.h ?? SPRITE_H;
    this.rimUniforms.uRimTexel.value.set(1 / this.spriteW, 1 / this.spriteH);
    // Rebuild the plane at the new aspect so the world height stays constant
    // while the silhouette gains detail.
    this.mesh.geometry.dispose();
    this.mesh.geometry = new THREE.PlaneGeometry(HEIGHT * sheet.aspect, HEIGHT);
    this.animator = new SpriteAnimator(sheet, this.material);
    this.animator.play({ tag: 'idle' });
    this.currentTag = 'idle';
  }

  /** The scarf simulates in world space, so Game adds it to the scene directly. */
  get scarfMesh(): THREE.Mesh {
    return this.scarf.mesh;
  }

  /** Set facing direction (1 = right, -1 = left). Used on area transitions. */
  setFacing(dir: number) {
    this.facing = dir;
    this.mesh.scale.x = dir;
  }

  /** Bounds for player movement, set by the active area. */
  private bounds: MoveBounds = { min: -WORLD_BOUND, max: WORLD_BOUND };

  /** Set the movement bounds (called on area transition). */
  setBounds(min: number, max: number) {
    this.bounds = { min, max };
  }

  update(dt: number, input: MoveInput) {
    const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    const walking = dir !== 0;

    if (walking) {
      this.facing = dir;
      this.x = THREE.MathUtils.clamp(this.x + dir * SPEED * dt, this.bounds.min, this.bounds.max);
    }

    // Jump physics. A jump only starts from the ground; gravity then arcs the
    // body up and back down, landing the feet at y=0.
    const wasAirborne = this.jumpY > 0;
    if (input.jump && this.jumpY <= 0) {
      this.vy = JUMP_V;
    }
    if (this.vy !== 0 || this.jumpY > 0) {
      this.jumpY += this.vy * dt;
      this.vy -= GRAVITY * dt;
      if (this.jumpY <= 0) {
        this.jumpY = 0;
        this.vy = 0;
        if (wasAirborne) this.landTimer = LAND_TIME; // touched down this frame
      }
    }
    const airborne = this.jumpY > 0;

    if (this.animator) {
      // Aseprite-driven: map the same state onto authored tags when present.
      const wanted: 'idle' | 'walk' | 'air' = airborne ? 'air' : walking ? 'walk' : 'idle';
      if (wanted !== this.procState || (wanted === 'idle' && this.landTimer > 0)) {
        this.procState = wanted;
        const tag = wanted === 'air' ? 'jump' : wanted === 'walk' ? 'walk' : 'idle';
        if (this.sheet?.tags[tag] && tag !== this.currentTag) {
          this.animator.play({ tag });
          this.currentTag = tag;
        }
      }
      this.animator.update(dt);
    } else {
      // Procedural frames: idle, the walk cycle, and a jump/land pose.
      const wanted: 'idle' | 'walk' | 'air' = airborne ? 'air' : walking ? 'walk' : 'idle';
      if (wanted !== this.procState) {
        this.procState = wanted;
        this.procIdx = 0;
        this.procTimer = 0;
      }
      this.procTimer += dt;
      if (this.procState === 'walk') {
        if (this.procTimer >= WALK_FRAME) {
          this.procTimer -= WALK_FRAME;
          this.procIdx = (this.procIdx + 1) % COLE_FRAMES.walk.length;
        }
        this.material.map = COLE_FRAMES.walk[this.procIdx];
      } else if (this.procState === 'air') {
        this.material.map = COLE_FRAMES.jump[0];
      } else {
        // Brief land-impact hold, then settle into the idle frame.
        this.material.map = this.landTimer > 0 ? COLE_FRAMES.jump[1] : COLE_FRAMES.idle[0];
      }
    }
    if (this.landTimer > 0) this.landTimer -= dt;

    this.mesh.position.x = this.x;
    this.mesh.scale.x = this.facing;
    const breathe = Math.sin(performance.now() * 0.003) * 0.008;
    const bob = airborne ? 0 : walking ? Math.abs(Math.sin(performance.now() * 0.012)) * 0.035 : breathe;
    this.mesh.position.y = HEIGHT / 2 + bob + this.jumpY;
    this.shadowObject.position.x = this.x;
    // The ground shadow shrinks and fades as Cole rises, reading as height.
    const lift = THREE.MathUtils.clamp(this.jumpY / 1.6, 0, 1);
    const shadowScale = 1 - lift * 0.45;
    this.shadowObject.scale.set(shadowScale, shadowScale, 1);
    (this.shadowObject.material as THREE.MeshBasicMaterial).opacity = 0.8 * (1 - lift * 0.6);

    // Drive the cloth sim from the neck's world position and Cole's velocity.
    // The rim color is last frame's aggregated neon — a frame's lag is invisible.
    const coleVx = dt > 0 ? (this.x - this.prevX) / dt : 0;
    this.prevX = this.x;
    this.rimUniforms.uSpeed.value = Math.abs(coleVx) / SPEED;
    this.scarf.update(dt, this.x, NECK_Y + bob + this.jumpY, coleVx, this.rimUniforms.uRimColor.value, this.rimUniforms.uRimDirX.value);
  }

  /** True when Cole's feet are on the ground (can start a new jump). */
  get grounded(): boolean {
    return this.jumpY <= 0;
  }

  /** World-space point Cole's pistol fires from (roughly his hands at chest). */
  get muzzleY(): number {
    return this.jumpY + HEIGHT * 0.58;
  }

  /**
   * Aggregates the nearby neon lights into the rim uniforms each frame.
   * Reads live intensities, so the rim flickers in sync with the signs.
   */
  updateRim(lights: THREE.PointLight[]) {
    let r = 0;
    let g = 0;
    let b = 0;
    let dirX = 0;
    let total = 0;
    const candidates: { color: THREE.Color; rawDir: number; weight: number }[] = [];
    for (const light of lights) {
      const dx = light.position.x - this.x;
      const dy = light.position.y - 1.2;
      const dz = light.position.z;
      const d2 = dx * dx + dy * dy + dz * dz;
      const w = light.intensity / Math.max(d2, 1);
      r += light.color.r * w;
      g += light.color.g * w;
      b += light.color.b * w;
      const rawDir = dx / Math.sqrt(d2);
      dirX += rawDir * w;
      total += w;
      candidates.push({ color: light.color, rawDir, weight: w });
    }
    if (total <= 0.001) {
      this.rimUniforms.uRimColor.value.setScalar(0);
      this.rimUniforms.uGlintColor0.value.setScalar(0);
      this.rimUniforms.uGlintColor1.value.setScalar(0);
      return;
    }
    const peak = Math.max(r, g, b);
    const strength = Math.min(total * 1.6, 2.4);
    this.rimUniforms.uRimColor.value.setRGB(r / peak, g / peak, b / peak).multiplyScalar(strength);
    this.rimUniforms.uRimDirX.value = THREE.MathUtils.clamp(dirX / total, -1, 1) * this.facing;

    // Per-light reflections on glasses
    candidates.sort((a, b) => b.weight - a.weight);
    for (let i = 0; i < 2; i++) {
      const colorKey = i === 0 ? 'uGlintColor0' : 'uGlintColor1';
      const posKey = i === 0 ? 'uGlintPos0' : 'uGlintPos1';
      const sizeKey = i === 0 ? 'uGlintSize0' : 'uGlintSize1';
      if (i < candidates.length) {
        const c = candidates[i];
        const intensity = Math.min(c.weight * 6, 1.5);
        this.rimUniforms[colorKey].value.copy(c.color).multiplyScalar(intensity);
        this.rimUniforms[posKey].value = THREE.MathUtils.clamp(0.5 + c.rawDir * this.facing * 0.35, 0.05, 0.95);
        this.rimUniforms[sizeKey].value = 0.025 + Math.min(c.weight * 15, 1) * 0.035;
      } else {
        this.rimUniforms[colorKey].value.setScalar(0);
        this.rimUniforms[posKey].value = 0.5;
      }
    }
  }
}
