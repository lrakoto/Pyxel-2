import * as THREE from 'three';
import { Pipeline } from './core/pipeline';
import { Input } from './core/input';
import { AudioEngine } from './core/audio';
import { CaseFile } from './case/CaseFile';
import { Cole } from './world/cole';
import { Rain, Marker } from './world/fx';
import { buildStreet } from './world/street';
import { buildStudio } from './world/studio';
import { buildDen } from './world/den';
import type { Hotspot, WorldScene } from './world/types';
import { Hud, Toast } from './ui/hud';
import { DialogueBox } from './ui/DialogueBox';
import { CaseBoard } from './ui/CaseBoard';
import { showCards } from './ui/cards';
import { COLD_OPEN, ENDING_CARDS, LYRA_TREE, lyraEntry, resolvePresent } from './story/script';

type Mode = 'play' | 'dialogue' | 'board' | 'cards';

/**
 * Orchestration: one scene active at a time, one mode active at a time.
 * The world keeps animating in every mode — New Angeles does not pause for
 * anyone's feelings — but the player only moves in 'play'.
 */
export class Game {
  private readonly pipeline: Pipeline;
  private readonly input = new Input();
  private readonly audio = new AudioEngine();
  private readonly cf = new CaseFile();
  private readonly cole = new Cole();
  private readonly rain = new Rain();
  private readonly hud = new Hud();
  private readonly toast = new Toast();
  private readonly dlg: DialogueBox;
  private readonly board: CaseBoard;

  private readonly builders: Record<string, () => WorldScene> = {
    street: buildStreet,
    studio: buildStudio,
    den: buildDen,
  };
  private readonly scenes = new Map<string, WorldScene>();
  private active!: WorldScene;
  private markers = new Map<Hotspot, Marker>();

  private mode: Mode = 'play';
  private camX = 0;
  private readonly clock = new THREE.Clock();
  private readonly fadeEl = document.getElementById('fade')!;
  private transitioning = false;
  private endingQueued = false;

  constructor(container: HTMLElement) {
    const hadSave = this.cf.load();

    this.dlg = new DialogueBox(this.cf, this.audio);
    this.board = new CaseBoard(this.cf, this.audio);

    this.active = this.getScene(this.cf.scene);
    this.pipeline = new Pipeline(container, this.active.scene);
    this.enterScene(this.active, this.cf.playerX, true);

    this.cf.on((e) => {
      if (e.type === 'fragment') {
        this.audio.fragment();
        this.toast.show('FRAGMENT', e.fragment.title);
        this.board.dirty = true;
      } else if (e.type === 'inference') {
        if (this.cf.isContradicted(e.inference)) this.audio.sting();
      } else if (e.type === 'flag') {
        if (e.flag === 'den-unlocked') {
          this.audio.inference();
          this.toast.show('CASE', 'The Memory Den will see you now.');
        }
        if (e.flag === 'ending') this.endingQueued = true;
      }
      this.hud.refresh(this.cf);
      this.board.refresh();
    });

    this.input.onFirstKey = () => this.audio.init();
    this.input.attach();
    this.hud.refresh(this.cf);

    if (!hadSave) {
      this.mode = 'cards';
      showCards(COLD_OPEN, {
        onDone: () => {
          this.mode = 'play';
        },
      });
    }

    this.pipeline.renderer.setAnimationLoop(() => this.tick());
  }

  /* ── Scenes ─────────────────────────────────────────────────────── */

  private getScene(id: string): WorldScene {
    let s = this.scenes.get(id);
    if (!s) {
      const builder = this.builders[id] ?? this.builders.street;
      s = builder();
      this.scenes.set(id, s);
    }
    return s;
  }

  private enterScene(scene: WorldScene, spawnX: number, first = false) {
    if (!first) {
      this.cole.removeFrom(this.active.scene);
      this.active.scene.remove(this.rain.object);
      for (const m of this.markers.values()) {
        this.active.scene.remove(m.sprite);
        m.dispose();
      }
      this.markers.clear();
    }
    this.active = scene;
    this.cole.addTo(scene.scene);
    this.cole.setBounds(scene.bounds.min, scene.bounds.max);
    this.cole.place(spawnX, spawnX < 0 ? 1 : -1);
    if (scene.exterior) scene.scene.add(this.rain.object);
    this.buildMarkers();
    this.camX = spawnX;
    this.hud.setLocation(scene.name);
    this.audio.setExterior(scene.exterior);
    this.cf.scene = scene.id;
    this.cf.playerX = spawnX;
    this.cf.save();
    if (!first) this.pipeline.setScene(scene.scene);
  }

  private buildMarkers() {
    for (const h of this.active.hotspots) {
      if (h.kind === 'door') continue;
      const m = new Marker(h.kind === 'talk' ? '#ffd9a0' : '#79e8ff');
      m.sprite.position.set(h.x, h.glintY ?? 1.4, -3.2);
      this.active.scene.add(m.sprite);
      this.markers.set(h, m);
    }
  }

