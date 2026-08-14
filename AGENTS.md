# Working context — EVERYBODY/NOBODY (Pyxel-2 rebuild)

## Project state (August 2026)

This repository is the **ground-up rebuild** of the original Pyxel prototype. It carries
over every shipped feature and all tuned visual/audio values, reorganized into a clean
engine/game architecture. The dead CTB battle prototype from the original repo was
dropped entirely (the real-time shooter slice replaced it).

Playable now:
- Sector 7 street (exterior) ↔ Marlon's studio (interior crime scene), fade transitions
- Investigation mode with glints, evidence clues, case journal, clue-conditional
  re-examination, studio case conclusion → Lyra reveal on the street
- Real-time side-scrolling shooter slice (dev trigger: B)
- Procedural audio with exterior/interior ambience beds
- Aseprite art pipeline (compile-to-atlas + runtime hot swap; procedural fallback art)

## Controls

| Key | Action |
|-----|--------|
| ← → / A D | Walk |
| E | Enter investigation mode (near object) / examine / enter doorway / advance dialogue |
| I / Esc | Enter / exit investigation mode |
| Space | Advance dialogue |
| J / Tab | Case journal overlay (pauses game) |
| Click/tap glint | Walk to + auto-examine on arrival (investigation mode) |
| Click/tap ground | Walk there (investigation mode) |
| [ / ] | Cycle focus between glints (investigation mode) |
| B | Dev trigger — enter shooter combat |
| → in combat | A/D or ←/→ move · Space/W/↑ jump · mouse aim · hold LMB fire · Esc/Q exit |

## Architecture

The codebase is split into a game-agnostic **engine** layer and the **game** itself.

