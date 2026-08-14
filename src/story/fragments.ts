import type { FragmentDef } from '../case/model';

/**
 * Every fragment in Issue #1. The board card text is Cole's condensed note;
 * the in-world examine prose lives with each scene's hotspots.
 */
export const FRAGMENTS: Record<string, FragmentDef> = {
  // ── Sector 7 street ─────────────────────────────────────────────
  'cordon-log': {
    id: 'cordon-log',
    kind: 'observation',
    title: 'Cordon Log',
    body: 'Patrol sealed the studio at 02:14 and filed it as "unattended death." No forced-entry flag. The system logged a corpse and moved on.',
  },
  'vendor-account': {
    id: 'vendor-account',
    kind: 'testimony',
    title: "The Vendor's Account",
    body: 'A visitor in a courier jacket. A regular — always after midnight, always polite. That night he left calm, "like a man leaving an appointment."',
  },
  'dead-camera': {
    id: 'dead-camera',
    kind: 'observation',
    title: 'Dead Camera',
    body: 'The alley cam has looped the same forty seconds of rain for three weeks. Somebody edited this street out of the city’s memory.',
  },

  // ── Marlon's studio ─────────────────────────────────────────────
  'picked-lock': {
    id: 'picked-lock',
    kind: 'evidence',
    title: 'Picked Lock',
    body: 'Picked clean, hinges oiled. Nothing in this room is broken except the man who lived here.',
  },
  'the-body': {
    id: 'the-body',
    kind: 'evidence',
    title: 'The Body',
    body: 'No wounds. No struggle. Heart simply stopped — and every implant in his skull burned out from the inside.',
  },
  'residue': {
    id: 'residue',
    kind: 'evidence',
    title: 'Iridescent Residue',
    body: 'An oily film pooled toward the floor drain, shifting colors like a memory you can’t hold. It isn’t paint.',
  },
  'harvest-rig': {
    id: 'harvest-rig',
    kind: 'evidence',
    title: 'The Harvest Rig',
    body: 'A neural rig, still warm. The drive ran an extraction for forty-one minutes. There’s blood on the jack.',
  },
  'the-painting': {
    id: 'the-painting',
    kind: 'evidence',
    title: 'EVERYBODY/NOBODY',
    body: 'His last painting: hundreds of half-faces sharing borrowed features. Under UV, neural signatures — baked into the pigment itself.',
  },
  'last-entry': {
    id: 'last-entry',
    kind: 'evidence',
    title: 'The Last Entry',
    body: '"They don’t know I can hear them. The fragments. They’re in the work. In ME. I have to get this out before—"',
  },
  'wall-writing': {
    id: 'wall-writing',
    kind: 'evidence',
    title: 'The Wall',
    body: 'THEY TAKE WHAT MAKES YOU YOU. WE ARE EVERYBODY. WE ARE NOBODY. FIND THE FIRST ONE.',
  },
  'slashed-canvas': {
    id: 'slashed-canvas',
    kind: 'evidence',
    title: 'The Slashed Canvas',
    body: 'Seven canvases. Only one attacked — a woman dissolving into light, cut through the eyes.',
  },
};
