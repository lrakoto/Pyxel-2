/**
 * The deduction model. The whole game state is: which fragments Cole holds,
 * which inferences he has formed by connecting them, and which story flags
 * those inferences have opened.
 */

export type FragmentKind = 'evidence' | 'testimony' | 'observation';

/** A discrete piece of the case — a node on the board. */
export interface FragmentDef {
  id: string;
  kind: FragmentKind;
  title: string;
  /** The card text on the case board — Cole's condensed note. */
  body: string;
}

/** A conclusion formed by linking two fragments. */
export interface InferenceDef {
  id: string;
  title: string;
  body: string;
  /** The question this inference answers, if any. */
  answers?: string;
  /** True for wrong-but-plausible conclusions (red herrings). */
  wrong?: boolean;
  /**
   * Ids (fragment or inference) whose presence contradicts this conclusion.
   * A contradicted inference stops answering its question and must be
   * retracted on the board.
   */
  contradictedBy?: string[];
}

/** An authored link: this unordered pair of fragments yields this inference. */
export interface LinkRule {
  pair: [string, string];
  inference: InferenceDef;
}

/** An open question of the case; answered by a specific inference. */
export interface QuestionDef {
  id: string;
  text: string;
  answeredBy: string;
}

export type LinkResult =
  | { kind: 'inference'; inference: InferenceDef; reformed: boolean }
  | { kind: 'known'; inference: InferenceDef }
  | { kind: 'nothing'; line: string };
