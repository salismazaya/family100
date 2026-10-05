// Web Audio API Synthesizer for Family 100 Sound Effects
class GameSound {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.isUnlocked = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    this.isUnlocked = true;
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  // Suara Jawaban Benar (Ding Bell Khas Family 100)
  playCorrect() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880.00, now + 0.08); // A5

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.35, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.65);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  // Suara Jawaban Salah / TETOT Buzzer Family 100
  playWrong() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Dual low square waves untuk suara buzzer khas Family 100
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(110, now); // A2

      osc2.type = 'square';
      osc2.frequency.setValueAtTime(116.54, now); // Bb2 (Dissonant beat buzzer)

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.4, now + 0.03);
      gain.gain.setValueAtTime(0.4, now + 0.7);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.95);
      osc2.stop(now + 0.95);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }
}

window.gameSound = new GameSound();