```
src/
  main.ts — entry point
  engine/                       ← reusable, knows nothing about the game
    Pipeline.ts — WebGLRenderer + PerspectiveCamera + EffectComposer post stack
                  (bloom/CA/grain/vignette/lens dirt) at fixed 960×540, pixelated
                  CSS upscale. setScene() retargets the RenderPass in place —
                  no pass surgery on area swaps.
    Input.ts — keyboard state. isDown()/anyDown() are level-triggered;
               pressed()/anyPressed() are edge-triggered (one frame per physical
               press, OS repeat filtered). Edges clear in endFrame(). Replaces
               the old shared Set + manual keys.delete() pattern.
    StateMachine.ts — generic GameState<C>/StateMachine<C> with enter/exit/update
    textures.ts — canvasTexture (pixel) / smoothTexture (gradient) /
                  spriteTexture (pixel-map rows) / loadPlateTexture (AI-plate pixelation)
    sprites/
      types.ts — SpriteManifest / AsepriteSheetMeta / tag & frame schemas (JSON contract)
      SpriteLibrary.ts — loads /sprites/manifest.json + atlas once; texture cache;
                         missing sheets → null so procedural art stays the fallback
      SpriteAnimator.ts — per-instance tag playback: forward / reverse / ping-pong(-reverse),
                          per-frame durations, holdLast + resume, per-play onDone
  game/
    Game.ts — builds the pipeline + all shared systems, owns the area registry and
              fade transitions, routes global input (journal toggle, audio unlock),
              drives the state machine. Journal-toggling keys are consumed so the
              active state never double-handles them.
    GameContext.ts — the shared-state contract passed to every state
    states/
      ExploreState.ts — walking, door prompts, dialogue, E→investigate, B→shooter
      InvestigateState.ts — glints on examinables, click/tap-to-walk, clue grant on
                            examine, camera pull-in, discovery chimes, [/] cycling,
                            studio case conclusion check
      ShooterState.ts — real-time combat: keyboard move/jump, 360° mouse-aim machine
                        pistol, waves, hit-stop/shake/knockback, damage numbers,
                        HP/down-revive, DOM HUD + crosshair
    investigation/
      Journal.ts — ClueDef + collected clues + evolving objective
      JournalUI.ts — full-screen case-file overlay (J/Tab/Esc, pauses world)
      ClueToast.ts — transient "EVIDENCE ADDED" notification
    dialogue/
      types.ts — InteractionDef (with clue grant / repeat / conditional / gated fields)
      DialogueManager.ts — typewriter presenter; content-free (resolver + clue-check injected)
    data/                       ← ALL story content lives here, not in scene code
      case.ts — clue-id constants, studio evidence set, objective triggers, conclusion text
      sector7Script.ts — 14 street interactions + Lyra's first-encounter dialogue
      studioScript.ts — 9 crime-scene interactions with clues + conditional insights
    audio/AudioManager.ts — procedural Web Audio: exterior bed (rain/neon hum/drone)
                            crossfaded with interior bed (muffled rain/building hum/
                            neural pulse) via setExterior(); footsteps; combat one-shots;
                            discovery chime; investigation duck; master → limiter
    world/
      area.ts — AreaWorld/DoorDef/Updatable contracts, incl. onClueAdded/onEnter hooks
      sector7/
        index.ts — the street scene: sky + painted plate, building rows, neon signs,
                    beams, animated windows, traffic, props, peds, Lyra, sparkles,
                    dev tuning panel wiring. Exports buildSector7Area().
        props.ts — street prop registry (vending/bin/crates/steam/puddle-glow/manhole)
                   + the Sparkles micro-facet specular system
        foreground.ts — utility poles + catenary wires (parallax layer)
        nearground.ts — blurred foreground silhouettes (fake DOF)
        pedestrians.ts — background walkers with umbrellas (tuning-panel resizable)
      studio/
        index.ts — buildStudioArea(): walls, floor, painting, easels, device, outline,
                    wall writing, flicker light, pipes
        textures.ts — all studio procedural textures (walls, floor, painting, device…)
      actors/
        Player.ts — Cole: sprite frames, wet-rim + sunglasses-glint shader, jump
                    physics (grounded/muzzleY), setFacing()/setBounds()
        Scarf.ts — verlet cloth ribbon (world-space sim, TUNING-driven)
        Lyra.ts — hooded AI figure with breathing cyan face light
        sprites.ts — procedural character frames at Aseprite-import spec:
                     Cole 32×56, enforcer 24×30, drone 16×10, peds 16×28, Lyra 16×32
      fx/
        Rain.ts — additive line-segment rain streaks (near + far layers)
        RainSplash.ts — ground splash particles cycling near the camera
        Puddles.ts — planar mirror puddle system with chromatic edge shift
        Glint.ts — pulsing additive sparkle marking examinables
      textures/city.ts — exterior procedural textures (facades, signs, sky, street + bump)
    shooter/
      Enemy.ts — ground enforcers + aerial drones; HP, hit-flash, knockback, death
      Bullets.ts — pooled tracer lines, per-frame segment collision callback
      Gun.ts — machine pistol sprite + muzzle flash + recoil, rotates to aim angle
      Sparks.ts — pooled additive spark bursts
      FloatingText.ts — DOM-composited damage numbers + "DOWN" labels
  debug/tuningPanel.ts — dev-only tuning sliders (Save writes src/tuning.ts via Vite endpoint)
  tuning.ts / tuningSchema.ts — live-tunable values + slider metadata
  style.css — all UI styling (title screen, HUD, dialogue, journal, shooter HUD)
tools/
  aseprite-import.mjs — .aseprite → packed atlas + manifest compiler (zero-dep parser)
```

## What changed vs. the original repo

- **Engine/game split** — Pipeline, Input, StateMachine, textures, and the sprite
  runtime moved to `src/engine/` with no game imports.
- **Story content extracted** — every interaction script, clue text, and case constant
  lives in `src/game/data/`; scene builders and the dialogue presenter are content-free.
- **Dead code removed** — the CTB battle prototype (BattleState, core/battle/, battle CSS)
  is gone.
- **RenderPass swap fixed** — area transitions call `pipeline.setScene()`, which assigns
  `renderPass.mainScene`; the old dispose-and-unshift pass surgery (a documented
  fragility) is gone.
- **Input model** — edge-triggered `pressed()` replaces destructive `keys.delete()`;
  keys can no longer stick or double-fire across states; the journal consumes its
  toggle key.
