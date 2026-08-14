import type { CaseFile } from '../case/CaseFile';
import type { AudioEngine } from '../core/audio';
import { QUESTIONS } from '../story/links';

/**
 * The case board — the game's centerpiece. Cole's neural HUD renders the
 * investigation as a constellation: fragment cards float in a dark field,
 * threads connect them, and conclusions hang off the threads that made them.
 *
 * Interaction: drag cards anywhere; click one card then another to propose a
 * thread. A meaningful pair snaps into an inference; a meaningless one
 * dissolves with one of Cole's musings. Contradicted conclusions glitch red
 * until retracted.
 */
export class CaseBoard {
  private readonly root = document.getElementById('board')!;
  private field!: HTMLDivElement;
  private svg!: SVGSVGElement;
  private logEl!: HTMLDivElement;
  private questionsEl!: HTMLDivElement;
  private open = false;
  private selected: string | null = null;
  private drag: { id: string; dx: number; dy: number; moved: boolean } | null = null;
  /** Set true by Game when new material arrived while the board was closed. */
  dirty = false;

  constructor(
    private readonly cf: CaseFile,
    private readonly audio: AudioEngine,
  ) {
    this.buildChrome();
  }

  get isOpen(): boolean {
    return this.open;
  }

  show() {
    this.open = true;
    this.dirty = false;
    this.root.style.display = 'flex';
    this.refresh();
  }

  hide() {
    this.open = false;
    this.selected = null;
    this.root.style.display = 'none';
  }

  toggle() {
    if (this.open) this.hide();
    else this.show();
  }

  private buildChrome() {
    this.root.innerHTML = `
      <div id="board-head">
        <span id="board-title">CASE FILE — GRAVES, M.</span>
        <span id="board-hint">click two cards to draw a thread · drag to arrange · C / ESC — close</span>
      </div>
      <div id="board-main">
        <div id="board-questions"></div>
        <div id="board-field">
          <svg id="board-svg" xmlns="http://www.w3.org/2000/svg"></svg>
        </div>
      </div>
      <div id="board-foot">
        <span id="board-log"></span>
        <button id="board-reset" title="Start the case over">burn the file</button>
      </div>`;
    this.field = this.root.querySelector('#board-field') as HTMLDivElement;
    this.svg = this.root.querySelector('#board-svg') as SVGSVGElement;
    this.logEl = this.root.querySelector('#board-log') as HTMLDivElement;
    this.questionsEl = this.root.querySelector('#board-questions') as HTMLDivElement;
    (this.root.querySelector('#board-reset') as HTMLButtonElement).onclick = () => {
      if (confirm('Burn the case file and start Issue #1 over?')) {
        (this.cf.constructor as typeof CaseFile).wipe();
        location.reload();
      }
    };

    window.addEventListener('pointermove', (e) => this.onPointerMove(e));
    window.addEventListener('pointerup', () => this.onPointerUp());
  }

  /** Rebuilds cards, threads, and the question ledger from CaseFile. */
  refresh() {
    if (!this.open) return;
    // Remove old cards.
    for (const el of [...this.field.querySelectorAll('.bcard')]) el.remove();

    const rect = this.field.getBoundingClientRect();
    const W = Math.max(rect.width, 600);
    const H = Math.max(rect.height, 400);

    const fragments = this.cf.fragments;
    fragments.forEach((f, i) => {
      const pos = this.ensurePos(f.id, () => {
        // First layout: a loose arc across the field.
        const t = fragments.length === 1 ? 0.5 : i / (fragments.length - 1);
        return [
          60 + t * (W - 300),
          70 + ((i % 2) * 0.42 + 0.08) * (H - 220) + Math.sin(i * 2.1) * 24,
        ];
      });
      this.field.appendChild(this.makeCard(f.id, f.kind, f.title, f.body, pos));
    });

    this.cf.inferences.forEach((inf, idx) => {
      const srcs = this.cf.sourcesOf(inf.id);
      const pos = this.ensurePos(inf.id, () => {
        if (!srcs) return [W / 2, H - 120];
        const a = this.cf.positions[srcs[0]] ?? [W / 2, H / 2];
        const b = this.cf.positions[srcs[1]] ?? [W / 2, H / 2];
        // Fan conclusions downward so consecutive ones don't stack.
        return [
          Math.min(W - 200, (a[0] + b[0]) / 2 + 24 + (idx % 3) * 46),
          Math.min(H - 140, (a[1] + b[1]) / 2 + 96 + idx * 30),
        ];
      });
      const contradicted = this.cf.isContradicted(inf);
      const card = this.makeCard(inf.id, 'inference', inf.title, inf.body, pos);
      card.classList.add('inf');
      if (contradicted) {
        card.classList.add('contradicted');
        const tag = document.createElement('div');
        tag.className = 'bcard-flag';
        tag.textContent = 'CONTRADICTED';
        card.appendChild(tag);
        const btn = document.createElement('button');
        btn.className = 'bcard-retract';
        btn.textContent = 'retract';
        btn.onclick = (e) => {
          e.stopPropagation();
          this.cf.retract(inf.id);
          this.audio.tick();
          this.log('Retracted. A detective who can’t let go of a bad idea isn’t one.');
          this.refresh();
        };
        card.appendChild(btn);
      }
      this.field.appendChild(card);
    });

    this.renderThreads();
    this.renderQuestions();
  }

  private ensurePos(id: string, init: () => [number, number]): [number, number] {
    if (!this.cf.positions[id]) {
      this.cf.positions[id] = init();
      this.cf.save();
    }
    return this.cf.positions[id];
  }

