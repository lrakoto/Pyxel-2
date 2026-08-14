import { INITIAL_OBJECTIVE, OBJECTIVE_TRIGGERS } from '../data/case';

/**
 * A clue is a discrete piece of the case Cole has uncovered. Clues are granted
 * by examining objects in investigation mode, persist for the whole session,
 * and unlock conditional insight on other examinables.
 */
export interface ClueDef {
  /** Unique clue id, e.g. "neural-device", "wall-writing". */
  id: string;
  /** Short journal title, e.g. "The Neural Interface". */
  title: string;
  /** Journal body — Cole's notes on what this means for the case. */
  body: string;
}

/**
 * The case journal — Cole's running record of what he's found. Clues are
 * collected once and kept for the session. The journal also tracks the
 * current case objective, which evolves as key clues are found.
 */
export class Journal {
  /** Collected clues in the order they were found. */
  private readonly found: ClueDef[] = [];
  private readonly foundIds = new Set<string>();
  private objective = INITIAL_OBJECTIVE;

  /** Optional callback fired when a new clue is added. */
  onClueAdded: ((clue: ClueDef) => void) | null = null;

  /** Add a clue. Returns true if it was newly collected, false if already held. */
  add(clue: ClueDef): boolean {
    if (this.foundIds.has(clue.id)) return false;
    this.foundIds.add(clue.id);
    this.found.push(clue);
    const next = OBJECTIVE_TRIGGERS[clue.id];
    if (next) this.objective = next;
    this.onClueAdded?.(clue);
    return true;
  }

  /** True if Cole has collected the given clue. */
  has(id: string): boolean {
    return this.foundIds.has(id);
  }

  /** All collected clues, in discovery order. */
  get clues(): readonly ClueDef[] {
    return this.found;
  }

  /** The current case objective. */
  get currentObjective(): string {
    return this.objective;
  }

  /** Advance the objective directly (case progress beats). */
  setObjective(next: string) {
    this.objective = next;
  }

  /** Number of clues collected. */
  get count(): number {
    return this.found.length;
  }
}
