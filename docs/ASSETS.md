# Asset workflow

How art gets from your editor into the game. All current visuals are procedural placeholders generated at runtime (`src/game/world/textures/`, `src/game/world/actors/sprites.ts`) — each one is designed to be replaced by real art without touching the rendering/lighting code.

## Folder conventions

```
assets/sprites/     source .aseprite files — the art pipeline input (LFS-tracked)
assets/reference/   mood boards, REPLACED screenshots, palette swatches — not shipped
public/env/         painted background plates the game loads by URL
public/sprites/     GENERATED atlas + manifest (gitignored; rebuilt by the importer)
```

## The Aseprite pipeline

1. Draw in **Aseprite** (or LibreSprite). Name animation tags in lowercase:
   `idle` / `walk` / `jump` for Cole, `walk` / `death` for enforcer + drone,
   `walk` for `ped_a` / `ped_b`, `idle` for `lyra`.
2. Save the file as `assets/sprites/<id>.aseprite` — the `<id>` is what the code
   loads (`cole`, `enforcer`, `drone`, `ped_a`, `ped_b`, `lyra`, `painting`).
3. That's it. The dev server watches the folder, recompiles the atlas
   (`tools/aseprite-import.mjs`), and hot-reloads; `npm run build` does the same.
   If the sheet is absent, the game silently uses its procedural stand-in.

Optional: add a slice with a pivot in Aseprite to control the sprite's anchor.

## Sprite specs

- **Cole:** 32×56 px per frame (the procedural stand-in is drawn at exactly this
  spec, so matching it means identical world proportions).
- **Enforcer:** 24×30 · **Drone:** 16×10 · **Pedestrians:** 16×28 · **Lyra:** 16×32.
- **Keep a hard 1px dark outline** on silhouettes — the wet rim shader finds edges
  via the alpha channel, so clean silhouettes = clean rim glow.
- **Palette:** desaturated darks for the base (the scene is dark; midtones read as
  bright), saturated color reserved for emissive details (visor lights, implants,
  signs). Check art in-game early — the bloom/grain/fog stack changes how colors read.
- **Buildings/props:** any size; keep pixel density consistent with characters
  (1 world unit ≈ 13 texture px at current scale).

## Background plates

Painted or AI-generated plates go through `loadPlateTexture()` (downsample +
posterize + NearestFilter) so they sit inside the pixel-art look. The Sector 7
skyline is `public/env/skyline.png`, loaded with `width: 1280, posterize: 15`.
