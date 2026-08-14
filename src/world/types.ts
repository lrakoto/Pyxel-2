import * as THREE from 'three';
import type { CaseFile } from '../case/CaseFile';

/**
 * A hotspot is anything Cole can stand near and press E at: evidence to
 * examine, a door, or a person to talk to. Examine prose lives here, next to
 * the scene it belongs to; the condensed board card lives in story/fragments.
 */
export interface Hotspot {
  x: number;
  radius: number;
  label: string;
  /** World y where the marker glint floats. */
  glintY?: number;
  kind: 'examine' | 'door' | 'talk';
  /** Fragment granted on first examine. */
  fragment?: string;
  /** Examine lines (may react to case state). Unused for doors. */
  lines?: (cf: CaseFile) => string[];
  /** Door destination. `locked` returns a refusal line, or null to open. */
  door?: { target: string; spawnX: number; locked?: (cf: CaseFile) => string | null };
  /** Dialogue tree id for kind 'talk'. */
  talk?: string;
  /** Hide entirely until this returns true. */
  available?: (cf: CaseFile) => boolean;
}

/** Anything a scene ticks every frame. */
export interface Ticker {
  update(dt: number): void;
}

/** A self-contained playable scene. */
export interface WorldScene {
  id: string;
  name: string;
  scene: THREE.Scene;
  exterior: boolean;
  bounds: { min: number; max: number };
  /** Camera rig for this scene. */
  cam: { y: number; z: number; lookY: number };
  hotspots: Hotspot[];
  /** Lights that tint Cole's wet rim. */
  keyLights: THREE.PointLight[];
  tickers: Ticker[];
}
