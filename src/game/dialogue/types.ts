/**
 * An examinable object (or NPC) in an area. Pure data — the noir scripts for
 * each area live under src/game/data/, and DialogueManager only presents them.
 */
export interface InteractionDef {
  x: number;
  z: number;
  radius: number;
  label: string;
  /** Lines shown when examined without any special clue state. */
  lines: string[];
  /**
   * Optional clue granted the first time this object is examined in
   * investigation mode. Once granted, examining again shows `repeatLines`
   * (if present) or the base `lines`.
   */
  clueId?: string;
  clueTitle?: string;
  clueBody?: string;
  /** Lines shown on re-examination after `clueId` has been collected. */
  repeatLines?: string[];
  /**
   * Conditional insight: shown instead of `lines` when Cole already holds
   * the clue `requiresClue`. Lets objects respond to case progress.
   */
  requiresClue?: string;
  conditionalLines?: string[];
  /**
   * Height above ground (world y) where the investigation glint floats.
   * Defaults to a chest-height marker if unset.
   */
  glintY?: number;
  /**
   * Clue id that must be held before this interaction appears at all. Used
   * for NPCs who only show up after a story beat (e.g. Lyra after the studio
   * case closes). When unset the interaction is always available.
   */
  appearsAfterClue?: string;
}
