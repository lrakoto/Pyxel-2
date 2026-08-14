/**
 * All sound is synthesized with the Web Audio API — no assets. Two continuous
 * beds (street rain / interior hum) crossfade per scene; the deduction UI has
 * its own small vocabulary: a tick for examine, a two-note chime for a new
 * fragment, a rising triad when an inference forms, a flat minor-second sting
 * when the board rejects a thread, and a low pulse for contradictions.
 */
export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private rainGain: GainNode | null = null;
  private roomGain: GainNode | null = null;
  private exterior = true;
  private stepTimer = 0;
  private stepParity = 0;

  init() {
    if (this.ctx) return;
    const ctx = (this.ctx = new AudioContext());
    this.master = ctx.createGain();
    this.master.gain.value = 0.5;
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -8;
    limiter.ratio.value = 10;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.15;
    this.master.connect(limiter).connect(ctx.destination);

    // Rain bed — two low-passed noise layers with a slow swell.
    this.rainGain = ctx.createGain();
    this.rainGain.gain.value = 0.9;
    this.rainGain.connect(this.master);
    const near = this.noise(2);
    const nearF = ctx.createBiquadFilter();
    nearF.type = 'lowpass';
    nearF.frequency.value = 750;
    const nearG = ctx.createGain();
    nearG.gain.value = 0.3;
    near.connect(nearF).connect(nearG).connect(this.rainGain);
    near.start();
    const far = this.noise(3);
    const farF = ctx.createBiquadFilter();
    farF.type = 'lowpass';
    farF.frequency.value = 220;
    const farG = ctx.createGain();
    farG.gain.value = 0.18;
    far.connect(farF).connect(farG).connect(this.rainGain);
    far.start();
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.12;
    const lfoG = ctx.createGain();
    lfoG.gain.value = 0.08;
    lfo.connect(lfoG).connect(this.rainGain.gain);
    lfo.start();

    // Room bed — low building hum + faint mains bleed, silent outdoors.
    this.roomGain = ctx.createGain();
    this.roomGain.gain.value = 0.0001;
    this.roomGain.connect(this.master);
    for (const [f, g] of [[42, 0.05], [43.3, 0.05], [60, 0.025], [120, 0.012]] as const) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f;
      const og = ctx.createGain();
      og.gain.value = g;
      osc.connect(og).connect(this.roomGain);
      osc.start();
    }
    // Muffled rain bleeds indoors too.
    const muf = this.noise(3);
    const mufF = ctx.createBiquadFilter();
    mufF.type = 'lowpass';
    mufF.frequency.value = 150;
    const mufG = ctx.createGain();
    mufG.gain.value = 0.12;
    muf.connect(mufF).connect(mufG).connect(this.roomGain);
    muf.start();
  }

  private noise(seconds: number): AudioBufferSourceNode {
    const ctx = this.ctx!;
    const len = Math.ceil(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    return src;
  }

  /** Crossfade the beds when the scene changes. */
  setExterior(exterior: boolean) {
    this.exterior = exterior;
    if (!this.ctx || !this.rainGain || !this.roomGain) return;
    const t = this.ctx.currentTime;
    this.rainGain.gain.setTargetAtTime(exterior ? 0.9 : 0.12, t, 0.4);
    this.roomGain.gain.setTargetAtTime(exterior ? 0.0001 : 0.9, t, 0.4);
  }

  /** Per-frame: paced footsteps while walking. */
  update(dt: number, walking: boolean) {
    if (!this.ctx) return;
    if (walking) {
      this.stepTimer += dt;
      if (this.stepTimer >= 0.44) {
        this.stepTimer -= 0.44;
        this.footstep();
      }
    } else {
      this.stepTimer = 0.3;
    }
  }

  private footstep() {
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    this.stepParity ^= 1;
    const det = this.stepParity ? 1 : 0.93;
    const src = this.noise(0.05);
    src.loop = false;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = (this.exterior ? 900 : 650) * det;
    bp.Q.value = 1.8;
    const env = ctx.createGain();
    env.gain.setValueAtTime(this.exterior ? 0.5 : 0.35, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    src.connect(bp).connect(env).connect(this.master!);
    src.start(t);
    const knock = ctx.createOscillator();
    knock.type = 'sine';
    knock.frequency.setValueAtTime(140 * det, t);
    knock.frequency.exponentialRampToValueAtTime(80 * det, t + 0.05);
    const kEnv = ctx.createGain();
    kEnv.gain.setValueAtTime(0.0001, t);
    kEnv.gain.exponentialRampToValueAtTime(0.14, t + 0.006);
    kEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    knock.connect(kEnv).connect(this.master!);
    knock.start(t);
    knock.stop(t + 0.1);
  }

  /** Small dry click for UI focus / dialogue advance. */
  tick() {
    this.blip([1200], 0.03, 0.05, 'square');
  }

  /** New fragment collected — a glassy rising pair. */
  fragment() {
    this.blip([660, 990], 0.06, 0.5, 'sine', 0.09);
  }

  /** Inference formed — a slow rising triad, the case clicking together. */
  inference() {
    this.blip([440, 554, 659], 0.07, 0.8, 'sine', 0.14);
  }

  /** The board rejects a thread — a flat, dry double blip. */
  deflect() {
    this.blip([310, 300], 0.05, 0.1, 'triangle', 0.07);
  }

  /** Contradiction — a low minor-second pulse. */
  sting() {
    this.blip([185, 196], 0.09, 0.9, 'sawtooth', 0.0);
  }

  /** Scene transition whoosh. */
  door() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const src = this.noise(0.5);
    src.loop = false;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(2200, t);
    lp.frequency.exponentialRampToValueAtTime(180, t + 0.45);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.16, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    src.connect(lp).connect(env).connect(this.master!);
    src.start(t);
  }

  /** The ending chorus — layered detuned voices swelling in. */
  chorus() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    for (const base of [110, 165, 220, 275, 330]) {
      for (const det of [-3, 0, 4]) {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = base + det * 0.4;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.022, t + 2.2);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 9);
        osc.connect(g).connect(this.master!);
        osc.start(t);
        osc.stop(t + 9.2);
      }
    }
  }

  private blip(freqs: number[], gain: number, decay: number, type: OscillatorType, gap = 0.08) {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = f;
      const g = ctx.createGain();
      const t0 = t + i * gap;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(gain, t0 + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + Math.max(decay, 0.05));
      osc.connect(g).connect(this.master!);
      osc.start(t0);
      osc.stop(t0 + Math.max(decay, 0.05) + 0.05);
    });
  }
}
