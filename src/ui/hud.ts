import type { CaseFile } from '../case/CaseFile';

/** The thin diegetic layer: location, objective, prompt, board key. */
export class Hud {
  private readonly locEl = document.getElementById('loc-name')!;
  private readonly objectiveEl = document.getElementById('objective')!;
  private readonly promptEl = document.getElementById('prompt')!;
  private readonly boardKeyEl = document.getElementById('board-key')!;

  setLocation(name: string) {
    this.locEl.textContent = name;
  }

  refresh(cf: CaseFile) {
    this.objectiveEl.textContent = cf.objective;
  }

  prompt(text: string | null) {
    if (text) {
      this.promptEl.textContent = text;
      this.promptEl.style.display = 'block';
    } else {
      this.promptEl.style.display = 'none';
    }
  }

  /** Pulse the board key when the board has something new. */
  pulseBoardKey(on: boolean) {
    this.boardKeyEl.classList.toggle('pulse', on);
  }
}

export class Toast {
  private readonly el = document.getElementById('toast')!;
  private readonly labelEl = document.getElementById('toast-label')!;
  private readonly titleEl = document.getElementById('toast-title')!;
  private timer: ReturnType<typeof setTimeout> | null = null;

  show(label: string, title: string) {
    if (this.timer) clearTimeout(this.timer);
    this.labelEl.textContent = label;
    this.titleEl.textContent = title;
    this.el.style.display = 'flex';
    this.el.classList.remove('in');
    void (this.el as HTMLElement).offsetWidth;
    this.el.classList.add('in');
    this.timer = setTimeout(() => {
      this.el.style.display = 'none';
    }, 3800);
  }
}
