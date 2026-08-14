# Working context — EVERYBODY/NOBODY: Issue #1 — Fragments

## What this repo is (August 2026)

A **reinterpretation**, not a port. The original Pyxel prototype (walking sim +
shooter slice) was rebuilt 1:1 once — that version is preserved at git tag
`v0.2-faithful-rebuild`. Main now carries a game designed fresh from
docs/STORY_BIBLE.md with one thesis: *Cole's gift is interpretation, so
interpretation is the mechanic.* Deduction-driven noir; no combat.

## The design

Core loop: examine → collect **fragments** → connect pairs on the **case
board** → form **inferences** (including wrong-but-plausible ones that later
knowledge **contradicts**) → answer the three case questions → the Memory Den
unlocks → **present** conclusions to Lyra → ending.

- Fragments: `story/fragments.ts` (11 in Issue #1; kinds: evidence /
  testimony / observation — kind only affects card styling).
- The deduction table: `story/links.ts` — `LINKS` maps unordered fragment
  pairs to inferences. Wrong inferences carry `wrong: true` +
  `contradictedBy: [...ids]`. `QUESTIONS` maps each case question to the
  inference that answers it (contradicted answers don't count).
- Story gates are flags on CaseFile: `den-unlocked` (auto-set when all three
  questions are answered), `met-lyra`, `lyra-opened`, `ending`.
- Dialogue: `story/script.ts` — Lyra's tree, the present-resolver
  (which node each presented inference leads to), cold-open and ending cards.

Everything narrative lives under `src/story/`. Scenes carry only their examine
prose (in hotspot `lines`), because that prose is spatial.

## Architecture

```
src/
  main.ts
  Game.ts            — the orchestrator: mode machine ('play'|'dialogue'|'board'|
                       'cards'), scene registry + fade transitions, hotspot
                       interaction, markers, camera follow, ending trigger
  core/
    pipeline.ts      — 960×540 internal frame, ACES, bloom/CA/grain/vignette,
                       pixelated CSS upscale. DEPTH BUFFER IS ON (unlike the
                       prototypes) — sprites cut with alphaTest; no renderOrder
                       bookkeeping needed.
    input.ts         — isDown (level) / pressed (edge, cleared per frame)
    audio.ts         — all synth: rain/room beds (crossfade per scene),
                       footsteps, UI vocabulary (tick/fragment/inference/
                       deflect/sting), door whoosh, ending chorus
    tex.ts           — pixelTex/softTex/rowsTex/glowTex + platePixelate
  case/
    model.ts         — FragmentDef/InferenceDef/LinkRule/QuestionDef/LinkResult
    CaseFile.ts      — THE state store: fragments, inferences, flags, board
                       card positions, scene+playerX; event bus; localStorage
                       save (key `everybody-nobody:issue1`); objective ladder
  story/             — fragments.ts, links.ts, script.ts (see above)
  ui/
    CaseBoard.ts     — DOM board: draggable cards, click-two-to-thread, SVG
                       threads (cyan / amber=wrong / red-dashed=contradicted),
                       question ledger, retract buttons, "burn the file" reset
    DialogueBox.ts   — typewriter + tree options + present picker; option next
                       ids support `__close` and `__present:<inferenceId>`
    hud.ts, cards.ts — location/objective/prompt/board-key pulse; title cards
  world/
    types.ts         — WorldScene + Hotspot contracts (hotspot kinds:
                       examine / door / talk; doors can be `locked`)
    cole.ts          — the detective: fresh 32×56 procedural frames, alpha-edge
                       neon rim, small verlet scarf tail
    fx.ts            — Rain, WetStreak (fake reflection streaks tied to live
                       light intensity), Sparkles, Steam, Marker, Walkers,
                       NeonSign
    env.ts           — facades, signs, ground, sky fallback, cordon tape,
                       interior wall/floor generators
    street.ts        — the cordoned block: alley + studio door + sodium lamp,
                       cordon (fragment), dead camera (fragment), noodle stand
                       + vendor (fragment), EVERYBODY™ glitch billboard,
                       patrol drone with searchlight, Memory Den door (locked
                       until `den-unlocked`)
    studio.ts        — crime scene: skylight shaft, painting, outline+residue
                       →drain, harvest rig, wall writing, slashed canvas,
                       journal, work lamp; 8 fragments
    den.ts           — Lyra's archive: cartridge wall, counter, Lyra (talk),
                       the lone cartridge "№ 1"
```

## Palette rule (art direction, load-bearing)

Warm **sodium amber** (#e0a04a) = the human city, Everybody. Cold **teal**
(#63d8e8) = the machine, the harvest, Nobody. Pink (#e86ea8) is the Memory
Den's own color (memory as commodity). The Den interior deliberately inverts
the rule — its warm light is Lyra's hospitality; the archive glows both.
Keep new content on this axis.

## How to extend

- **New evidence**: add to `story/fragments.ts`, place a hotspot with
  `fragment:` in a scene, add any `LINKS` rows it participates in.
- **New wrong theory**: a LINKS row with `wrong: true` + `contradictedBy`.
- **New scene**: implement `WorldScene` (see den.ts for the smallest one),
  register in Game.ts `builders`, add a door hotspot somewhere.
- **New story beat**: gate via a CaseFile flag; set flags from dialogue
  `onEnter` or link formation; the objective ladder lives in CaseFile.
- **Issue #2 threads left open**: the first victim's identity, the dissolving
  woman's name, the "editor" with municipal keys, Lyra's companion transition
  (bible: watching → contacting → traveling with; plan a
  `lyra-companion-active` flag).

## Testing notes

- Save manipulation is the fast way to jump around:
  `localStorage['everybody-nobody:issue1']` holds
  `{fragments, inferences, flags, positions, scene, playerX}`; edit + reload.
- Synthetic KeyboardEvents (`window.dispatchEvent`) drive Input fine —
  hold-movement can be scripted with paired keydown/keyup.
- The whole case is completable in ~3 minutes when scripted; the critical
  path is: 3 street fragments → 8 studio fragments → links (lock+vendor,
  rig+body, painting+wall) → den → present Painted Testimony → "Play it."

## Quirks

- The board uses `confirm()` for "burn the file" — a native blocking dialog;
  avoid triggering it from browser automation.
- Dialogue re-opens if you keep pressing E while standing on a hotspot after
  it closes (by design — a player releases the key).
- WetStreak reflections are fake (gradient quads), not planar mirrors — a
  deliberate trade against the prototype's reflection render-target system.
- Cards' `#cards` overlay eats no input; mode 'cards' just parks the game.
