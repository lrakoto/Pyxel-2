/**
 * Case-progress constants for Issue #1: Fragments. Kept in one place so
 * area scripts, the investigation state, and the journal all agree on ids.
 */

/** Journal flag marking that the studio case conclusion has fired. */
export const CASE_CONCLUSION_FLAG = 'studio-case-complete';

/** The collectible evidence set for Marlon Graves' studio. */
export const STUDIO_EVIDENCE = [
  'everybody-nobody-painting',
  'unfinished-woman',
  'neural-device',
  'neural-residue',
  'marlons-journal',
  'wall-writing',
  'picked-lock',
] as const;

/** The opening objective, before any evidence lands. */
export const INITIAL_OBJECTIVE = 'Find out what happened to Marlon Graves.';

/** Objective overrides keyed by the clue that triggers them. */
export const OBJECTIVE_TRIGGERS: Record<string, string> = {
  'everybody-nobody-painting': 'The painting is a map of stolen minds. Find who wired Marlon into it.',
  'neural-device': "The device was still running. Someone wanted into Marlon's head.",
  'wall-writing': '"Find the first one." Marlon left testimony. Find the first fragment.',
};

/** Journal entry + toast text for the studio case conclusion. */
export const CASE_CONCLUSION = {
  id: CASE_CONCLUSION_FLAG,
  title: 'CASE STATUS: SCENE CLOSED',
  body:
    'The studio has given up everything it knows. Marlon found the theft, painted it, ' +
    'and died holding the map. The wall says "find the first one" — and there\'s one person ' +
    'in Sector 7 who traffics in first-hand memories. Time to find Lyra.',
  objective:
    'The scene is cleared. Take what you have to Lyra — she sells memories, and the first victim is in someone\'s archive.',
  toast: 'CASE UPDATED — SCENE CLOSED',
};
