import type { FragmentDef, InferenceDef, LinkResult } from './model';
import { FRAGMENTS } from '../story/fragments';
import { CONCLUSION_NOT_FACT_LINE, LINKS, NO_CONNECTION_LINES, QUESTIONS } from '../story/links';

export type CaseEvent =
  | { type: 'fragment'; fragment: FragmentDef }
  | { type: 'inference'; inference: InferenceDef; reformed: boolean }
  | { type: 'retract'; inference: InferenceDef }
  | { type: 'flag'; flag: string };

type Listener = (e: CaseEvent) => void;

const SAVE_KEY = 'everybody-nobody:issue1';

/**
 * The single source of truth for the investigation: fragments held,
 * inferences formed, story flags, board card positions, and the save file.
 * The world, the board, the HUD, and the dialogue all read from here.
 */
export class CaseFile {
  private readonly fragmentIds: string[] = [];
  private readonly inferenceIds: string[] = [];
  private readonly flagSet = new Set<string>();
  /** Board card positions in board-area pixels, keyed by node id. */
  readonly positions: Record<string, [number, number]> = {};
  /** Where the player is, for save/continue. */
  scene = 'street';
  playerX = -12.5;

  private listeners: Listener[] = [];
  private museIdx = 0;

  on(fn: Listener) {
    this.listeners.push(fn);
  }

  private emit(e: CaseEvent) {
    for (const fn of this.listeners) fn(e);
    this.save();
  }

  // ── Fragments ─────────────────────────────────────────────────────

  hasFragment(id: string): boolean {
    return this.fragmentIds.includes(id);
  }

  get fragments(): FragmentDef[] {
    return this.fragmentIds.map((id) => FRAGMENTS[id]);
  }

  /** Grants a fragment. Returns true if it was new. */
  addFragment(id: string): boolean {
    if (this.hasFragment(id)) return false;
    if (!FRAGMENTS[id]) throw new Error(`unknown fragment: ${id}`);
    this.fragmentIds.push(id);
    this.emit({ type: 'fragment', fragment: FRAGMENTS[id] });
    return true;
  }

  // ── Inferences ────────────────────────────────────────────────────

  hasInference(id: string): boolean {
    return this.inferenceIds.includes(id);
  }

  get inferences(): InferenceDef[] {
    return this.inferenceIds.map((id) => this.inferenceById(id)!);
  }

  inferenceById(id: string): InferenceDef | null {
    for (const rule of LINKS) if (rule.inference.id === id) return rule.inference;
    return null;
  }

  /** The two source fragments of an inference. */
  sourcesOf(id: string): [string, string] | null {
    for (const rule of LINKS) if (rule.inference.id === id) return rule.pair;
    return null;
  }

  /** True if the inference is currently contradicted by held knowledge. */
  isContradicted(inf: InferenceDef): boolean {
    if (!inf.contradictedBy) return false;
    return inf.contradictedBy.some((id) => this.hasFragment(id) || this.hasInference(id));
  }

  /** Attempts to connect two board nodes. */
  tryLink(a: string, b: string): LinkResult {
    if (!FRAGMENTS[a] || !FRAGMENTS[b]) {
      return { kind: 'nothing', line: CONCLUSION_NOT_FACT_LINE };
    }
    const rule = LINKS.find(
      (r) => (r.pair[0] === a && r.pair[1] === b) || (r.pair[0] === b && r.pair[1] === a),
    );
    if (!rule) {
      const line = NO_CONNECTION_LINES[this.museIdx % NO_CONNECTION_LINES.length];
      this.museIdx++;
      return { kind: 'nothing', line };
    }
    if (this.hasInference(rule.inference.id)) {
      return { kind: 'known', inference: rule.inference };
    }
    const reformed = rule.inference.id in this.positions;
    this.inferenceIds.push(rule.inference.id);
    this.emit({ type: 'inference', inference: rule.inference, reformed });
    this.checkGates();
    return { kind: 'inference', inference: rule.inference, reformed };
  }

  /** Removes a (usually contradicted) conclusion from the board. */
  retract(id: string) {
    const idx = this.inferenceIds.indexOf(id);
    if (idx < 0) return;
    this.inferenceIds.splice(idx, 1);
    const inf = this.inferenceById(id)!;
    this.emit({ type: 'retract', inference: inf });
  }

  // ── Questions / gates ─────────────────────────────────────────────

  /** The answering inference for a question, if formed and not contradicted. */
  answerFor(questionId: string): InferenceDef | null {
    const q = QUESTIONS.find((q) => q.id === questionId);
    if (!q) return null;
    const inf = this.inferenceById(q.answeredBy);
    if (!inf || !this.hasInference(inf.id) || this.isContradicted(inf)) return null;
    return inf;
  }

  get allQuestionsAnswered(): boolean {
    return QUESTIONS.every((q) => this.answerFor(q.id) !== null);
  }

  private checkGates() {
    if (this.allQuestionsAnswered && !this.hasFlag('den-unlocked')) {
      this.setFlag('den-unlocked');
    }
  }

  // ── Flags ─────────────────────────────────────────────────────────

  hasFlag(flag: string): boolean {
    return this.flagSet.has(flag);
  }

  setFlag(flag: string) {
    if (this.flagSet.has(flag)) return;
    this.flagSet.add(flag);
    this.emit({ type: 'flag', flag });
  }

  // ── Objective ─────────────────────────────────────────────────────

  get objective(): string {
    if (this.hasFlag('ending')) return 'Issue #2 is out there. The rain keeps falling.';
    if (this.hasFlag('den-unlocked'))
      return 'The Memory Den keeps what the city forgets. Ask about the first one.';
    if (this.inferenceIds.length > 0)
      return 'Answer the three questions on the case board.';
    if (this.fragmentIds.length >= 3)
      return 'Open the case board (C). Connect what you know.';
    return 'Reach the scene. Look at everything.';
  }

  // ── Persistence ───────────────────────────────────────────────────

  save() {
    try {
      localStorage.setItem(
        SAVE_KEY,
        JSON.stringify({
          v: 1,
          fragments: this.fragmentIds,
          inferences: this.inferenceIds,
          flags: [...this.flagSet],
          positions: this.positions,
          scene: this.scene,
          playerX: this.playerX,
        }),
      );
    } catch {
      // Private-mode storage failures shouldn't kill the game.
    }
  }

  /** Returns true if a save existed and was restored. */
  load(): boolean {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (data.v !== 1) return false;
      for (const id of data.fragments ?? []) if (FRAGMENTS[id]) this.fragmentIds.push(id);
      for (const id of data.inferences ?? []) if (this.inferenceById(id)) this.inferenceIds.push(id);
      for (const f of data.flags ?? []) this.flagSet.add(f);
      Object.assign(this.positions, data.positions ?? {});
      this.scene = typeof data.scene === 'string' ? data.scene : 'street';
      this.playerX = typeof data.playerX === 'number' ? data.playerX : -12.5;
      return this.fragmentIds.length > 0 || this.flagSet.size > 0 || this.scene !== 'street';
    } catch {
      return false;
    }
  }

  static wipe() {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch {
      /* ignore */
    }
  }
}
