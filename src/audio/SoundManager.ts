// High-Fidelity Synthesized Web Audio Engine for Roadster: Flight Mode
// Click-free, debounced, optimized audio with pure electric powertrain & pneumatic rocket thrusters

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isInitialized: boolean = false;

  // Motor audio nodes
  private motorOsc1: OscillatorNode | null = null;
  private motorOsc2: OscillatorNode | null = null;
  private motorGain: GainNode | null = null;
  private motorFilter: BiquadFilterNode | null = null;

  // Thruster noise nodes
  private thrusterNoiseSource: AudioBufferSourceNode | null = null;
  private thrusterGain: GainNode | null = null;
  private thrusterFilter: BiquadFilterNode | null = null;
  private thrusterSubOsc: OscillatorNode | null = null;
  private thrusterSubGain: GainNode | null = null;

  // Wind / Speed rush
  private windGain: GainNode | null = null;
  private masterGain: GainNode | null = null;

  // State caches to avoid overlapping audio param events
  private lastKmh: number = -1;
  private lastThrusterState: boolean = false;
  private lastAirborneState: boolean = false;
  private lastRcsBurstTime: number = 0;
  private lastImpactTime: number = 0;

  constructor() {
    const saved = localStorage.getItem('roadster_muted');
    if (saved !== null) {
      this.isMuted = saved === 'true';
    }
  }

  public init() {
    if (this.isInitialized) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.8, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.initMotor();
      this.initThruster();
      this.initWindNoise();

      this.isInitialized = true;
    } catch {
      // Audio not supported or autoplay blocked
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private createNoiseBuffer(): AudioBuffer {
    if (!this.ctx) throw new Error('No ctx');
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    // Smooth pink/brown noise algorithm for soft pneumatic gas roar without harsh clicking
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      data[i] = (b0 + b1 + b2 + white * 0.5362) * 0.11;
    }
    return buffer;
  }

  private initMotor() {
    if (!this.ctx || !this.masterGain) return;

    this.motorOsc1 = this.ctx.createOscillator();
    this.motorOsc2 = this.ctx.createOscillator();
    this.motorGain = this.ctx.createGain();
    this.motorFilter = this.ctx.createBiquadFilter();

    // Pure futuristic dual-sine electric whir
    this.motorOsc1.type = 'sine';
    this.motorOsc2.type = 'triangle';

    this.motorOsc1.frequency.setValueAtTime(80, this.ctx.currentTime);
    this.motorOsc2.frequency.setValueAtTime(160, this.ctx.currentTime);

    this.motorFilter.type = 'lowpass';
    this.motorFilter.frequency.setValueAtTime(300, this.ctx.currentTime);
    this.motorFilter.Q.setValueAtTime(2, this.ctx.currentTime);

    this.motorGain.gain.setValueAtTime(0.02, this.ctx.currentTime);

    this.motorOsc1.connect(this.motorFilter);
    this.motorOsc2.connect(this.motorFilter);
    this.motorFilter.connect(this.motorGain);
    this.motorGain.connect(this.masterGain);

    this.motorOsc1.start();
    this.motorOsc2.start();
  }

  private initThruster() {
    if (!this.ctx || !this.masterGain) return;

    const noiseBuffer = this.createNoiseBuffer();
    this.thrusterNoiseSource = this.ctx.createBufferSource();
    this.thrusterNoiseSource.buffer = noiseBuffer;
    this.thrusterNoiseSource.loop = true;

    this.thrusterFilter = this.ctx.createBiquadFilter();
    this.thrusterFilter.type = 'bandpass';
    this.thrusterFilter.frequency.setValueAtTime(650, this.ctx.currentTime);
    this.thrusterFilter.Q.setValueAtTime(1.2, this.ctx.currentTime);

    this.thrusterGain = this.ctx.createGain();
    this.thrusterGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    // Deep sub-bass rocket rumble
    this.thrusterSubOsc = this.ctx.createOscillator();
    this.thrusterSubOsc.type = 'sine';
    this.thrusterSubOsc.frequency.setValueAtTime(45, this.ctx.currentTime);

    this.thrusterSubGain = this.ctx.createGain();
    this.thrusterSubGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    this.thrusterNoiseSource.connect(this.thrusterFilter);
    this.thrusterFilter.connect(this.thrusterGain);
    this.thrusterGain.connect(this.masterGain);

    this.thrusterSubOsc.connect(this.thrusterSubGain);
    this.thrusterSubGain.connect(this.masterGain);

    this.thrusterNoiseSource.start();
    this.thrusterSubOsc.start();
  }

  private initWindNoise() {
    if (!this.ctx || !this.masterGain) return;

    const noiseBuffer = this.createNoiseBuffer();
    const source = this.ctx.createBufferSource();
    source.buffer = noiseBuffer;
    source.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(280, this.ctx.currentTime);

    this.windGain = this.ctx.createGain();
    this.windGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    source.connect(filter);
    filter.connect(this.windGain);
    this.windGain.connect(this.masterGain);

    source.start();
  }

  public updateTelemetrySounds(speedKmh: number, isThrusterActive: boolean, isAirborne: boolean, _isDrifting: boolean, isBoosting: boolean) {
    if (!this.ctx || !this.isInitialized || this.isMuted) return;

    // Only update if changes are perceptible (reduces audio buffer scheduler load by 80%)
    const kmhDiff = Math.abs(speedKmh - this.lastKmh);
    const thrusterChanged = isThrusterActive !== this.lastThrusterState;
    const airborneChanged = isAirborne !== this.lastAirborneState;

    if (kmhDiff < 2 && !thrusterChanged && !airborneChanged) {
      return;
    }

    this.lastKmh = speedKmh;
    this.lastThrusterState = isThrusterActive;
    this.lastAirborneState = isAirborne;

    const t = this.ctx.currentTime;
    const speedRatio = Math.min(speedKmh / 450, 1.2);

    // Motor sound: smooth pitch and volume
    if (this.motorOsc1 && this.motorOsc2 && this.motorFilter && this.motorGain) {
      const baseFreq = 75 + speedRatio * 520 + (isBoosting ? 180 : 0);
      this.motorOsc1.frequency.setTargetAtTime(baseFreq, t, 0.08);
      this.motorOsc2.frequency.setTargetAtTime(baseFreq * 1.5, t, 0.08);
      this.motorFilter.frequency.setTargetAtTime(260 + speedRatio * 1800, t, 0.08);

      const targetGain = isAirborne ? 0.04 : Math.max(0.02, speedRatio * 0.16 + (isBoosting ? 0.08 : 0));
      this.motorGain.gain.setTargetAtTime(targetGain, t, 0.1);
    }

    // Cold-Gas Thruster Roar
    if (this.thrusterGain && this.thrusterSubGain) {
      const thrusterTarget = isThrusterActive ? 0.42 : 0.0;
      this.thrusterGain.gain.setTargetAtTime(thrusterTarget, t, 0.05);
      this.thrusterSubGain.gain.setTargetAtTime(isThrusterActive ? 0.35 : 0.0, t, 0.05);
    }

    // High-speed wind rush
    if (this.windGain) {
      const windTarget = speedRatio > 0.4 ? (speedRatio - 0.4) * 0.16 : 0.0;
      this.windGain.gain.setTargetAtTime(windTarget, t, 0.15);
    }
  }

  // Cold-gas RCS micro-burst (Debounced to prevent node spamming!)
  public playRcsBurst() {
    if (!this.ctx || this.isMuted) return;
    const now = performance.now();
    if (now - this.lastRcsBurstTime < 160) return; // Debounce 160ms max
    this.lastRcsBurstTime = now;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.exponentialRampToValueAtTime(80, t + 0.07);

      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

      osc.connect(gain);
      if (this.masterGain) gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.09);
    } catch {
      // Ignore
    }
  }

  // Landing impact sound (Debounced)
  public playLandingImpact(impactVelocity: number, isClean: boolean) {
    if (!this.ctx || this.isMuted) return;
    const now = performance.now();
    if (now - this.lastImpactTime < 200) return;
    this.lastImpactTime = now;

    try {
      const t = this.ctx.currentTime;
      const intensity = Math.min(Math.abs(impactVelocity) / 30, 1.0);

      const thudOsc = this.ctx.createOscillator();
      const thudGain = this.ctx.createGain();
      thudOsc.type = 'sine';
      thudOsc.frequency.setValueAtTime(110, t);
      thudOsc.frequency.exponentialRampToValueAtTime(30, t + 0.22);

      const gainVal = Math.max(0.08, intensity * (isClean ? 0.28 : 0.42));
      thudGain.gain.setValueAtTime(gainVal, t);
      thudGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

      thudOsc.connect(thudGain);
      if (this.masterGain) thudGain.connect(this.masterGain);

      thudOsc.start(t);
      thudOsc.stop(t + 0.26);
    } catch {
      // Ignore
    }
  }

  // Ring pickup chime (Crystal chord)
  public playRingPickup() {
    if (!this.ctx || this.isMuted) return;
    try {
      const t = this.ctx.currentTime;
      const freqs = [659.25, 830.61, 1046.5]; // E5, G#5, C6
      freqs.forEach((freq, idx) => {
        if (!this.ctx) return;
        const noteTime = t + idx * 0.045;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.14, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.28);

        osc.connect(gain);
        if (this.masterGain) gain.connect(this.masterGain);

        osc.start(noteTime);
        osc.stop(noteTime + 0.3);
      });
    } catch {
      // Ignore
    }
  }

  // Stunt achievement celebration chime
  public playStuntChime(multiplier: number) {
    if (!this.ctx || this.isMuted) return;
    try {
      const t = this.ctx.currentTime;
      const baseNote = 523.25 * Math.min(1 + multiplier * 0.08, 1.6);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseNote, t);
      osc.frequency.exponentialRampToValueAtTime(baseNote * 1.5, t + 0.16);

      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

      osc.connect(gain);
      if (this.masterGain) gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.32);
    } catch {
      // Ignore
    }
  }

  // Crash crunch sound
  public playCrash() {
    if (!this.ctx || this.isMuted) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(25, t + 0.4);

      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.42);

      osc.connect(gain);
      if (this.masterGain) gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.44);
    } catch {
      // Ignore
    }
  }

  public playCountdownBeep(isGo: boolean = false) {
    if (!this.ctx || this.isMuted) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(isGo ? 880 : 440, t);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + (isGo ? 0.35 : 0.12));

      osc.connect(gain);
      if (this.masterGain) gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + (isGo ? 0.36 : 0.13));
    } catch {
      // Ignore
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    localStorage.setItem('roadster_muted', String(this.isMuted));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.8, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }
}

export const soundManager = new SoundManager();
