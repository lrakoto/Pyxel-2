# EVERYBODY/NOBODY — Issue #1: Fragments

A deduction-driven cyberpunk noir, set in **New Angeles, 2077**. Detective Xander Darius Cole is called to Sector 7, where the artist Marlon Graves has been found emptied — not killed, *harvested*. What Cole finds becomes fragments; what he concludes becomes the case; what he concludes **wrongly** becomes a problem.

Canonical narrative design: [docs/STORY_BIBLE.md](docs/STORY_BIBLE.md) · Working context: [AGENTS.md](AGENTS.md)

> This is a full reinterpretation of the original Pyxel prototype, built from its story bible rather than its code. The earlier 1:1 rebuild is preserved at tag [`v0.2-faithful-rebuild`](../../tree/v0.2-faithful-rebuild).

## The game

**Interpretation is the mechanic.** Cole's gift — noticing what systems miss — is the thing you actually do:

- **Explore** three scenes (the cordoned street, Marlon's studio, the Memory Den) and examine everything. Evidence, testimony, and observations become **fragments**.
- **Connect** fragments on the **case board** (C): click two cards to draw a thread. A meaningful pair snaps into an *inference* — a conclusion card. A meaningless pair dissolves with one of Cole's musings.
- **Be wrong.** Some connections form conclusions that are plausible and false. Later knowledge *contradicts* them — the card glitches red, and you must retract it before it poisons the case.
- **Answer the three questions** — *who opened the door, what stopped his heart, what was he trying to say* — and the Memory Den will see you.
- **Present your conclusions** to Lyra. She already knows the facts; what she is testing is whether you understood them. The right conclusion opens the archive — and Issue #1's ending.

The case auto-saves; reload to continue. "Burn the file" on the board starts over.

## Controls

| Key | Action |
|-----|--------|
| A/D or ←/→ | Walk |
| E | Examine / talk / doors / advance dialogue |
| C or Tab | Case board |
| W/S + E (or click) | Dialogue choices |
| Esc | Close overlays |

## Visual direction

Pixel art living in a 3D-lit scene (fixed 960×540, HDR bloom before a pixelated upscale), with a palette that carries the theme: **sodium amber for Everybody** — the human street, the noodle stand, the door lamp — and **cold teal for Nobody** — the harvest rig, the patrol drone, the machine that watches. All art and audio is procedural; the only binary asset is the painted skyline.

## Running

```sh
npm install
npm run dev    # play at localhost:5173
npm run build  # typecheck + production build
```

## Structure

```
src/
  main.ts, Game.ts        orchestration: scenes, modes, camera, interaction
  core/                   pipeline (renderer+post), input, audio synth, textures
  case/                   the deduction model + CaseFile store (state, saves)
  story/                  ALL content: fragments, link table, questions, dialogue
  ui/                     case board, dialogue box, HUD, toasts, title cards
  world/                  Cole, shared FX, and the three scenes (street/studio/den)
```

## Where Issue #2 points

- The first fragment has been played; "find the first one" now means a *person*.
- The dissolving woman (the slashed canvas) is a face waiting for a name.
- Lyra's companion arc (story bible, locked): watching → contacting → traveling with.
- The editor who cuts streets out of the city's memory has not been met.
