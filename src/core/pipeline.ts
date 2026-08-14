import * as THREE from 'three';
import {
  BlendFunction,
  BloomEffect,
  ChromaticAberrationEffect,
  EffectComposer,
  EffectPass,
  NoiseEffect,
  RenderPass,
  VignetteEffect,
} from 'postprocessing';

/**
 * The look: a fixed 960×540 internal frame with the full HDR post stack
 * applied before a pixelated CSS upscale — smooth bloom over chunky pixels.
 *
 * Unlike the earlier prototypes this renderer keeps the depth buffer ON;
 * sprites cut their silhouettes with alphaTest, so ordering is sane and new
 * objects don't need hand-assigned renderOrder to exist.
 */
export const VIEW_W = 960;
export const VIEW_H = 540;

export class Pipeline {
  readonly renderer: THREE.WebGLRenderer;
  readonly camera: THREE.PerspectiveCamera;
  private readonly composer: EffectComposer;
  private readonly renderPass: RenderPass;

  constructor(container: HTMLElement, scene: THREE.Scene) {
    this.renderer = new THREE.WebGLRenderer({
      antialias: false,
      stencil: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(VIEW_W, VIEW_H, false);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(40, VIEW_W / VIEW_H, 0.1, 220);

    this.composer = new EffectComposer(this.renderer, { frameBufferType: THREE.HalfFloatType });
    this.renderPass = new RenderPass(scene, this.camera);
    this.composer.addPass(this.renderPass);

    const bloom = new BloomEffect({
      intensity: 1.15,
      luminanceThreshold: 0.22,
      luminanceSmoothing: 0.3,
      mipmapBlur: true,
    });
    const chroma = new ChromaticAberrationEffect({
      offset: new THREE.Vector2(0.001, 0.0006),
      radialModulation: true,
      modulationOffset: 0.25,
    });
    const grain = new NoiseEffect({ blendFunction: BlendFunction.COLOR_DODGE, premultiply: true });
    grain.blendMode.opacity.value = 0.35;
    const vignette = new VignetteEffect({ offset: 0.26, darkness: 0.68 });

    this.composer.addPass(new EffectPass(this.camera, bloom, chroma, grain, vignette));
    this.composer.setSize(VIEW_W, VIEW_H);

    window.addEventListener('resize', () => this.fit());
    this.fit();
  }

  setScene(scene: THREE.Scene) {
    this.renderPass.mainScene = scene;
  }

  render(dt: number) {
    this.composer.render(dt);
  }

  private fit() {
    const s = Math.min(window.innerWidth / VIEW_W, window.innerHeight / VIEW_H);
    const canvas = this.renderer.domElement;
    canvas.style.width = `${Math.floor(VIEW_W * s)}px`;
    canvas.style.height = `${Math.floor(VIEW_H * s)}px`;
  }
}
