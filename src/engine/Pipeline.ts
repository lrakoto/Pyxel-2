import * as THREE from 'three';
import {
  BlendFunction,
  BloomEffect,
  ChromaticAberrationEffect,
  EffectComposer,
  EffectPass,
  NoiseEffect,
  RenderPass,
  TextureEffect,
  VignetteEffect,
} from 'postprocessing';

/**
 * The REPLACED-style render pipeline: a fixed low internal resolution with the
 * full HDR post stack applied BEFORE the pixelated CSS upscale, so bloom and
 * grain stay smooth over chunky pixels.
 *
 * - 960x540 internal render, `image-rendering: pixelated` upscale
 * - depth/stencil off — all draw order is painter's algorithm via renderOrder
 * - ACESFilmic tone mapping
 * - Post stack: HDR bloom, chromatic aberration, film grain, vignette, lens dirt
 *
 * Scene swaps go through `setScene()`, which retargets the RenderPass in place
 * (no pass surgery — the old rebuild-the-pass dance was a known fragility).
 */
export const VIEW_W = 960;
export const VIEW_H = 540;

export class Pipeline {
  readonly renderer: THREE.WebGLRenderer;
  readonly camera: THREE.PerspectiveCamera;
  readonly composer: EffectComposer;
  private readonly renderPass: RenderPass;

  constructor(container: HTMLElement, initialScene: THREE.Scene) {
    this.renderer = new THREE.WebGLRenderer({
      antialias: false,
      stencil: false,
      depth: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(VIEW_W, VIEW_H, false);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(38, VIEW_W / VIEW_H, 0.1, 200);
    this.camera.position.set(0, 2.4, 16);

    this.composer = new EffectComposer(this.renderer, {
      frameBufferType: THREE.HalfFloatType,
    });
    this.renderPass = new RenderPass(initialScene, this.camera);
    this.composer.addPass(this.renderPass);

    const bloom = new BloomEffect({
      intensity: 1.35,
      luminanceThreshold: 0.18,
      luminanceSmoothing: 0.25,
      mipmapBlur: true,
    });
    const chroma = new ChromaticAberrationEffect({
      offset: new THREE.Vector2(0.0014, 0.0009),
      radialModulation: true,
      modulationOffset: 0.22,
    });
    const grain = new NoiseEffect({
      blendFunction: BlendFunction.COLOR_DODGE,
      premultiply: true,
    });
    grain.blendMode.opacity.value = 0.42;
    const vignette = new VignetteEffect({ offset: 0.22, darkness: 0.72 });
    const lensDirt = new TextureEffect({
      texture: makeLensDirtTexture(),
      blendFunction: BlendFunction.MULTIPLY,
    });
    lensDirt.blendMode.opacity.value = 0.15;

    this.composer.addPass(new EffectPass(this.camera, bloom, chroma, grain, vignette, lensDirt));
    this.composer.setSize(VIEW_W, VIEW_H);

    window.addEventListener('resize', () => this.fitCanvas());
    this.fitCanvas();
  }

  /** Retargets the pipeline at a new scene (area transitions). */
  setScene(scene: THREE.Scene) {
    this.renderPass.mainScene = scene;
  }

  render(dt: number) {
    this.composer.render(dt);
  }

  /** Integer-ish upscale that fills the window while keeping the aspect. */
  private fitCanvas() {
    const scale = Math.min(window.innerWidth / VIEW_W, window.innerHeight / VIEW_H);
    const canvas = this.renderer.domElement;
    canvas.style.width = `${Math.floor(VIEW_W * scale)}px`;
    canvas.style.height = `${Math.floor(VIEW_H * scale)}px`;
  }
}

/** Procedural smudge texture for the lens-dirt multiply pass. */
function makeLensDirtTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 60; i++) {
    const s = 1 + Math.random() * 8;
    ctx.fillStyle = `rgba(0,0,0,${0.02 + Math.random() * 0.12})`;
    ctx.beginPath();
    ctx.arc(Math.random() * 256, Math.random() * 256, s, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = 0; i < 15; i++) {
    ctx.strokeStyle = `rgba(0,0,0,${0.03 + Math.random() * 0.08})`;
    ctx.lineWidth = 0.5 + Math.random() * 1.5;
    ctx.beginPath();
    ctx.moveTo(Math.random() * 256, Math.random() * 256);
    ctx.lineTo(Math.random() * 256, Math.random() * 256);
    ctx.stroke();
  }
  return new THREE.CanvasTexture(canvas);
}
