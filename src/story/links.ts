import type { LinkRule, QuestionDef } from '../case/model';

/** The three open questions of Issue #1. */
export const QUESTIONS: QuestionDef[] = [
  { id: 'q-entry', text: 'Who opened the door?', answeredBy: 'inf-appointment' },
  { id: 'q-cause', text: 'What stopped his heart?', answeredBy: 'inf-harvest' },
  { id: 'q-message', text: 'What was he trying to say?', answeredBy: 'inf-testimony' },
];

/**
 * The authored deduction table. Pairs are unordered. Wrong inferences are
 * deliberately plausible; each carries the ids that eventually contradict it.
 */
export const LINKS: LinkRule[] = [
  {
    pair: ['picked-lock', 'vendor-account'],
    inference: {
      id: 'inf-appointment',
      title: 'An Appointment',
      body: 'No break-in. A regular visitor with a key-fine touch. Marlon opened his life to his killer on schedule.',
      answers: 'q-entry',
    },
  },
  {
    pair: ['harvest-rig', 'the-body'],
    inference: {
      id: 'inf-harvest',
      title: 'The Extraction Was the Murder',
      body: 'The rig didn’t record him — it drained him. Forty-one minutes to pour a man out of himself.',
      answers: 'q-cause',
    },
  },
  {
    pair: ['residue', 'harvest-rig'],
    inference: {
      id: 'inf-spill',
      title: 'Spill-Back',
      body: 'The residue is what leaked back down the cables when the drain finished. Whatever a self is made of, some of it spilled here.',
    },
  },
  {
    pair: ['the-painting', 'wall-writing'],
    inference: {
      id: 'inf-testimony',
      title: 'Painted Testimony',
      body: 'The wall and the canvas are one sentence. He mapped everyone the harvest has taken — and signed it to whoever would come looking.',
      answers: 'q-message',
    },
  },
  {
    pair: ['last-entry', 'the-painting'],
    inference: {
      id: 'inf-voices',
      title: 'He Heard Them',
      body: 'The stolen fragments spoke inside him. He painted what they showed him, and kept painting until it killed him.',
    },
  },
  {
    pair: ['dead-camera', 'wall-writing'],
    inference: {
      id: 'inf-editor',
      title: 'An Editor',
      body: 'Whoever takes minds can also take footage. "Find the first one" — before the first one is edited away too.',
    },
  },
  {
    pair: ['slashed-canvas', 'the-painting'],
    inference: {
      id: 'inf-her-face',
      title: 'The Woman in the Map',
      body: 'One face was worth destroying twice. She is somewhere in the map — and someone wants her out of it.',
    },
  },

  // ── Wrong but plausible ─────────────────────────────────────────
  {
    pair: ['picked-lock', 'slashed-canvas'],
    inference: {
      id: 'wrong-robbery',
      title: 'A Robbery Gone Wrong?',
      body: 'A professional entry, a ruined canvas. A theft interrupted, an artist who fought back… then where are the wounds?',
      wrong: true,
      contradictedBy: ['inf-harvest', 'inf-appointment'],
    },
  },
  {
    pair: ['vendor-account', 'dead-camera'],
    inference: {
      id: 'wrong-vendor',
      title: 'The Vendor’s Lie?',
      body: 'One convenient witness, one conveniently blind camera. Is the noodle man feeding me a story with the broth?',
      wrong: true,
      contradictedBy: ['inf-editor'],
    },
  },
];

/** Cole's musings when two fragments simply don't connect. */
export const NO_CONNECTION_LINES = [
  'I hold the two thoughts side by side. They don’t speak to each other. Yet.',
  'Forcing it. That’s how detectives ruin cases.',
  'There’s a thread here somewhere, but not between these two.',
  'No. The rain connects everything in this city except that.',
  '"Maybe" doesn’t hold up a case file.',
];

/** Board line when a conclusion is used as raw material. */
export const CONCLUSION_NOT_FACT_LINE =
  'A conclusion isn’t a fact. Ground the thread in evidence.';
