import * as THREE from 'three';
import { Pipeline } from '../engine/Pipeline';
import { Input } from '../engine/Input';
import { StateMachine } from '../engine/StateMachine';
import { Player } from './world/actors/Player';
import { PuddleSystem } from './world/fx/Puddles';
import { Rain } from './world/fx/Rain';
import { RainSplash } from './world/fx/RainSplash';
import { AudioManager } from './audio/AudioManager';
import { DialogueManager } from './dialogue/DialogueManager';
import type { InteractionDef } from './dialogue/types';
import { Journal } from './investigation/Journal';
import { JournalUI } from './investigation/JournalUI';
import { ClueToast } from './investigation/ClueToast';
import { buildSector7Area } from './world/sector7';
import { buildStudioArea } from './world/studio';
import type { AreaWorld, AreaBuilder } from './world/area';
import { ExploreState } from './states/ExploreState';
import type { GameContext } from './GameContext';

/** Seconds for each half of the fade transition (out, then in). */
const FADE_S = 0.4;

/**
 * Top-level orchestration: builds the render pipeline and all shared systems,
 * owns the area registry + fade transitions, routes global input (journal,
 * audio unlock), and drives the state machine each frame.
 */
export class Game {
  private readonly pipeline: Pipeline;
  private readonly input = new Input();
  private readonly ctx: GameContext;
  private readonly state: StateMachine<GameContext>;
  private readonly clock = new THREE.Clock();

  /** Area registry — maps area id to its builder function. */
  private readonly areaBuilders: Record<string, AreaBuilder> = {
    sector7: buildSector7Area,
    studio: buildStudioArea,
  };

  /** Currently loaded areas, keyed by id (built on first access). */
  private readonly areas = new Map<string, AreaWorld>();

  /** Fade overlay element for area transitions. */
  private readonly fadeEl: HTMLElement;
  private fading = false;

  constructor(container: HTMLElement) {
    // Build the initial area (Sector 7) and point the pipeline at it.
    const area = this.getOrCreateArea('sector7');
    this.pipeline = new Pipeline(container, area.scene);

    // Shared objects that travel with the player between areas.
    const player = new Player();
    const playerLight = new THREE.PointLight('#7e9bd0', 10, 9, 2);
    const rain = new Rain();
    const rainFar = new Rain({
      count: 320, top: 26, spanX: 95, zMin: -65, zMax: -34,
      velX: -1, velY: -5.5, tail: 0.09, opacity: 0.15,
    });
    const splashes = new RainSplash();
    const puddles = new PuddleSystem();

    const dialogue = new DialogueManager();
    dialogue.setInteractions(area.interactions);
    const audio = new AudioManager();

    // Investigation: journal, journal UI, clue toast.
    const journal = new Journal();
    const journalUI = new JournalUI(journal);
    const clueToast = new ClueToast();

    // Line resolution given clue state: conditional insight → repeat → base.
    const resolveLines = (def: InteractionDef): string[] => {
      if (def.requiresClue && def.conditionalLines && journal.has(def.requiresClue)) {
        return def.conditionalLines;
      }
      if (def.clueId && def.repeatLines && journal.has(def.clueId)) {
        return def.repeatLines;
      }
      return def.lines;
    };
    dialogue.setResolver(resolveLines);
    // Availability: an interaction gated by `appearsAfterClue` only shows up
    // once that clue is held. Backed by the journal so it's always live.
    dialogue.setClueCheck((id) => journal.has(id));
    journal.onClueAdded = (clue) => {
      if (journalUI.isOpen) journalUI.show();
      // Let the active area react to case progress (e.g. Lyra reveal).
      this.ctx.area.onClueAdded?.(clue.id);
    };

    this.ctx = {
      pipeline: this.pipeline,
      input: this.input,
      player,
      playerLight,
      rain,
      rainFar,
      splashes,
      puddles,
      area,
      dialogue,
      audio,
      camX: 0,
      journal,
      journalUI,
      clueToast,
      resolveLines,
      requestAreaTransition: (targetId, spawnX, spawnFacing) =>
        this.transitionToArea(targetId, spawnX, spawnFacing),
    };

    this.attachShared(area);
    player.setBounds(area.bounds.min, area.bounds.max);

    // Fade overlay
    this.fadeEl = document.createElement('div');
    this.fadeEl.id = 'fade-overlay';
    this.fadeEl.style.cssText =
      'position:fixed;inset:0;background:#000;opacity:0;pointer-events:none;' +
      `transition:opacity ${FADE_S}s ease;z-index:9999;`;
    document.body.appendChild(this.fadeEl);

    // Input: browsers require a user gesture before audio can start.
    this.input.onFirstInteraction = () => audio.init();
    this.input.attach();

    this.state = new StateMachine(this.ctx);
    this.state.transition(new ExploreState());
    // Sync the starting area to current case progress (no-op on a fresh
    // save, but correct if the journal is ever pre-populated).
    area.onEnter?.((id) => journal.has(id));

    this.pipeline.renderer.setAnimationLoop(() => this.tick());
  }

