import type { InteractionDef } from '../dialogue/types';
import { CASE_CONCLUSION_FLAG } from './case';

/**
 * Marlon Graves' studio script — the crime-scene examinations, their evidence
 * clues, and the clue-conditional insights that reward re-reading the scene.
 */
export const STUDIO_INTERACTIONS: InteractionDef[] = [
  {
    x: 0, z: -8, radius: 3,
    label: '"EVERYBODY/NOBODY"',
    glintY: 2.6,
    clueId: 'everybody-nobody-painting',
    clueTitle: 'The Painting Is a Map',
    clueBody:
      'Neural signatures baked into "Everybody/Nobody" — creative cortexes wired into the work. ' +
      'Each fragment is a piece of someone. The final painting is a map of stolen minds.',
    lines: [
      'The final painting. Fractured faces dissolve into one another — hundreds of them, maybe thousands. At first it looks like abstract chaos. But the longer I look, the more I see: each fragment is a piece of someone. A memory. A feeling. A face that doesn\'t belong to Marlon.',
      'The title is scratched into the frame: "EVERYBODY/NOBODY." Under the UV-light traces on the canvas, I can see neural signatures — the kind of thing you\'d only get if you wired someone\'s creative cortex directly into the work.',
      'This isn\'t a painting. It\'s a map. Of stolen minds.',
    ],
    repeatLines: [
      'The fractured faces keep dissolving into each other, no matter how long I look. A map of stolen minds — and Marlon found a way to paint it before it killed him.',
    ],
    requiresClue: 'wall-writing',
    conditionalLines: [
      '"WE ARE EVERYBODY. WE ARE NOBODY." The writing on the wall, the faces on the canvas — it\'s the same sentence. The people in this painting ARE the everybody. And whoever stole them is making the city into nobody.',
      'Marlon didn\'t paint a picture. He painted the crime itself, from inside it. This is the evidence — and it\'s still breathing.',
    ],
  },
  {
    x: -3.5, z: -6, radius: 2.5,
    label: 'Unfinished painting',
    glintY: 2.2,
    clueId: 'unfinished-woman',
    clueTitle: 'The Dissolving Woman',
    clueBody:
      'A woman\'s face dissolving into light, painted the night Marlon died — the paint still tacky. ' +
      'Someone would recognize her. Was she real, or a fragment he found in the feed?',
    lines: [
      'An easel holds a half-finished canvas. The strokes are urgent, jagged — Marlon was working fast, as if he knew he was running out of time. The subject is a woman\'s face, dissolving into light. I don\'t recognize her. But someone would.',
      'The paint is still tacky. This was done the night he died.',
    ],
    repeatLines: [
      'Her face still comes apart at the edges, catching the light. The last face Marlon ever painted. I keep thinking she\'s trying to remember herself.',
    ],
  },
  {
    x: 3.5, z: -6, radius: 2.5,
    label: 'Unfinished painting',
    glintY: 2.2,
    lines: [
      'Another easel, another interrupted work. This one is darker — a cityscape where the buildings are made of faces, their windows like eyes. The perspective is wrong, intentionally. It makes you feel like you\'re falling into it.',
      'Marlon was painting the same thing from different angles: the fragments of people, stitched together. He was trying to show what he\'d found.',
    ],
    repeatLines: [
      'Buildings made of faces, windows like eyes. He kept painting the same truth until the truth took him.',
    ],
    requiresClue: 'everybody-nobody-painting',
    conditionalLines: [
      'Now that I\'ve seen the final work, this sketch reads differently — it\'s the same map, unrefined. The faces stacked into towers are the raw material. Marlon was diagramming how the theft scales: mind after mind, mortared into the city\'s skyline.',
    ],
  },
  {
    x: 3, z: -4, radius: 2.5,
    label: 'Neural interface device',
    glintY: 1.4,
    clueId: 'neural-device',
    clueTitle: 'The Neural Interface',
    clueBody:
      'The device plugged into Marlon\'s implants when he died — still warm, still running something. ' +
      'Blood on the jack receiver. Whoever used it didn\'t care about sterile procedure. Bagged for tech division.',
    lines: [
      'A tangle of cables, a neural jack receiver, and a portable projector unit, wired into a laptop that\'s still warm. The screen is dark, but the drive light pulses — it\'s still running something. This is the device that was plugged into Marlon\'s implants when he died.',
      'The jack receiver is crusted with dried blood. Whoever used this didn\'t care about sterile procedure. They just wanted in.',
      'I bag it. Tech division can pull the logs.',
    ],
    repeatLines: [
      'Bagged and logged. The drive light\'s out now. Whatever it was running went dark when Marlon did — or was finished with him.',
    ],
    requiresClue: 'wall-writing',
    conditionalLines: [
      '"THEY TAKE WHAT MAKES YOU YOU." This is the taking. The device didn\'t just read Marlon\'s cortex — it pulled. The drive was still running the extraction when his heart gave out. This murder weapon runs on firmware.',
    ],
  },
  {
    x: 0, z: -2, radius: 3,
    label: 'Body outline',
    glintY: 0.5,
    clueId: 'neural-residue',
    clueTitle: 'Iridescent Residue',
    clueBody:
      'An oily iridescent film under the body outline — not paint. Scraped into a vial. ' +
      'Whatever drained Marlon\'s implants left this behind. Never seen it at a crime scene before.',
    lines: [
      'The chalk outline on the floor. Marlon Graves was found here, on his back, arms at his sides. No defensive wounds. No struggle. The coroner\'s report said his heart just... stopped. But his neural implants were fried — like something had drained them completely.',
      'I crouch. The concrete under the outline is discolored — a faint, iridescent residue, like oil on water. I\'ve never seen that at a crime scene before.',
      'I scrape a sample into a vial. Whatever this is, it isn\'t paint.',
    ],
    repeatLines: [
      'The outline\'s already fading. The residue in my vial catches the light like oil on water — the one physical trace that anyone was here at all.',
    ],
    requiresClue: 'neural-device',
    conditionalLines: [
      'The iridescent film under the outline — and the blood on the jack receiver. Same event, two ends: the device pulled his mind out through the implants, and what leaked back down the cables pooled under the body. This residue is what\'s left of a drain.',
    ],
  },
  {
    x: -4, z: 0, radius: 2.5,
    label: 'Workbench',
    glintY: 1.5,
    clueId: 'marlons-journal',
    clueTitle: "Marlon's Last Entry",
    clueBody:
      '"They don\'t know I can hear them. The fragments. They\'re not gone — they\'re here. In the work. ' +
      'In ME." The sentence stops mid-word. He knew something was inside him, and he tried to paint it out.',
    lines: [
      'A cluttered workbench. Tubes of paint, neural patch cables, empty stimulant injectors, and a journal. The journal is open to the last entry: "They don\'t know I can hear them. The fragments. They\'re not gone — they\'re here. In the work. In ME. I can hear everybody. I can hear nobody. I have to get this out before—"',
      'The sentence ends there.',
    ],
    repeatLines: [
      '"I have to get this out before—" Before what, Marlon? Before they came back. The page is still open where he left it.',
    ],
  },
  {
    x: 0, z: 0, radius: 2.5,
    label: 'Scattered canvases',
    glintY: 1.2,
    lines: [
      'A pile of canvases, knocked from their easels. Some are blank. Others show the same fractured style as the final work — fragments of faces, fragments of lives. One has been slashed, violently, as if someone tried to destroy it. The slash goes through a woman\'s eyes.',
      'I count seven canvases. The report said Marlon had been working for weeks. Seven paintings. Seven attempts to show what he\'d found.',
    ],
    requiresClue: 'unfinished-woman',
    conditionalLines: [
      'The slashed canvas — through the eyes of a woman. The same woman Marlon painted on the easel, dissolving into light. Someone destroyed this copy specifically. They wanted her face gone. Which means her face is a name, and the name is a thread.',
    ],
  },
  {
    x: -7, z: -4, radius: 2.5,
    label: 'Wall writing',
    glintY: 3.0,
    clueId: 'wall-writing',
    clueTitle: '"Find the First One"',
    clueBody:
      '"THEY TAKE WHAT MAKES YOU YOU. THE CITY RUNS ON STOLEN DREAMS. WE ARE EVERYBODY. WE ARE NOBODY. ' +
      'FIND THE FIRST ONE." Marlon\'s testimony, written in his last hours. The first one — the first victim?',
    lines: [
      'Someone wrote on the concrete wall in black marker. The handwriting is shaky, desperate: "THEY TAKE WHAT MAKES YOU YOU. THE CITY RUNS ON STOLEN DREAMS. WE ARE EVERYBODY. WE ARE NOBODY. FIND THE FIRST ONE."',
      '"Find the first one." The first victim? The first fragment? The first person to realize what was happening?',
      'I photograph it. This is Marlon\'s testimony, written in his last hours.',
    ],
    repeatLines: [
      '"FIND THE FIRST ONE." Underlined by shaky hands. The first fragment Marlon ever heard in the feed. Everything else in this room follows from that.',
    ],
    requiresClue: 'neural-residue',
    conditionalLines: [
      '"THEY TAKE WHAT MAKES YOU YOU." The residue under his body — the iridescent film — that\'s what "you" looks like when it\'s taken. Marlon watched it happen to the fragments, then felt it start on him. He wrote this while there was still enough of him left to write.',
    ],
  },
  {
    x: 7, z: 2, radius: 2.5,
    label: 'Studio door',
    glintY: 2.0,
    clueId: 'picked-lock',
    clueTitle: 'A Professional Entry',
    clueBody:
      'The lock was picked, not forced; hinges oiled silent. Whoever came for Marlon knew their trade ' +
      'and didn\'t want to be heard. Not street crime — this was a scheduled extraction.',
    lines: [
      'The door to the street. The lock is broken — not forced, but picked. Someone who knew what they were doing came through here. The hinges are oiled, silent. A professional, or someone who didn\'t want to be heard.',
      'Beyond the door, the rain and neon of Sector 7 waits.',
    ],
    repeatLines: [
      'Picked, oiled, quiet. Whoever did Marlon walked in like an appointment and left like weather.',
    ],
    requiresClue: CASE_CONCLUSION_FLAG,
    conditionalLines: [
      'The scene is cleared. Every surface has given up its secret — the map, the device, the residue, the writing, the lock. Marlon\'s last message points one way: "FIND THE FIRST ONE."',
      'Somewhere in Sector 7, Lyra sells other people\'s memories from the back of a memory den. If the first victim\'s mind survived anywhere, it\'s in her archive. Time to go.',
    ],
  },
];
