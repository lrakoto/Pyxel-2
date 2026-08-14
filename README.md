# EVERYBODY/NOBODY (working title)

A cyberpunk noir detective RPG set in **New Angeles, 2077**. Detective Xander Darius Cole investigates the murder of an artist-cyborg in Sector 7 and uncovers a hidden economy of stolen human creativity.

Full narrative design: [docs/STORY_BIBLE.md](docs/STORY_BIBLE.md)
Full project context / architecture / next steps: [AGENTS.md](AGENTS.md)

> This repository is the **ground-up rebuild** of the original prototype (Pyxel), reorganized into a clean engine/game architecture with the dead code removed. Gameplay, story content, and the tuned visual identity are carried over intact.

## Visual direction

Inspired by *REPLACED* and HD-2D: **pixel art living inside a real 3D-lit scene**.

- Fixed 960x540 internal render resolution, upscaled with crisp pixels
- Sprites use lit materials so neon point lights tint them as they move
- Cinematic post stack: HDR bloom, film grain, chromatic aberration, vignette, lens dirt
- Fog, rain, flickering neon, and parallax depth layers for atmosphere
- Cinematic glitch title screen with scanlines and chromatic split

All current art is procedural placeholder (generated at runtime) — the only binary asset is the painted skyline plate. Real sprite sheets (Aseprite) drop into `assets/sprites/` and replace the procedural frames at runtime without any code change.

## Running

```sh
npm install
npm run dev        # dev server
npm run build      # aseprite import + typecheck + production build
npm run typecheck  # typecheck only
```

## Controls

| Key | Action |
|-----|--------|
| ←/→ or A/D | Walk |
| E | Investigate / examine / enter doorway / advance dialogue |
| I or Esc | Enter / exit investigation mode |
| Click/tap a glint | Walk there; examination fires automatically on arrival |
| Click/tap the ground | Walk there (investigation mode) |
| [ / ] | Cycle focus between glints (investigation mode) |
| Space | Advance dialogue |
| J or Tab | Case journal (pauses the game) |
| B | Dev trigger — enter shooter combat |
| → in combat | A/D or ←/→ move · Space/W/↑ jump · mouse aim · hold LMB fire · Esc/Q exit |

## Structure

```
src/
  main.ts                 entry point
  engine/                 reusable, game-agnostic layer
    Pipeline.ts           renderer + camera + post stack + pixel upscale
    Input.ts              keyboard state with edge-triggered presses
    StateMachine.ts       generic state machine (enter/exit/update)
    textures.ts           canvas-texture helpers + plate pixelation
    sprites/              Aseprite runtime (manifest/atlas loader, tag animator)
  game/
    Game.ts               wiring: areas, transitions, shared systems, loop
    GameContext.ts        the shared-state contract passed to states
    states/               Explore ↔ Investigate ↔ Shooter
    investigation/        journal, journal UI, evidence toast
    dialogue/             typewriter dialogue presenter + interaction types
    data/                 ALL story content: scripts, clues, case constants
    audio/AudioManager.ts procedural Web Audio (ambience beds + one-shots)
    world/
      area.ts             AreaWorld/DoorDef contracts
      sector7/            the street: buildings, signs, props, peds, wires
      studio/             Marlon's studio: crime scene interior
      actors/             Player (Cole), Scarf sim, Lyra, procedural sprites
      fx/                 Rain, RainSplash, mirror Puddles, Glint
      textures/           procedural env textures (facades, street, sky)
    shooter/              run-and-gun: enemies, bullets, gun, sparks, floaters
  debug/tuningPanel.ts    dev-only live tuning sliders
  tuning.ts               live-tunable values (rewritten by the panel's Save)
tools/
  aseprite-import.mjs     .aseprite → packed atlas + manifest compiler
docs/
  STORY_BIBLE.md          canonical narrative design document
```

## Feature summary

- **Exploration** — walkable Sector 7 street and Marlon's studio interior, connected by fade transitions with door prompts.
- **Investigation** — glint-marked investigation mode (E near an object or I), evidence clues with a case journal (J/Tab), clue-conditional re-examination, click-to-walk, discovery chimes, and a studio case conclusion that reveals Lyra on the street.
- **Shooter combat slice** — press B on the street: keyboard move/jump, 360° mouse-aim machine pistol, waves of ground enforcers and aerial drones, hit-stop, screen shake, knockback, damage numbers, procedural combat SFX, downed/revive flow.
- **Procedural audio** — rain, neon hum, city drone (exterior bed) crossfaded with muffled rain, building hum, and a neural-device pulse (interior bed); footsteps and combat one-shots through a limiter.
- **Art pipeline** — drop an `.aseprite` file in `assets/sprites/` and it compiles to an atlas and hot-swaps in at runtime; procedural frames remain the fallback.

## Roadmap

1. ✅ REPLACED-style render pipeline proof-of-scene
2. ✅ Real-time shooter combat slice
3. ✅ Scene/state management + area system with fade transitions
4. ✅ Dialogue and investigation systems
5. ✅ Area expansion (street ↔ studio interior)
6. ✅ Ground-up rebuild: engine/game split, data-driven story content
7. 🚧 More interiors (Memory Den, Hotel, clinics, galleries)
8. ⬜ NPCs and character dialogue (Lyra companion arc, Marlon flashbacks, the Broker)
9. ⬜ Real sprite art content (Aseprite sheets for Cole, enforcer, drone, peds, Lyra)
10. ⬜ Save/load (journal + flags persistence)
