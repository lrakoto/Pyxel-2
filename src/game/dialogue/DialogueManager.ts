import type { InteractionDef } from './types';

/** Characters revealed per second by the typewriter effect. */
const TYPE_SPEED = 45;

/**
 * Presents interaction scripts in the bottom dialogue box with a typewriter
 * reveal. Holds no story content itself — interaction sets are swapped per
 * area, and which line-set applies (base / repeat / conditional insight) is
 * resolved through an injected resolver backed by the case journal.
 */
export class DialogueManager {
  private interactions: InteractionDef[] = [];
  private active: InteractionDef | null = null;
  private lineIndex = 0;
  private charIndex = 0;
  private charTimer = 0;
  /** Lines resolved for the currently open interaction. */
  private activeLines: string[] = [];

  /** Resolves which of an interaction's line sets applies given clue state. */
  private resolver: ((def: InteractionDef) => string[]) | null = null;
  /** Availability predicate for `appearsAfterClue` gating (journal-backed). */
  private hasClue: ((id: string) => boolean) | null = null;

  private readonly hintEl: HTMLElement;
  private readonly boxEl: HTMLElement;
  private readonly textEl: HTMLElement;
  private readonly speakerEl: HTMLElement;
  private readonly advanceEl: HTMLElement;

  constructor() {
    this.hintEl = document.getElementById('interact-hint')!;
    this.boxEl = document.getElementById('dialogue-box')!;
    this.textEl = document.getElementById('dialogue-text')!;
    this.speakerEl = document.getElementById('dialogue-speaker')!;
    this.advanceEl = document.getElementById('dialogue-advance')!;
    this.close();
  }

  /** Register the line resolver (called once at startup). */
  setResolver(fn: (def: InteractionDef) => string[]) {
    this.resolver = fn;
  }

  /** Register the clue-availability predicate (called once at startup). */
  setClueCheck(fn: (id: string) => boolean) {
    this.hasClue = fn;
  }

  /** True if `def` should currently be reachable (its gating clue is held). */
  isAvailable(def: InteractionDef): boolean {
    if (!def.appearsAfterClue) return true;
    return this.hasClue ? this.hasClue(def.appearsAfterClue) : false;
  }

  /** Swap the active interaction set — called on area transition. */
  setInteractions(defs: InteractionDef[]) {
    if (this.isOpen) this.close();
    this.interactions = defs;
  }

  /** Returns the nearest available interaction within range, or null. */
  findNearby(playerX: number): InteractionDef | null {
    let best: { def: InteractionDef; dist: number } | null = null;
    for (const def of this.interactions) {
      if (!this.isAvailable(def)) continue;
      const dist = Math.abs(def.x - playerX);
      if (dist < def.radius && (!best || dist < best.dist)) {
        best = { def, dist };
      }
    }
    return best?.def ?? null;
  }

  get isOpen(): boolean {
    return this.active !== null;
  }

  /** The interaction currently open, or null. */
  get current(): InteractionDef | null {
    return this.active;
  }

  /** All interactions currently reachable (gating clue held). */
  get availableInteractions(): InteractionDef[] {
    return this.interactions.filter((d) => this.isAvailable(d));
  }

  /** Start a dialogue session with the given interaction. */
  openDialogue(def: InteractionDef) {
    this.active = def;
    this.lineIndex = 0;
    this.charIndex = 0;
    this.charTimer = 0;
    this.activeLines = this.resolver ? this.resolver(def) : def.lines;
    this.hintEl.style.display = 'none';
    this.boxEl.style.display = 'block';
    this.speakerEl.textContent = def.label;
    this.advanceEl.style.display = 'none';
    this.textEl.textContent = '';
  }

  /** Close the dialogue and restore the hint. */
  close() {
    this.active = null;
    this.boxEl.style.display = 'none';
    this.hintEl.style.display = 'block';
  }

  /** Advance: finish the typing line, move to the next, or close at the end. */
  advance() {
    if (!this.active) return;

    const line = this.activeLines[this.lineIndex];
    // If still typing, finish the current line instantly.
    if (this.charIndex < line.length) {
      this.charIndex = line.length;
      this.textEl.textContent = line;
      this.advanceEl.style.display = 'block';
      return;
    }

    this.lineIndex++;
    if (this.lineIndex >= this.activeLines.length) {
      this.close();
      return;
    }
    this.charIndex = 0;
    this.charTimer = 0;
    this.advanceEl.style.display = 'none';
    this.textEl.textContent = '';
  }

  /** Called each frame to drive the typewriter effect. */
  update(dt: number) {
    if (!this.active) return;
    const line = this.activeLines[this.lineIndex];
    if (this.charIndex >= line.length) return;
    this.charTimer += dt;
    const charsToAdd = Math.floor(this.charTimer * TYPE_SPEED);
    if (charsToAdd > 0) {
      this.charIndex = Math.min(this.charIndex + charsToAdd, line.length);
      this.textEl.textContent = line.slice(0, this.charIndex);
      this.charTimer = 0;
      if (this.charIndex >= line.length) {
        this.advanceEl.style.display = 'block';
      }
    }
  }
}
