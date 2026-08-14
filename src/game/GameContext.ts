import * as THREE from 'three';
import type { Pipeline } from '../engine/Pipeline';
import type { Input } from '../engine/Input';
import type { Player } from './world/actors/Player';
import type { PuddleSystem } from './world/fx/Puddles';
import type { Rain } from './world/fx/Rain';
import type { RainSplash } from './world/fx/RainSplash';
import type { AudioManager } from './audio/AudioManager';
import type { DialogueManager } from './dialogue/DialogueManager';
import type { InteractionDef } from './dialogue/types';
import type { AreaWorld } from './world/area';
import type { Journal } from './investigation/Journal';
import type { JournalUI } from './investigation/JournalUI';
import type { ClueToast } from './investigation/ClueToast';

/** Everything the game states share. Built once by Game, mutated on area swap. */
export interface GameContext {
  pipeline: Pipeline;
  input: Input;
  player: Player;
  playerLight: THREE.PointLight;
  rain: Rain;
  rainFar: Rain;
  splashes: RainSplash;
  puddles: PuddleSystem;
  /** The active area (scene, updatables, doors, interactions, bounds…). */
  area: AreaWorld;
  dialogue: DialogueManager;
  audio: AudioManager;
  /** Camera-follow x, smoothed toward the player. */
  camX: number;
  /** Cole's case journal — collected clues + current objective. */
  journal: Journal;
  /** Journal overlay UI — checked so states can ignore clicks while it's open. */
  journalUI: JournalUI;
  /** Transient "evidence added" notification. */
  clueToast: ClueToast;
  /** Resolve the correct line set for an interaction given clue state. */
  resolveLines: (def: InteractionDef) => string[];
  /** Request a transition to a new area. Called by ExploreState on door entry. */
  requestAreaTransition: (targetId: string, spawnX: number, spawnFacing?: number) => void;
}
