/**
 * Keyboard input with explicit edge semantics.
 *
 * - `isDown(code)`   — level-triggered: true while the key is held.
 * - `pressed(code)`  — edge-triggered: true exactly once per physical press
 *                      (OS key-repeat is filtered out). Edges are cleared at
 *                      the end of every frame by `endFrame()`, so every system
 *                      that runs during the frame sees the same edge.
 *
 * This replaces the shared mutable `Set<string>` + manual `keys.delete()`
 * pattern: states no longer have to consume keys destructively to avoid
 * double-handling, and a missed delete can't leave a key "stuck".
 */
export class Input {
  private readonly down = new Set<string>();
  private readonly edges = new Set<string>();

  /** Fired on the first (non-repeat) keydown — used to unlock the AudioContext. */
  onFirstInteraction: (() => void) | null = null;
  private interacted = false;

  private readonly onKeyDown = (e: KeyboardEvent) => {
    // Tab is the journal key; keep focus from leaving the canvas.
    if (e.code === 'Tab') e.preventDefault();
    if (!e.repeat) {
      this.edges.add(e.code);
      if (!this.interacted) {
        this.interacted = true;
        this.onFirstInteraction?.();
      }
    }
    this.down.add(e.code);
  };

  private readonly onKeyUp = (e: KeyboardEvent) => {
    this.down.delete(e.code);
  };

  attach(target: Window = window) {
    target.addEventListener('keydown', this.onKeyDown);
    target.addEventListener('keyup', this.onKeyUp);
  }

  detach(target: Window = window) {
    target.removeEventListener('keydown', this.onKeyDown);
    target.removeEventListener('keyup', this.onKeyUp);
  }

  /** True while the key is physically held. */
  isDown(code: string): boolean {
    return this.down.has(code);
  }

  /** True if any of the codes is held. */
  anyDown(...codes: string[]): boolean {
    return codes.some((c) => this.down.has(c));
  }

  /** True once on the frame the key went down. */
  pressed(code: string): boolean {
    return this.edges.has(code);
  }

  /** True once if any of the codes went down this frame. */
  anyPressed(...codes: string[]): boolean {
    return codes.some((c) => this.edges.has(c));
  }

  /** Drops held + edge state — used when a mode change should swallow input. */
  clear() {
    this.down.clear();
    this.edges.clear();
  }

  /** Called by the game loop after all updates ran. */
  endFrame() {
    this.edges.clear();
  }
}
