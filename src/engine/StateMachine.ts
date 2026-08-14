/**
 * Minimal push-less state machine with enter/exit/update lifecycle. States are
 * game-defined; the context type is generic so the engine layer stays free of
 * game knowledge.
 */
export abstract class GameState<C> {
  abstract get name(): string;
  enter(_ctx: C) {}
  exit(_ctx: C) {}
  /** Return a new state to trigger a transition, or null to stay. */
  abstract update(ctx: C, dt: number): GameState<C> | null;
}

export class StateMachine<C> {
  private current: GameState<C> | null = null;

  constructor(private readonly ctx: C) {}

  get currentState(): GameState<C> | null {
    return this.current;
  }

  transition(newState: GameState<C>) {
    this.current?.exit(this.ctx);
    this.current = newState;
    this.current.enter(this.ctx);
  }

  update(dt: number) {
    if (!this.current) return;
    const next = this.current.update(this.ctx, dt);
    if (next && next !== this.current) {
      this.transition(next);
    }
  }
}
