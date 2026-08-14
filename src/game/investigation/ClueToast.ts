/**
 * A transient toast shown when Cole collects new evidence. Slides up from the
 * bottom, holds, then slides away. Non-blocking — exploration continues.
 */
export class ClueToast {
  private readonly el: HTMLElement;
  private readonly labelEl: HTMLElement;
  private readonly titleEl: HTMLElement;
  private hideTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.el = document.createElement('div');
    this.el.id = 'clue-toast';
    this.el.style.display = 'none';
    this.labelEl = document.createElement('span');
    this.labelEl.className = 'clue-toast-label';
    this.labelEl.textContent = 'EVIDENCE ADDED';
    this.titleEl = document.createElement('span');
    this.titleEl.className = 'clue-toast-title';
    this.el.append(this.labelEl, this.titleEl);
    document.body.appendChild(this.el);
  }

  /** Show "EVIDENCE ADDED — <title>" for a few seconds. */
  show(title: string, label = 'EVIDENCE ADDED') {
    if (this.hideTimer) clearTimeout(this.hideTimer);
    this.labelEl.textContent = label;
    this.titleEl.textContent = title;
    this.el.style.display = 'flex';
    // Restart the slide-in animation.
    this.el.classList.remove('clue-toast-in');
    void this.el.offsetWidth;
    this.el.classList.add('clue-toast-in');
    this.hideTimer = setTimeout(() => {
      this.el.style.display = 'none';
    }, 4200);
  }
}
