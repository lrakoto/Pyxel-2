import type { CaseFile } from '../case/CaseFile';

/**
 * Branching dialogue. Nodes are cheap: lines, then either options, an
 * auto-next, a present-picker, or an end. Options can be gated on case state.
 */
export interface DialogueOption {
  label: string;
  next: string;
  when?: (cf: CaseFile) => boolean;
}

export interface DialogueNode {
  id: string;
  speaker: string;
  lines: string[];
  options?: DialogueOption[];
  /** Opens the "present an inference" picker after the lines. */
  present?: boolean;
  next?: string;
  onEnter?: (cf: CaseFile) => void;
  end?: boolean;
}

export type DialogueTree = Record<string, DialogueNode>;

/* ────────────────────────────────────────────────────────────────────
 * Lyra — the Memory Den.
 *
 * She has been watching Cole since before they met (story bible, locked
 * direction). The conversation is an interrogation in reverse: she already
 * knows the facts; what she is testing is whether Cole UNDERSTOOD them.
 * The player advances by presenting the right conclusions.
 * ──────────────────────────────────────────────────────────────────── */

const LYRA = 'Lyra';
const COLE = 'Cole';

export const LYRA_TREE: DialogueTree = {
  root: {
    id: 'root',
    speaker: LYRA,
    lines: [
      'The hood comes down before I say a word. The face beneath is calm, symmetrical, lit faintly from within — cyan, like a screen asleep.',
      '"Detective Cole. You crossed the cordon at 02:31. You looked at the tape for eleven seconds before you touched it. I counted."',
    ],
    options: [
      { label: 'You’ve been watching me.', next: 'watched' },
      { label: 'Who are you?', next: 'who' },
      { label: 'Show her the case.', next: 'present-intro' },
    ],
  },
  watched: {
    id: 'watched',
    speaker: LYRA,
    lines: [
      '"I watch everything this street is allowed to remember. And a few things it isn’t."',
      '"Watching is what I am, detective. The only choice I ever get is how."',
    ],
    next: 'root-short',
  },
  who: {
    id: 'who',
    speaker: LYRA,
    lines: [
      '"Lyra. A name I took from a dead language and a live song."',
      '"I archive memories. People bring me the moments they can’t afford to keep, and I keep them. Lawfully enough — for this sector."',
    ],
    next: 'root-short',
  },
  'root-short': {
    id: 'root-short',
    speaker: LYRA,
    lines: ['"You didn’t walk through that rain for conversation. Show me what you’ve concluded."'],
    options: [
      { label: 'Show her the case.', next: 'present-intro' },
      { label: 'You’ve been watching me.', next: 'watched' },
      { label: 'Who are you?', next: 'who' },
    ],
  },
  'present-intro': {
    id: 'present-intro',
    speaker: COLE,
    lines: ['I open the case file behind my eyes. Which thread do I hand her?'],
    present: true,
  },

  // ── Presentation responses ──────────────────────────────────────
  'present-wrong': {
    id: 'present-wrong',
    speaker: LYRA,
    lines: [
      'She doesn’t blink. Machines don’t need to, and she wants me to remember that.',
      '"You’re holding that one wrong, detective. Turn it over a few more times and come back."',
    ],
    next: 'present-intro',
  },
  'present-partial': {
    id: 'present-partial',
    speaker: LYRA,
    lines: [
      '"So you see the door, and you see the drain. Method and mechanism."',
      '"But Marlon didn’t die of a method. Show me what he MADE, detective. Show me you read it."',
    ],
    next: 'present-intro',
  },
  'present-spill': {
    id: 'present-spill',
    speaker: LYRA,
    lines: [
      'Her eyes drop to the vial in my coat before I ever mention it. Of course they do.',
      '"Keep that sample cold. What leaks back out of a harvest is the part the buyers don’t want — the grief. It’s also the only part that’s still HIM."',
    ],
    next: 'present-intro',
  },
  'present-testimony': {
    id: 'present-testimony',
    speaker: LYRA,
    lines: [
      'For four full seconds she says nothing, and I understand that for her, four seconds is mourning.',
      '"Marlon was my friend. As near to one as something like me is permitted. He found where the stolen pieces go — and he painted the map into pigment, because pigment can’t be deleted."',
      '"You read it. Good. Then you already know the wall gave you an instruction, not a confession."',
    ],
    onEnter: (cf) => cf.setFlag('lyra-opened'),
    next: 'first-one',
  },
  'first-one': {
    id: 'first-one',
    speaker: LYRA,
    lines: [
      '"FIND THE FIRST ONE. The first mind the harvest ever emptied. Before the syndicates, before the markets — the prototype victim."',
      '"The first fragment ever taken is in this room, detective. It is the first memory I ever archived — years before I understood what I was holding."',
    ],
    options: [
      { label: 'Play it.', next: 'ending' },
      { label: 'Not yet.', next: 'wait' },
    ],
  },
  wait: {
    id: 'wait',
    speaker: LYRA,
    lines: ['"It has waited longer than you’ve been alive. It can wait for your nerve."'],
    end: true,
  },
  ending: {
    id: 'ending',
    speaker: LYRA,
    lines: [
      'She turns to the archive wall. One cartridge among ten thousand begins to glow — softly, patiently, like it has been listening this whole time.',
      '"For the record, detective: I am sorry about what you’re about to hear."',
    ],
    onEnter: (cf) => cf.setFlag('ending'),
    end: true,
  },

  // Return visit after the ending.
  epilogue: {
    id: 'epilogue',
    speaker: LYRA,
    lines: [
      '"You heard them too. Everybody, and nobody, in one voice."',
      '"Rest, detective. The first one has a face now — and Issue #2 has a first page."',
    ],
    end: true,
  },
};

/** Entry node for Lyra given case state. */
export function lyraEntry(cf: CaseFile): string {
  if (cf.hasFlag('ending')) return 'epilogue';
  if (cf.hasFlag('lyra-opened')) return 'first-one';
  if (cf.hasFlag('met-lyra')) return 'root-short';
  cf.setFlag('met-lyra');
  return 'root';
}

/** Which node a presented inference leads to. */
export function resolvePresent(cf: CaseFile, inferenceId: string): string {
  const inf = cf.inferenceById(inferenceId);
  if (!inf || inf.wrong || cf.isContradicted(inf)) return 'present-wrong';
  switch (inferenceId) {
    case 'inf-testimony':
    case 'inf-voices':
    case 'inf-her-face':
    case 'inf-editor':
      return 'present-testimony';
    case 'inf-spill':
      return 'present-spill';
    default:
      return 'present-partial';
  }
}

/* ── The cold open and the ending cards ─────────────────────────── */

export const COLD_OPEN: { text: string; hold: number }[] = [
  { text: 'NEW ANGELES — 2077', hold: 1.9 },
  { text: 'It rains on everybody.', hold: 2.1 },
  { text: 'ISSUE #1 — FRAGMENTS', hold: 2.2 },
];

export const ENDING_CARDS: { text: string; hold: number }[] = [
  { text: 'The cartridge sings.', hold: 2.4 },
  { text: 'A thousand voices, sharing one breath.', hold: 2.6 },
  { text: '"WE ARE EVERYBODY."', hold: 2.4 },
  { text: '"WE ARE NOBODY."', hold: 2.4 },
  { text: '"FIND THE FIRST ONE."', hold: 3.0 },
  { text: 'END OF ISSUE #1 — FRAGMENTS', hold: 3.4 },
];
