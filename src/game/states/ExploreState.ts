import { GameState } from '../../engine/StateMachine';
import type { GameContext } from '../GameContext';
import { ShooterState } from './ShooterState';
import { InvestigateState } from './InvestigateState';
import type { DoorDef } from '../world/area';

/**
 * Exploration: walk the area, read door prompts, advance dialogue. E near an
 * examinable enters investigation mode (where all examination happens); I
 * enters it directly; B is the dev trigger for shooter combat.
 */
export class ExploreState extends GameState<GameContext> {
  get name(): string {
    return 'explore';
  }

  update(ctx: GameContext, dt: number): GameState<GameContext> | null {
    const { player, playerLight, area, dialogue, audio, input, puddles, pipeline } = ctx;
    const camera = pipeline.camera;

    // Dialogue input takes priority — freezes movement while open
    if (dialogue.isOpen) {
      if (input.anyPressed('KeyE', 'Space')) {
        dialogue.advance();
      }
      if (!dialogue.findNearby(player.x)) dialogue.close();
    } else {
      player.update(dt, {
        left: input.anyDown('ArrowLeft', 'KeyA'),
        right: input.anyDown('ArrowRight', 'KeyD'),
      });
      playerLight.position.set(player.x + 0.4, 2.3, 2.2);
      player.updateRim(area.signLights);

      // Only update exterior effects if this area is exterior
      if (area.exterior) {
        ctx.rain.update(dt, ctx.camX);
        ctx.rainFar.update(dt, 0);
        ctx.splashes.update(dt, ctx.camX);
      }
      for (const u of area.updatables) u.update(dt);

      ctx.camX += (player.x * 0.9 - ctx.camX) * Math.min(1, dt * 3);
      camera.position.x = ctx.camX;
      camera.lookAt(ctx.camX, area.cameraTarget.y, area.cameraTarget.z);
      area.viewPoint.copy(camera.position);

      const nearby = dialogue.findNearby(player.x);
      const door = this.findNearbyDoor(player.x, area.doors);

      const hintEl = document.getElementById('interact-hint')!;
      if (door) {
        // Door prompt takes priority over interaction prompt
        hintEl.textContent = `E — ${door.label}`;
        hintEl.style.display = 'block';
        if (input.pressed('KeyE')) {
          hintEl.style.display = 'none';
          ctx.requestAreaTransition(door.target, door.spawnX, door.spawnFacing);
        }
      } else if (nearby) {
        hintEl.textContent = 'E — examine';
        hintEl.style.display = 'block';
        if (input.pressed('KeyE')) {
          hintEl.style.display = 'none';
          // All examination happens in investigation mode, where glints mark
          // examinables and objects can grant evidence.
          return new InvestigateState();
        }
      } else {
        hintEl.style.display = 'none';
      }

      // I enters investigation mode directly.
      if (input.pressed('KeyI')) {
        return new InvestigateState();
      }
    }

    dialogue.update(dt);

    const walking = input.anyDown('ArrowLeft', 'KeyA', 'ArrowRight', 'KeyD');
    audio.update(dt, walking && !dialogue.isOpen);

    if (area.exterior) {
      puddles.update(camera, dt);
      puddles.render(pipeline.renderer, area.scene);
    }

    // Dev trigger: B key enters the shooter combat
    if (input.pressed('KeyB')) {
      return new ShooterState();
    }

    return null;
  }

  private findNearbyDoor(playerX: number, doors: DoorDef[]): DoorDef | null {
    let best: { door: DoorDef; dist: number } | null = null;
    for (const door of doors) {
      const dist = Math.abs(door.x - playerX);
      if (dist < door.radius && (!best || dist < best.dist)) {
        best = { door, dist };
      }
    }
    return best?.door ?? null;
  }
}