  private makeCard(
    id: string,
    kind: string,
    title: string,
    body: string,
    pos: [number, number],
  ): HTMLDivElement {
    const el = document.createElement('div');
    el.className = `bcard k-${kind}`;
    el.dataset.id = id;
    el.style.left = `${pos[0]}px`;
    el.style.top = `${pos[1]}px`;
    const kindEl = document.createElement('div');
    kindEl.className = 'bcard-kind';
    kindEl.textContent = kind.toUpperCase();
    const titleEl = document.createElement('div');
    titleEl.className = 'bcard-title';
    titleEl.textContent = title;
    const bodyEl = document.createElement('div');
    bodyEl.className = 'bcard-body';
    bodyEl.textContent = body;
    el.append(kindEl, titleEl, bodyEl);
    if (this.selected === id) el.classList.add('sel');

    el.addEventListener('pointerdown', (e) => {
      const r = el.getBoundingClientRect();
      this.drag = { id, dx: e.clientX - r.left, dy: e.clientY - r.top, moved: false };
      e.preventDefault();
    });
    el.addEventListener('click', () => {
      if (this.drag?.moved) return;
      this.onCardClick(id, el);
    });
    return el;
  }

  private onCardClick(id: string, el: HTMLDivElement) {
    if (this.selected === null) {
      this.selected = id;
      el.classList.add('sel');
      this.audio.tick();
      this.log('…and?');
      return;
    }
    if (this.selected === id) {
      this.selected = null;
      el.classList.remove('sel');
      return;
    }
    const a = this.selected;
    this.selected = null;
    const result = this.cf.tryLink(a, id);
    if (result.kind === 'inference') {
      this.audio.inference();
      this.log(`${result.inference.title} — noted.`);
      this.refresh();
      return;
    }
    if (result.kind === 'known') {
      this.audio.tick();
      this.log('Already threaded.');
      this.refresh();
      return;
    }
    this.audio.deflect();
    this.flashRejected(a, id);
    this.log(result.line);
    this.refresh();
  }

  private onPointerMove(e: PointerEvent) {
    if (!this.drag || !this.open) return;
    const fieldRect = this.field.getBoundingClientRect();
    const x = e.clientX - fieldRect.left - this.drag.dx;
    const y = e.clientY - fieldRect.top - this.drag.dy;
    const el = this.field.querySelector(`[data-id="${this.drag.id}"]`) as HTMLDivElement | null;
    if (!el) return;
    if (!this.drag.moved) {
      const cur = this.cf.positions[this.drag.id] ?? [0, 0];
      if (Math.abs(x - cur[0]) + Math.abs(y - cur[1]) < 5) return;
      this.drag.moved = true;
    }
    const nx = Math.max(0, Math.min(fieldRect.width - 180, x));
    const ny = Math.max(0, Math.min(fieldRect.height - 60, y));
    this.cf.positions[this.drag.id] = [nx, ny];
    el.style.left = `${nx}px`;
    el.style.top = `${ny}px`;
    this.renderThreads();
  }

  private onPointerUp() {
    if (this.drag?.moved) this.cf.save();
    this.drag = null;
  }

  private centerOf(id: string): [number, number] | null {
    const el = this.field.querySelector(`[data-id="${id}"]`) as HTMLDivElement | null;
    if (!el) return null;
    return [el.offsetLeft + el.offsetWidth / 2, el.offsetTop + el.offsetHeight / 2];
  }

  private renderThreads() {
    this.svg.innerHTML = '';
    const mk = (a: [number, number], b: [number, number], cls: string) => {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', String(a[0]));
      line.setAttribute('y1', String(a[1]));
      line.setAttribute('x2', String(b[0]));
      line.setAttribute('y2', String(b[1]));
      line.setAttribute('class', cls);
      this.svg.appendChild(line);
    };
    for (const inf of this.cf.inferences) {
      const srcs = this.cf.sourcesOf(inf.id);
      const c = this.centerOf(inf.id);
      if (!srcs || !c) continue;
      const cls = this.cf.isContradicted(inf) ? 'thread bad' : inf.wrong ? 'thread warn' : 'thread';
      for (const s of srcs) {
        const sc = this.centerOf(s);
        if (sc) mk(sc, c, cls);
      }
    }
  }

  private flashRejected(a: string, b: string) {
    const ca = this.centerOf(a);
    const cb = this.centerOf(b);
    if (!ca || !cb) return;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', String(ca[0]));
    line.setAttribute('y1', String(ca[1]));
    line.setAttribute('x2', String(cb[0]));
    line.setAttribute('y2', String(cb[1]));
    line.setAttribute('class', 'thread reject');
    this.svg.appendChild(line);
    setTimeout(() => line.remove(), 900);
  }

  private renderQuestions() {
    this.questionsEl.innerHTML = '<div id="board-q-head">OPEN QUESTIONS</div>';
    for (const q of QUESTIONS) {
      const answer = this.cf.answerFor(q.id);
      const el = document.createElement('div');
      el.className = 'board-q' + (answer ? ' done' : '');
      const dot = document.createElement('span');
      dot.className = 'q-dot';
      const text = document.createElement('span');
      text.textContent = q.text;
      el.append(dot, text);
      if (answer) {
        const a = document.createElement('div');
        a.className = 'q-answer';
        a.textContent = `→ ${answer.title}`;
        el.appendChild(a);
      }
      this.questionsEl.appendChild(el);
    }
    if (this.cf.hasFlag('den-unlocked')) {
      const done = document.createElement('div');
      done.id = 'board-verdict';
      done.textContent = this.cf.hasFlag('ending')
        ? 'CASE — CONTINUED IN ISSUE #2'
        : 'The case points one way: the MEMORY DEN.';
      this.questionsEl.appendChild(done);
    }
  }

  private log(text: string) {
    this.logEl.textContent = text;
    this.logEl.classList.remove('in');
    void this.logEl.offsetWidth;
    this.logEl.classList.add('in');
  }
}
