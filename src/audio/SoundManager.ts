// High-Fidelity Synthesized Web Audio Engine for Roadster: Flight Mode
// Click-free, debounced, seamlessly looped pink-noise, pure electric powertrain & SpaceX cold-gas thrusters

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isInitialized: boolean = false;

  // Motor audio nodes
  private motorOsc1: OscillatorNode | null = null;
  private motorOsc2: OscillatorNode | null = null;
  private motorGain: GainNode | null = null;
  private motorFilter: BiquadFilterNode | null = null;

  // Thruster cold-gas nodes
  private thrusterNoiseSource: AudioBufferSourceNode | null = null;
  private thrusterGain: GainNode | null = null;
  private thrusterFilter: BiquadFilterNode | null = null;
  private thrusterSubOsc: OscillatorNode | null = null;
  private thrusterSubGain: GainNode | null = null;

  // Wind / Speed rush
  private windNoiseSource: AudioBufferSourceNode | null = null;
  private windGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;

  // High-performance regenerative & tire brake screech
  private brakeNoiseSource: AudioBufferSourceNode | null = null;
  private brakeGain: GainNode | null = null;
  private brakeFilter: BiquadFilterNode | null = null;

  // Crash fire crackle & burning rumble
  private fireNoiseSource: AudioBufferSourceNode | null = null;
  private fireGain: GainNode | null = null;
  private fireFilter: BiquadFilterNode | null = null;
  private fireRumbleOsc: OscillatorNode | null = null;
  private fireRumbleGain: GainNode | null = null;

  // Master output
  private masterGain: GainNode | null = null;

  // State caches to avoid redundant param scheduling
  private lastKmh: number = -1;
  private lastThrusterState: boolean = false;
  private lastAirborneState: boolean = false;
  private lastBrakeState: boolean = false;
  private lastFireState: boolean = false;
  private lastRcsBurstTime: number = 0;
  private lastImpactTime: number = 0;

  constructor() {
    const saved = localStorage.getItem('roadster_muted');
    if (saved !== null) {
      this.isMuted = saved === 'true';
    }

    // Auto-unlock on first user gesture
    if (typeof window !== 'undefined') {
      const unlock = () => {
        this.init();
        this.resume();
        window.removeEventListener('pointerdown', unlock);
        window.removeEventListener('keydown', unlock);
        window.removeEventListener('touchstart', unlock);
      };
      window.addEventListener('pointerdown', unlock, { passive: true });
      window.addEventListener('keydown', unlock, { passive: true });
      window.addEventListener('touchstart', unlock, { passive: true });
    }
  }

  public init() {
    if (this.isInitialized && this.ctx) {
      this.resume();
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.75, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.initMotor();
      this.initThruster();
      this.initWindNoise();
      this.initBrakeAudio();
      this.initFireAudio();

      this.isInitialized = true;
    } catch {
      // Audio autoplay restrictions or unsupported
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  // Create a 100% seamless, cross-faded, click-free pink noise buffer
  private createSeamlessNoiseBuffer(): AudioBuffer {
    if (!this.ctx) throw new Error('No ctx');
    const sampleRate = this.ctx.sampleRate;
    const duration = 3.0; // 3 seconds
    const length = Math.floor(sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    // Filtered pink noise algorithm
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    const raw = new Float32Array(length);

    // Warm-up filter to avoid initial DC jump
    for (let i = 0; i < 2000; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
    }

    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      raw[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
      b6 = white * 0.115926;
    }

    // Seamless Equal-Power Crossfade over 200ms at loop boundary to eliminate ANY pop or click
    const fadeSamples = Math.floor(sampleRate * 0.2);
    for (let i = 0; i < length; i++) {
      if (i < fadeSamples) {
        const t = i / fadeSamples;
        const fadeIn = Math.sin((t * Math.PI) / 2);
        const fadeOut = Math.cos((t * Math.PI) / 2);
        data[i] = raw[i] * fadeIn + raw[length - fadeSamples + i] * fadeOut;
      } else {
        data[i] = raw[i];
      }
    }

    return buffer;
  }

  private initMotor() {
    if (!this.ctx || !this.masterGain) return;

    this.motorOsc1 = this.ctx.createOscillator();
    this.motorOsc2 = this.ctx.createOscillator();
    this.motorGain = this.ctx.createGain();
    this.motorFilter = this.ctx.createBiquadFilter();

    // Futuristic dual-sine electric powertrain whir
    this.motorOsc1.type = 'sine';
    this.motorOsc2.type = 'triangle';

    this.motorOsc1.frequency.setValueAtTime(65, this.ctx.currentTime);
    this.motorOsc2.frequency.setValueAtTime(130, this.ctx.currentTime);

    this.motorFilter.type = 'lowpass';
    this.motorFilter.frequency.setValueAtTime(260, this.ctx.currentTime);
    this.motorFilter.Q.setValueAtTime(1.5, this.ctx.currentTime);

    // Start completely silent at 0 km/h
    this.motorGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    this.motorOsc1.connect(this.motorFilter);
    this.motorOsc2.connect(this.motorFilter);
    this.motorFilter.connect(this.motorGain);
    this.motorGain.connect(this.masterGain);

    this.motorOsc1.start();
    this.motorOsc2.start();
  }

  private initThruster() {
    if (!this.ctx || !this.masterGain) return;

    const noiseBuffer = this.createSeamlessNoiseBuffer();
    this.thrusterNoiseSource = this.ctx.createBufferSource();
    this.thrusterNoiseSource.buffer = noiseBuffer;
    this.thrusterNoiseSource.loop = true;

    // High-pressure cold-gas acoustic bandpass filter
    this.thrusterFilter = this.ctx.createBiquadFilter();
    this.thrusterFilter.type = 'bandpass';
    this.thrusterFilter.frequency.setValueAtTime(800, this.ctx.currentTime);
    this.thrusterFilter.Q.setValueAtTime(1.1, this.ctx.currentTime);

    this.thrusterGain = this.ctx.createGain();
    this.thrusterGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    // Deep sub-bass rocket rumble
    this.thrusterSubOsc = this.ctx.createOscillator();
    this.thrusterSubOsc.type = 'sine';
    this.thrusterSubOsc.frequency.setValueAtTime(42, this.ctx.currentTime);

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

    const noiseBuffer = this.createSeamlessNoiseBuffer();
    this.windNoiseSource = this.ctx.createBufferSource();
    this.windNoiseSource.buffer = noiseBuffer;
    this.windNoiseSource.loop = true;

    this.windFilter = this.ctx.createBiquadFilter();
    this.windFilter.type = 'lowpass';
    this.windFilter.frequency.setValueAtTime(260, this.ctx.currentTime);

    this.windGain = this.ctx.createGain();
    this.windGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    this.windNoiseSource.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(this.masterGain);

    this.windNoiseSource.start();
  }

  private initBrakeAudio() {
    if (!this.ctx || !this.masterGain) return;

    const noiseBuffer = this.createSeamlessNoiseBuffer();
    this.brakeNoiseSource = this.ctx.createBufferSource();
    this.brakeNoiseSource.buffer = noiseBuffer;
    this.brakeNoiseSource.loop = true;

    // Resonant bandpass filter for tire skid and carbon-ceramic brake bite
    this.brakeFilter = this.ctx.createBiquadFilter();
    this.brakeFilter.type = 'bandpass';
    this.brakeFilter.frequency.setValueAtTime(1450, this.ctx.currentTime);
    this.brakeFilter.Q.setValueAtTime(3.2, this.ctx.currentTime);

    this.brakeGain = this.ctx.createGain();
    this.brakeGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    this.brakeNoiseSource.connect(this.brakeFilter);
    this.brakeFilter.connect(this.brakeGain);
    this.brakeGain.connect(this.masterGain);

    this.brakeNoiseSource.start();
  }

  private initFireAudio() {
    if (!this.ctx || !this.masterGain) return;

    const noiseBuffer = this.createSeamlessNoiseBuffer();
    this.fireNoiseSource = this.ctx.createBufferSource();
    this.fireNoiseSource.buffer = noiseBuffer;
    this.fireNoiseSource.loop = true;

    // Crackle & hiss filter
    this.fireFilter = this.ctx.createBiquadFilter();
    this.fireFilter.type = 'bandpass';
    this.fireFilter.frequency.setValueAtTime(520, this.ctx.currentTime);
    this.fireFilter.Q.setValueAtTime(1.6, this.ctx.currentTime);

    this.fireGain = this.ctx.createGain();
    this.fireGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    // Deep burning combustion rumble
    this.fireRumbleOsc = this.ctx.createOscillator();
    this.fireRumbleOsc.type = 'sawtooth';
    this.fireRumbleOsc.frequency.setValueAtTime(50, this.ctx.currentTime);

    this.fireRumbleGain = this.ctx.createGain();
    this.fireRumbleGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    this.fireNoiseSource.connect(this.fireFilter);
    this.fireFilter.connect(this.fireGain);
    this.fireGain.connect(this.masterGain);

    this.fireRumbleOsc.connect(this.fireRumbleGain);
    this.fireRumbleGain.connect(this.masterGain);

    this.fireNoiseSource.start();
    this.fireRumbleOsc.start();
  }

  public updateTelemetrySounds(
    speedKmh: number,
    isThrusterActive: boolean,
    isAirborne: boolean,
    _isDrifting: boolean,
    isBoosting: boolean,
    isBraking: boolean = false,
    isFireActive: boolean = false
  ) {
    if (!this.ctx || !this.isInitialized || this.isMuted) return;

    const kmhDiff = Math.abs(speedKmh - this.lastKmh);
    const thrusterChanged = isThrusterActive !== this.lastThrusterState;
    const airborneChanged = isAirborne !== this.lastAirborneState;
    const brakeChanged = isBraking !== this.lastBrakeState;
    const fireChanged = isFireActive !== this.lastFireState;

    if (kmhDiff < 1.5 && !thrusterChanged && !airborneChanged && !brakeChanged && !fireChanged) {
      return;
    }

    this.lastKmh = speedKmh;
    this.lastThrusterState = isThrusterActive;
    this.lastAirborneState = isAirborne;
    this.lastBrakeState = isBraking;
    this.lastFireState = isFireActive;

    const t = this.ctx.currentTime;
    const speedRatio = Math.min(speedKmh / 420, 1.2);

    // Motor sound: silent when stopped, smooth progressive whir when moving
    if (this.motorOsc1 && this.motorOsc2 && this.motorFilter && this.motorGain) {
      if (speedKmh < 1.0) {
        this.motorGain.gain.setTargetAtTime(0.0, t, 0.08);
      } else {
        const baseFreq = 70 + speedRatio * 480 + (isBoosting ? 160 : 0);
        this.motorOsc1.frequency.setTargetAtTime(baseFreq, t, 0.08);
        this.motorOsc2.frequency.setTargetAtTime(baseFreq * 1.5, t, 0.08);
        this.motorFilter.frequency.setTargetAtTime(240 + speedRatio * 1600, t, 0.08);

        const targetGain = isAirborne ? 0.03 : Math.min(0.2, 0.02 + speedRatio * 0.16 + (isBoosting ? 0.06 : 0));
        this.motorGain.gain.setTargetAtTime(targetGain, t, 0.08);
      }
    }

    // Cold-Gas Thruster Roar: Smooth exponential ramp up and down
    if (this.thrusterGain && this.thrusterSubGain && this.thrusterFilter) {
      const thrusterTarget = isThrusterActive ? 0.38 : 0.0;
      const subTarget = isThrusterActive ? 0.30 : 0.0;
      this.thrusterGain.gain.setTargetAtTime(thrusterTarget, t, 0.04);
      this.thrusterSubGain.gain.setTargetAtTime(subTarget, t, 0.04);

      if (isThrusterActive) {
        // Dynamic hiss frequency depending on ground proximity / speed
        const filterFreq = isAirborne ? 750 : 920;
        this.thrusterFilter.frequency.setTargetAtTime(filterFreq, t, 0.06);
      }
    }

    // High-speed aerodynamic wind rush
    if (this.windGain && this.windFilter) {
      const windTarget = speedRatio > 0.35 ? (speedRatio - 0.35) * 0.18 : 0.0;
      this.windGain.gain.setTargetAtTime(windTarget, t, 0.12);
      this.windFilter.frequency.setTargetAtTime(220 + speedRatio * 850, t, 0.12);
    }

    // High-performance regenerative & tire brake screech
    if (this.brakeGain && this.brakeFilter) {
      const brakeTarget = isBraking && !isAirborne && speedKmh > 10.0 ? Math.min(0.26, 0.08 + (speedKmh / 200) * 0.18) : 0.0;
      this.brakeGain.gain.setTargetAtTime(brakeTarget, t, 0.05);
      if (isBraking && speedKmh > 10.0) {
        this.brakeFilter.frequency.setTargetAtTime(1300 + Math.min(speedKmh * 3.5, 900), t, 0.05);
      }
    }

    // Dynamic fire tracking crackle and deep burning roar
    if (this.fireGain && this.fireRumbleGain) {
      const fireTarget = isFireActive ? 0.35 : 0.0;
      const rumbleTarget = isFireActive ? 0.22 : 0.0;
      this.fireGain.gain.setTargetAtTime(fireTarget, t, 0.06);
      this.fireRumbleGain.gain.setTargetAtTime(rumbleTarget, t, 0.06);
    }
  }

  // Cold-gas RCS micro-burst (SpaceX cold-gas attitude control puff)
  public playRcsBurst() {
    if (!this.ctx || this.isMuted) return;
    const now = performance.now();
    if (now - this.lastRcsBurstTime < 130) return; // Debounce 130ms max
    this.lastRcsBurstTime = now;

    try {
      this.resume();
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(340, t);
      osc.frequency.exponentialRampToValueAtTime(70, t + 0.07);

      gain.gain.setValueAtTime(0.09, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.075);

      osc.connect(gain);
      if (this.masterGain) gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.08);
    } catch {
      // Ignore
    }
  }

  // Landing impact sound: Solid pneumatic thud and chassis compression
  public playLandingImpact(impactVelocity: number, isClean: boolean) {
    if (!this.ctx || this.isMuted) return;
    const now = performance.now();
    if (now - this.lastImpactTime < 220) return;
    this.lastImpactTime = now;

    try {
      this.resume();
      const t = this.ctx.currentTime;
      const intensity = Math.min(Math.abs(impactVelocity) / 28, 1.0);

      const thudOsc = this.ctx.createOscillator();
      const thudGain = this.ctx.createGain();

      thudOsc.type = 'sine';
      thudOsc.frequency.setValueAtTime(120, t);
      thudOsc.frequency.exponentialRampToValueAtTime(32, t + 0.22);

      const gainVal = Math.max(0.08, intensity * (isClean ? 0.25 : 0.38));
      thudGain.gain.setValueAtTime(gainVal, t);
      thudGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);

      thudOsc.connect(thudGain);
      if (this.masterGain) thudGain.connect(this.masterGain);

      thudOsc.start(t);
      thudOsc.stop(t + 0.25);
    } catch {
      // Ignore
    }
  }

  // Ring pickup chime (Clear crystal harmonic chord)
  public playRingPickup() {
    if (!this.ctx || this.isMuted) return;
    try {
      this.resume();
      const t = this.ctx.currentTime;
      const chord = [659.25, 830.61, 1046.5]; // E5, G#5, C6
      chord.forEach((freq, idx) => {
        if (!this.ctx) return;
        const noteTime = t + idx * 0.04;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.12, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.26);

        osc.connect(gain);
        if (this.masterGain) gain.connect(this.masterGain);

        osc.start(noteTime);
        osc.stop(noteTime + 0.28);
      });
    } catch {
      // Ignore
    }
  }

  // Stunt achievement & Mission complete celebration chime
  public playStuntChime(multiplier: number = 1) {
    if (!this.ctx || this.isMuted) return;
    try {
      this.resume();
      const t = this.ctx.currentTime;
      const baseNote = 523.25 * Math.min(1 + multiplier * 0.06, 1.5);
      const notes = [baseNote, baseNote * 1.25, baseNote * 1.5]; // Major triad arpeggio

      notes.forEach((freq, i) => {
        if (!this.ctx) return;
        const noteTime = t + i * 0.06;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.15, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.32);

        osc.connect(gain);
        if (this.masterGain) gain.connect(this.masterGain);

        osc.start(noteTime);
        osc.stop(noteTime + 0.34);
      });
    } catch {
      // Ignore
    }
  }

  // Crash crunch sound
  public playCrash() {
    if (!this.ctx || this.isMuted) return;
    try {
      this.resume();
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(130, t);
      osc.frequency.exponentialRampToValueAtTime(20, t + 0.38);

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);

      osc.connect(gain);
      if (this.masterGain) gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.42);
    } catch {
      // Ignore
    }
  }

  // Countdown & UI Beeps
  public playCountdownBeep(isGo: boolean = false) {
    if (!this.ctx || this.isMuted) return;
    try {
      this.resume();
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(isGo ? 880 : 440, t);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + (isGo ? 0.35 : 0.12));

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
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.75, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }
}

export const soundManager = new SoundManager();