  /** Gets an area from cache, or builds it on first access. */
  private getOrCreateArea(id: string): AreaWorld {
    let area = this.areas.get(id);
    if (!area) {
      const builder = this.areaBuilders[id];
      if (!builder) throw new Error(`Unknown area: ${id}`);
      area = builder();
      this.areas.set(id, area);
    }
    return area;
  }

  /** Adds the player + travelling systems to an area's scene. */
  private attachShared(area: AreaWorld) {
    const { player, playerLight, rain, rainFar, splashes, puddles } = this.ctx;
    area.scene.add(player.shadowObject, player.mesh, player.scarfMesh, playerLight);
    if (area.exterior) {
      area.scene.add(rain.object, rainFar.object, splashes.group, puddles.group);
      puddles.markReflectables(area.scene);
    }
  }

  /** Removes the shared objects from an area's scene. */
  private detachShared(area: AreaWorld) {
    const { player, playerLight, rain, rainFar, splashes, puddles } = this.ctx;
    area.scene.remove(
      player.shadowObject, player.mesh, player.scarfMesh, playerLight,
      rain.object, rainFar.object, splashes.group, puddles.group,
    );
  }

  /** Triggers a fade-out → scene swap → fade-in transition. */
  private transitionToArea(targetId: string, spawnX: number, spawnFacing?: number) {
    if (this.fading) return;
    this.fading = true;
    this.fadeEl.style.opacity = '1';

    setTimeout(() => {
      const newArea = this.getOrCreateArea(targetId);
      const { player } = this.ctx;

      this.detachShared(this.ctx.area);
      this.attachShared(newArea);

      // Reposition player
      player.x = spawnX;
      player.setFacing(spawnFacing ?? 1);
      player.setBounds(newArea.bounds.min, newArea.bounds.max);

      // Update camera
      const camera = this.pipeline.camera;
      this.ctx.camX = spawnX * 0.9;
      camera.position.x = this.ctx.camX;
      camera.lookAt(this.ctx.camX, newArea.cameraTarget.y, newArea.cameraTarget.z);

      // Update context + rendering + dialogue + ambience
      this.ctx.area = newArea;
      this.pipeline.setScene(newArea.scene);
      this.ctx.dialogue.setInteractions(newArea.interactions);
      // Swap the ambience bed to match the area (street rain → interior hum).
      this.ctx.audio.setExterior(newArea.exterior);
      // Let the new area sync its state to current case progress (e.g. show
      // Lyra if the studio case was already closed before this entry).
      newArea.onEnter?.((id) => this.ctx.journal.has(id));

      // Update HUD location label
      const locEl = document.getElementById('location');
      if (locEl) {
        locEl.textContent = newArea.displayName;
        const accent = document.createElement('span');
        accent.className = 'accent';
        locEl.prepend(accent);
      }

      // Fade in
      this.fadeEl.style.opacity = '0';
      setTimeout(() => {
        this.fading = false;
      }, FADE_S * 1000);
    }, FADE_S * 1000);
  }

  private tick() {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const { journalUI, input } = this.ctx;

    // Global keys: journal toggle (J / Tab), Escape closes it. A key that
    // opened/closed the journal is consumed — the state must not see it too.
    let journalHandled = false;
    if (input.anyPressed('KeyJ', 'Tab')) {
      journalUI.toggle();
      journalHandled = true;
    } else if (input.pressed('Escape') && journalUI.isOpen) {
      journalUI.hide();
      journalHandled = true;
    }

    // The journal overlay pauses the world (but rendering continues).
    if (!journalUI.isOpen && !journalHandled) {
      this.state.update(dt);
    }
    input.endFrame();
    this.pipeline.render(dt);
  }
}