  private transition(target: string, spawnX: number) {
    if (this.transitioning) return;
    this.transitioning = true;
    this.audio.door();
    this.fadeEl.classList.add('on');
    setTimeout(() => {
      this.enterScene(this.getScene(target), spawnX);
      this.fadeEl.classList.remove('on');
      setTimeout(() => (this.transitioning = false), 380);
    }, 380);
  }

  /* ── Interaction ────────────────────────────────────────────────── */

  private nearestHotspot(): Hotspot | null {
    let best: { h: Hotspot; d: number } | null = null;
    for (const h of this.active.hotspots) {
      if (h.available && !h.available(this.cf)) continue;
      const d = Math.abs(h.x - this.cole.x);
      if (d < h.radius && (!best || d < best.d)) best = { h, d };
    }
    return best?.h ?? null;
  }

  private interact(h: Hotspot) {
    if (h.kind === 'door' && h.door) {
      const refusal = h.door.locked?.(this.cf) ?? null;
      if (refusal) {
        this.mode = 'dialogue';
        this.dlg.openLines('Cole', [refusal], () => (this.mode = 'play'));
        return;
      }
      this.transition(h.door.target, h.door.spawnX);
      return;
    }
    if (h.kind === 'talk' && h.talk === 'lyra') {
      this.mode = 'dialogue';
      this.dlg.openTree(LYRA_TREE, lyraEntry(this.cf), (infId) => resolvePresent(this.cf, infId), () => {
        this.mode = 'play';
        this.maybeRunEnding();
      });
      return;
    }
    if (h.lines) {
      const lines = h.lines(this.cf);
      this.mode = 'dialogue';
      this.audio.tick();
      this.dlg.openLines(h.label.toUpperCase(), lines, () => (this.mode = 'play'));
      if (h.fragment) this.cf.addFragment(h.fragment);
    }
  }

  private maybeRunEnding() {
    if (!this.endingQueued) return;
    this.endingQueued = false;
    this.mode = 'cards';
    this.audio.chorus();
    document.getElementById('cards')!.classList.add('ending');
    showCards(ENDING_CARDS, {
      className: 'ending',
      onDone: () => {
        this.mode = 'play';
        this.hud.refresh(this.cf);
      },
    });
  }

  /* ── Frame ──────────────────────────────────────────────────────── */

  private tick() {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const input = this.input;

    // Mode routing.
    if (this.mode === 'play') {
      const near = this.transitioning ? null : this.nearestHotspot();
      if (input.pressed('KeyC', 'Tab')) {
        this.mode = 'board';
        this.hud.pulseBoardKey(false);
        this.board.show();
      } else if (near && input.pressed('KeyE', 'Enter')) {
        this.hud.prompt(null);
        this.interact(near);
      } else {
        const left = input.isDown('ArrowLeft', 'KeyA');
        const right = input.isDown('ArrowRight', 'KeyD');
        this.cole.update(dt, left, right);
        this.audio.update(dt, left !== right);
        this.cf.playerX = this.cole.x;
        this.hud.prompt(near ? `E — ${near.label}` : null);
      }
    } else if (this.mode === 'dialogue') {
      this.dlg.update(dt, input);
      this.cole.update(dt, false, false);
      this.audio.update(dt, false);
    } else if (this.mode === 'board') {
      if (input.pressed('KeyC', 'Tab', 'Escape')) {
        this.board.hide();
        this.mode = 'play';
      }
      this.cole.update(dt, false, false);
    } else {
      // cards
      this.cole.update(dt, false, false);
    }

    // World keeps breathing in every mode.
    for (const t of this.active.tickers) t.update(dt);
    if (this.active.exterior) {
      this.rain.camX = this.camX;
      this.rain.update(dt);
    }
    this.cole.updateRim(this.active.keyLights);

    // Markers: pulse, emphasize by proximity, hide collected fragments.
    for (const [h, m] of this.markers) {
      const collected = h.fragment ? this.cf.hasFragment(h.fragment) : false;
      const availableNow = !h.available || h.available(this.cf);
      m.sprite.visible = availableNow && !collected && this.mode === 'play';
      m.near = Math.max(0, 1 - Math.abs(h.x - this.cole.x) / (h.radius * 2.2));
      m.update(dt);
    }

    // HUD board-key pulse when the board holds unseen material.
    this.hud.pulseBoardKey(this.board.dirty && this.mode === 'play');

    // Camera: smoothed follow, slight lead in facing direction.
    const target = this.cole.x * 0.92 + this.cole.facing * 0.4;
    this.camX += (target - this.camX) * Math.min(1, dt * 3.2);
    const cam = this.pipeline.camera;
    cam.position.set(this.camX, this.active.cam.y, this.active.cam.z);
    cam.lookAt(this.camX, this.active.cam.lookY, 0);

    input.endFrame();
    this.pipeline.render(dt);
  }
}
