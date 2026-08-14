import type { CaseFile } from '../case/CaseFile';
import type { DialogueTree } from '../story/script';
import type { Input } from '../core/input';
import type { AudioEngine } from '../core/audio';

interface Opt {
  label: string;
  next: string;
}

/**
 * The bottom dialogue panel. Handles two shapes of content:
 *  - plain examine lines (typewriter, E to advance)
 *  - tree dialogue with options, including the "present an inference" picker
 * The cinematic letterbox bars ride along with it.
 *
 * Option `next` ids support two specials: `__close` ends the conversation,
 * `__present:<inferenceId>` routes through the tree's present resolver.
 */
export class DialogueBox {
  private readonly el = document.getElementById('dlg')!;
  private readonly speakerEl = document.getElementById('dlg-speaker')!;
  private readonly textEl = document.getElementById('dlg-text')!;
  private readonly optionsEl = document.getElementById('dlg-options')!;
  private readonly advanceEl = document.getElementById('dlg-advance')!;

  private lines: string[] = [];
  private lineIdx = 0;
  private charIdx = 0;
  private charTimer = 0;
  private open = false;

  private tree: DialogueTree | null = null;
  private nodeId = '';
  private options: Opt[] = [];
  private optionIdx = 0;
  /** Options to show once the current lines finish (overrides node logic). */
  private queuedOptions: Opt[] | null = null;
  private presentAfterLines = false;
  private onClose: (() => void) | null = null;
  private presentResolver: ((infId: string) => string) | null = null;

  constructor(
    private readonly cf: CaseFile,
    private readonly audio: AudioEngine,
  ) {}

  get isOpen(): boolean {
    return this.open;
  }

  /** Plain examine text. */
  openLines(speaker: string, lines: string[], onClose?: () => void) {
    this.tree = null;
    this.presentResolver = null;
    this.onClose = onClose ?? null;
    this.startLines(speaker, lines);
  }

  /** Branching conversation. */
  openTree(
    tree: DialogueTree,
    startId: string,
    presentResolver: (infId: string) => string,
    onClose?: () => void,
  ) {
    this.tree = tree;
    this.presentResolver = presentResolver;
    this.onClose = onClose ?? null;
    this.enterNode(startId);
  }

  private enterNode(id: string) {
    if (id.startsWith('__present:')) {
      const infId = id.slice('__present:'.length);
      const next = this.presentResolver?.(infId) ?? '__close';
      this.enterNode(next);
      return;
    }
    if (id === '__close') {
      this.close();
      return;
    }
    const node = this.tree?.[id];
    if (!node) {
      this.close();
      return;
    }
    this.nodeId = id;
    node.onEnter?.(this.cf);
    this.presentAfterLines = !!node.present;
    this.startLines(node.speaker, node.lines);
  }

  private startLines(speaker: string, lines: string[]) {
    this.lines = lines;
    this.lineIdx = 0;
    this.charIdx = 0;
    this.charTimer = 0;
    this.options = [];
    this.queuedOptions = null;
    this.open = true;
    this.el.style.display = 'block';
    document.body.classList.add('cinema');
    this.speakerEl.textContent = speaker;
    this.textEl.textContent = '';
    this.optionsEl.textContent = '';
    this.advanceEl.style.display = 'none';
  }

  close() {
    this.open = false;
    this.tree = null;
    this.presentResolver = null;
    this.el.style.display = 'none';
    document.body.classList.remove('cinema');
    const done = this.onClose;
    this.onClose = null;
    done?.();
  }

  /** Called each frame while open. */
  update(dt: number, input: Input) {
    if (!this.open) return;

    if (this.options.length > 0) {
      if (input.pressed('KeyW', 'ArrowUp')) {
        this.optionIdx = (this.optionIdx - 1 + this.options.length) % this.options.length;
        this.audio.tick();
        this.renderOptions();
      }
      if (input.pressed('KeyS', 'ArrowDown')) {
        this.optionIdx = (this.optionIdx + 1) % this.options.length;
        this.audio.tick();
        this.renderOptions();
      }
      if (input.pressed('KeyE', 'Enter', 'Space')) {
        this.chooseCurrent();
      }
      if (input.pressed('Escape')) this.close();
      return;
    }

    const line = this.lines[this.lineIdx] ?? '';

    if (this.charIdx < line.length) {
      this.charTimer += dt;
      const add = Math.floor(this.charTimer * 52);
      if (add > 0) {
        this.charIdx = Math.min(this.charIdx + add, line.length);
        this.textEl.textContent = line.slice(0, this.charIdx);
        this.charTimer = 0;
        if (this.charIdx >= line.length) this.advanceEl.style.display = 'block';
      }
    }

    if (input.pressed('KeyE', 'Space', 'Enter')) {
      if (this.charIdx < line.length) {
        this.charIdx = line.length;
        this.textEl.textContent = line;
        this.advanceEl.style.display = 'block';
        return;
      }
      this.lineIdx++;
      this.advanceEl.style.display = 'none';
      if (this.lineIdx < this.lines.length) {
        this.charIdx = 0;
        this.charTimer = 0;
        this.textEl.textContent = '';
        return;
      }
      this.finishLines();
    }
    if (input.pressed('Escape') && !this.tree) this.close();
  }

  private finishLines() {
    if (this.queuedOptions) {
      this.options = this.queuedOptions;
      this.queuedOptions = null;
      this.optionIdx = 0;
      this.renderOptions();
      return;
    }
    if (!this.tree) {
      this.close();
      return;
    }
    if (this.presentAfterLines) {
      this.presentAfterLines = false;
      this.showPresentPicker();
      return;
    }
    const node = this.tree[this.nodeId];
    if (node.options && node.options.length > 0) {
      this.options = node.options
        .filter((o) => !o.when || o.when(this.cf))
        .map((o) => ({ label: o.label, next: o.next }));
      this.optionIdx = 0;
      this.renderOptions();
      return;
    }
    if (node.next) {
      this.enterNode(node.next);
      return;
    }
    this.close();
  }

  private showPresentPicker() {
    const held = this.cf.inferences;
    if (held.length === 0) {
      this.startLines('Cole', [
        'Nothing on the board holds together yet. I need to connect what I have before I hand her anything.',
      ]);
      this.queuedOptions = [{ label: '(Close the file.)', next: '__close' }];
      return;
    }
    this.options = held.map((inf) => ({
      label: `${this.cf.isContradicted(inf) ? '✕ ' : ''}${inf.title}`,
      next: `__present:${inf.id}`,
    }));
    this.options.push({ label: 'Never mind.', next: '__close' });
    this.optionIdx = 0;
    this.renderOptions();
  }

  private renderOptions() {
    this.optionsEl.textContent = '';
    this.options.forEach((o, i) => {
      const el = document.createElement('div');
      el.className = 'dlg-opt' + (i === this.optionIdx ? ' sel' : '');
      el.textContent = o.label;
      el.onclick = () => {
        this.optionIdx = i;
        this.chooseCurrent();
      };
      this.optionsEl.appendChild(el);
    });
  }

  private chooseCurrent() {
    const choice = this.options[this.optionIdx];
    if (!choice) return;
    this.audio.tick();
    if (choice.next === '__close') this.close();
    else this.enterNode(choice.next);
  }
}
