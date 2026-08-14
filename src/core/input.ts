/**
 * Keyboard state with explicit edge semantics: isDown() while held,
 * pressed() exactly once per physical press (OS repeat filtered). Edges are
 * cleared by endFrame() so every consumer within a frame sees the same edge.
 */
export class Input {
  private readonly down = new Set<string>();
  private readonly edges = new Set<string>();

  /** Fired on the first real keypress — unlocks the AudioContext. */
  onFirstKey: (() => void) | null = null;
  private interacted = false;

  private readonly onKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'Tab') e.preventDefault();
    if (!e.repeat) {
      this.edges.add(e.code);
      if (!this.interacted) {
        this.interacted = true;
        this.onFirstKey?.();
      }
    }
    this.down.add(e.code);
  };

  private readonly onKeyUp = (e: KeyboardEvent) => {
    this.down.delete(e.code);
  };

  attach() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  isDown(...codes: string[]): boolean {
    return codes.some((c) => this.down.has(c));
  }

  pressed(...codes: string[]): boolean {
    return codes.some((c) => this.edges.has(c));
  }

  clear() {
    this.down.clear();
    this.edges.clear();
  }

  endFrame() {
    this.edges.clear();
  }
}