- **Small fixes** — footsteps no longer play while dialogue holds the player still;
  journal entries render via textContent (no HTML injection from clue text);
  glints get an explicit dispose(); shooter enemy add/remove uses the active area's
  scene consistently.
- **Dependencies** — three 0.180 / postprocessing 6.37 / vite 7 / TS 5.9.

## Area system

Areas are self-contained scenes that swap via a fade transition (0.4s out → swap →
0.4s in). Each AreaWorld has its own scene, updatables, sign lights, view point,
doors, interactions, exterior flag, bounds, ambient, camera target, and optional
`onClueAdded`/`onEnter` hooks so areas react to case progress (Lyra reveal).
The registry in Game.ts maps ids → builders; areas are cached after first build.
Shared objects (player, scarf, player light, rain, splashes, puddles) attach/detach
on transition; rain/puddles only attach to exterior areas.

Current areas: `sector7` (street) and `studio` (crime scene interior).

## Visual pipeline

- 960x540 fixed internal resolution → CSS `image-rendering: pixelated` upscale
- `depth: false`, `antialias: false` — all sorting by painter's algorithm
- ACESFilmic tone mapping, exposure 1.05
- Post stack: bloom (intensity 1.35, threshold 0.18), chromatic aberration
  (0.0014/0.0009), film grain (0.42), vignette (offset 0.22, darkness 0.72), lens dirt
- Tone mapping and post-processing applied BEFORE the pixelated upscale → smooth
  HDR bloom on chunky pixels

## Sprite pipeline (Aseprite)

Real art path: **`.aseprite` file → packed atlas + JSON manifest → runtime swap**.

- `tools/aseprite-import.mjs` parses the Aseprite binary format (RGBA frames, zlib
  cels, layer visibility, durations, tags, pivot slices), flattens frames, shelf-packs
  one atlas, writes `public/sprites/sprites.png` + `manifest.json`.
- Trigger: `npm run import-art`, or automatically on `npm run dev`/`build` via the
  Vite plugin that watches `assets/sprites/*.aseprite` and full-reloads on change.
- Runtime: `loadSheet('cole')` → tag windows; absent sheets → procedural fallback.
- Tags the code asks for (lowercase, in Aseprite): `idle`, `walk`, `jump` on Cole;
  `walk`, `death` on enforcer/drone; `walk` on `ped_a`/`ped_b`; `idle` on `lyra`;
  first frame on the studio `painting`.

## Next steps (high priority)

1. **More interiors** — the area system is generic: a new `build___Area()` + a door
   in sector7/index.ts. The story bible names the Memory Den (Lyra's archive — the
   next story beat), the Hotel, clinics, galleries.
2. **Investigation beyond the studio** — street-level clues in Sector 7; the Memory
   Den as the place the `studio-case-complete` thread resolves.
3. **Lyra companion arc** — per the story bible's locked direction: watching →
   contacting → traveling with Cole (Cortana-style). Plan a `lyra-companion-active`
   flag analogous to `studio-case-complete`; a companion needs persistent presence
   across areas, not a single-area NPC.
4. **Sprite art content** — the pipeline is built; it needs hand-drawn .aseprite
   files. The moment `assets/sprites/cole.aseprite` lands with idle/walk/jump tags
   it goes live with no code change.
5. **Save/load** — the journal + flags are the whole persistent state; serialize to
   localStorage and pre-populate on boot (area onEnter hooks already handle syncing).

## Known quirks / things to watch

- **No depth buffer** — draw order is renderOrder / painter's algorithm. New objects
  need explicit ordering.
- **Scarf Z-fighting** — the scarf sits at z=0.06 near the player plane at z=0. Works
  because depth is off; watch for clipping with future additions.
- **Reflection layer** — puddles use `layers.set(1)` for mirrored rendering. New
  exterior scene objects must be marked via `markReflectables` (runs on attach) or
  flagged `userData.noReflect`.
- **Journal pauses, input persists** — while the journal is open the state machine
  doesn't tick; held movement keys resume naturally on close, and edge presses made
  while paused are discarded each frame.
- **Title screen timing** — the title card animates out at 4s; the HUD fades in at 3s.
  Coordinate any new title elements with those delays.
