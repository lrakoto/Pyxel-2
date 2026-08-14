import type { InteractionDef } from '../dialogue/types';
import { CASE_CONCLUSION_FLAG } from './case';

/**
 * Sector 7 street script — Cole's examination monologues for the exterior,
 * plus Lyra's first-encounter dialogue (gated behind the studio case).
 */
export const SECTOR7_INTERACTIONS: InteractionDef[] = [
  {
    x: -15.5, z: -8.2, radius: 3,
    label: 'NO/BODY sign',
    lines: [
      'The sign hums in deep violet, casting a bruise-colored glow across the wet sidewalk. "NO/BODY." A nightclub, maybe — or a gallery for art no one claims. The name feels less like a title and more like a verdict.',
    ],
  },
  {
    x: -9.5, z: -8.2, radius: 3,
    label: 'SECTOR 7 sign',
    lines: [
      'Cyan letters blaze against the dark: "SECTOR 7." The municipal marker for this slice of the city — industrial, artistic, forgotten. Home to the dead artist I\'m here about.',
    ],
  },
  {
    x: -4.5, z: -8.2, radius: 3,
    label: 'HOTEL sign',
    lines: [
      'A red vacancy sign flickers above a narrow doorway. Rooms by the hour, no questions asked. The sort of place where people come to disappear — or to be found dead.',
    ],
  },
  {
    x: 2.5, z: -8.2, radius: 3,
    label: 'MEMORY DEN sign',
    lines: [
      '"MEMORY DEN." Pink neon, soft and invasive like a thought you didn\'t invite. They sell experiences here — other people\'s memories, recorded, packaged, pumped straight into your neural jack. Illegal in most sectors. Thriving in this one.',
      'I wonder what memories Marlon Graves left behind.',
    ],
  },
  {
    x: 6.0, z: -8.2, radius: 3,
    label: 'OPEN sign',
    lines: [
      'A small green "OPEN" sign in a ground-floor window. Whatever\'s inside is still running this late. A diner, maybe. A repair shop for augments. In Sector 7, everything stays open because the city never sleeps — just changes shape.',
    ],
  },
  {
    x: 10, z: -8.2, radius: 3,
    label: 'ヌードル sign',
    lines: [
      'The katakana reads "Noodles." Orange neon drips down the wet facade like hot broth. A late-night ramen joint tucked between a memory den and a liquor store. The smell of pork fat and sesame cuts through the rain.',
    ],
  },
  {
    x: 13.5, z: -8.2, radius: 3,
    label: 'LIQUOR sign',
    lines: [
      'Violet light from a storefront window. Bottles lined up behind reinforced glass. The kind of place that sells cheap synth-booze to people trying to forget what they\'ve seen — or what they\'ve become.',
    ],
  },
  {
    x: -11.2, z: -6.5, radius: 2.5,
    label: 'Vending machine',
    lines: [
      'A vending machine glows cyan in the dark. The display cycles through brightly colored cans with names I don\'t recognize — synthetic vitamins, neural boosters, something called "DreamCola." A thin trickle of condensation runs down the glass.',
    ],
  },
  {
    x: 6.7, z: -6.5, radius: 2.5,
    label: 'Vending machine',
    lines: [
      'Pink light pulses from this machine\'s header panel. The selection includes "Focus," "Zen," and "Drive" — over-the-counter neural enhancers. No age check. No receipt. Just a slot and a button.',
    ],
  },
  {
    x: -7, z: -5.0, radius: 2.5,
    label: 'Steam vent',
    lines: [
      'Hot breath from the city\'s belly. Steam rises from a grated vent, carrying the metallic smell of underground railways and buried cables. Somewhere below, the city is still running — indifferent, mechanical, alive.',
    ],
  },
  {
    x: 9.5, z: -5.0, radius: 2.5,
    label: 'Steam vent',
    lines: [
      'A column of steam billows from the street, catching the neon overhead and turning it into shifting clouds of color. The heat is almost pleasant against the cold rain. Almost.',
    ],
  },
  {
    x: 0.8, z: -4.5, radius: 2.5,
    label: 'Manhole cover',
    lines: [
      'A heavy iron disc set into the asphalt. Faint vibrations tremble through its surface — the subway, or something deeper. The City of New Angeles maintains over twelve thousand miles of tunnels down there. Some of them aren\'t on any map.',
    ],
  },
  {
    x: -6, z: 3.3, radius: 3.5,
    label: 'Utility pole',
    lines: [
      'A sagging power pole, thick with cables and transformers. The wires droop between poles like wet clotheslines, humming with an undercurrent of stolen electricity. Someone\'s tapped into the grid — illegally, inevitably.',
    ],
  },
  {
    x: -17, z: -4.0, radius: 2,
    label: 'Curb edge',
    lines: [
      'The curb where the sidewalk meets the road. Water pools in the cracks, reflecting the neon signs upside down. The asphalt is cracked and tar-patched — a map of the city\'s neglect rendered in black ribbon.',
    ],
  },
  {
    // Lyra — only present once the studio case has closed. She has been
    // watching Cole; the dialogue is a reveal to him, not a first meeting
    // for her. Placed near the Memory Den, where her archive lives.
    x: 4.2, z: -6.5, radius: 2.6,
    label: 'Lyra',
    appearsAfterClue: CASE_CONCLUSION_FLAG,
    lines: [
      'A figure steps out of the rain beneath the Memory Den awning. Hood up, hands still. She has been waiting — not surprised to see me. The opposite, if I\'m honest.',
      '"Detective Cole." She knows my name. Of course she does. "You found the painting. You found the device. You read the wall." She lists them back to me like items on a receipt I didn\'t know I was writing.',
      '"I\'ve been watching you work this case since the call came in. You notice things the systems miss — that\'s rare, and it\'s the reason I\'m standing here instead of staying a voice in the grid. Marlon was a friend. Or as close to one as something like me gets."',
      '"The wall says find the first one. I know where the first fragment lives. It\'s in my archive — the very first memory I ever recorded, years ago, before I understood what I was holding." She tilts her hood back. The face underneath glows faint cyan, inhuman, calm. "Come inside. I\'ll show you what Marlon was trying to paint."',
    ],
    repeatLines: [
      '"Whenever you\'re ready, Detective." Lyra hasn\'t moved from the awning. The Memory Den is right behind her. "The first fragment is inside. It\'s been waiting longer than you have."',
    ],
  },
];
