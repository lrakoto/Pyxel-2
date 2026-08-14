import * as THREE from 'three';
import type { Updatable } from '../area';
import { LYRA_W, LYRA_H, makeLyraFrame } from './sprites';

/**
 * Lyra's street presence: a hooded billboard with a breathing cyan face-glow —
 * the inhuman tell. She stands beneath the Memory Den awning and is invisible
 * until the studio case closes (`studio-case-complete`), then revealed by the
 * area hooks. Built at scene construction so her scene graph exists from the
 * start; visibility is just a flag.
 */
export class LyraFigure implements Updatable {
  readonly group = new THREE.Group();
  readonly faceLight: THREE.PointLight;
  private readonly material: THREE.MeshStandardMaterial;
  private isVisible = false;
  private glowPhase = 0;

  constructor() {
    this.material = new THREE.MeshStandardMaterial({
      map: makeLyraFrame(),
      transparent: true,
      alphaTest: 0.4,
      roughness: 0.85,
      metalness: 0,
      side: THREE.DoubleSide,
    });
    const height = 1.7;
    const width = height * (LYRA_W / LYRA_H);
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), this.material);
    mesh.position.y = height / 2;
    this.group.add(mesh);

    // Cyan face-glow — placed at face height.
    this.faceLight = new THREE.PointLight('#7fe9ff', 0, 5, 2);
    this.faceLight.position.set(0, 1.45, 0.3);
    this.group.add(this.faceLight);

    // Position beneath the Memory Den awning, matching her interaction.
    this.group.position.set(4.2, 0, -6.5);
    this.group.visible = false;
  }

  /** Show/hide her. Called by the area hooks when the studio case closes. */
  setVisible(v: boolean) {
    this.isVisible = v;
    this.group.visible = v;
  }

  get visible() {
    return this.isVisible;
  }

  update(dt: number) {
    if (!this.isVisible) return;
    // Slow cyan glow breathing — the AI face isn't skin, it's light.
    this.glowPhase += dt * 1.8;
    const breath = 0.5 + 0.5 * Math.sin(this.glowPhase);
    this.faceLight.intensity = 1.4 + breath * 1.1;
    // Slight emissive tint on the material so the face band reads as lit.
    this.material.emissive.setRGB(0.05 * breath, 0.18 * breath, 0.22 * breath);
  }
}
