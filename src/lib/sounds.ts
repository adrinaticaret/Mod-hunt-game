// Sound Manager for CARV Mod Hunt
// Uses Web Audio API for sound effects and HTMLAudioElement for background music

import backgroundMusic from '@/assets/background-music.mp3';

class SoundManager {
  private audioContext: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterVolume: number = 0.3;
  
  // Background music (real audio file)
  private backgroundAudio: HTMLAudioElement | null = null;
  private musicVolume: number = 0.5; // 0 to 1
  private isMusicPlaying: boolean = false;

  constructor() {
    // Initialize on first user interaction to comply with browser autoplay policies
    this.isMuted = localStorage.getItem('soundMuted') === 'true';
    this.musicVolume = parseFloat(localStorage.getItem('musicVolume') || '0.5');
    this.loadBackgroundMusic();
  }

  private loadBackgroundMusic(): void {
    this.backgroundAudio = new Audio(backgroundMusic);
    this.backgroundAudio.loop = true;
    this.backgroundAudio.volume = this.musicVolume;
  }

  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  private playTone(
    frequency: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume: number = 1
  ): void {
    if (this.isMuted) return;

    const ctx = this.getContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = type;
    oscillator.frequency.value = frequency;

    const finalVolume = volume * this.masterVolume;
    gainNode.gain.setValueAtTime(finalVolume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  }

  // صدای انفجار برای Trap
  explosion(): void {
    if (this.isMuted) return;

    const ctx = this.getContext();
    const duration = 0.5;

    // Bass rumble
    this.playTone(50, duration, 'sawtooth', 0.8);
    
    // Mid explosion
    setTimeout(() => {
      this.playTone(150, duration * 0.6, 'square', 0.6);
    }, 50);

    // High frequency crack
    setTimeout(() => {
      this.playTone(800, duration * 0.3, 'sawtooth', 0.4);
    }, 100);

    // White noise simulation
    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseBuffer.length; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    const noiseGain = ctx.createGain();
    noise.buffer = noiseBuffer;
    noise.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noiseGain.gain.setValueAtTime(0.3 * this.masterVolume, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration * 0.5);
    noise.start(ctx.currentTime);
  }

  // صدای موفقیت برای Mod Found (مثل جک‌پات)
  success(): void {
    if (this.isMuted) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, index) => {
      setTimeout(() => {
        this.playTone(freq, 0.3, 'sine', 0.5);
      }, index * 100);
    });

    // Bell-like overtone
    setTimeout(() => {
      this.playTone(2093, 0.8, 'sine', 0.3);
    }, 150);
  }

  // صدای دریافت HP
  hpGain(): void {
    if (this.isMuted) return;

    // Rising power-up sound
    const ctx = this.getContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(400, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.3);

    gainNode.gain.setValueAtTime(0.4 * this.masterVolume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);

    // Sparkle
    setTimeout(() => {
      this.playTone(1200, 0.1, 'sine', 0.3);
    }, 150);
  }

  // صدای کلیک معمولی
  click(): void {
    if (this.isMuted) return;
    this.playTone(800, 0.08, 'square', 0.2);
  }

  // صدای رویداد تصادفی
  random(): void {
    if (this.isMuted) return;

    const ctx = this.getContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sine';
    
    // Whoosh effect - frequency sweep
    oscillator.frequency.setValueAtTime(200, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.2);
    oscillator.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.4);

    gainNode.gain.setValueAtTime(0.3 * this.masterVolume, ctx.currentTime);
    gainNode.gain.setValueAtTime(0.5 * this.masterVolume, ctx.currentTime + 0.2);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.4);
  }

  // صدای پیروزی
  win(): void {
    if (this.isMuted) return;

    // Victory fanfare
    const melody = [
      { freq: 523.25, time: 0 },      // C5
      { freq: 659.25, time: 200 },    // E5
      { freq: 783.99, time: 400 },    // G5
      { freq: 1046.50, time: 600 },   // C6
      { freq: 1318.51, time: 900 },   // E6
    ];

    melody.forEach(({ freq, time }) => {
      setTimeout(() => {
        this.playTone(freq, 0.4, 'sine', 0.6);
      }, time);
    });

    // Triumphant chord at the end
    setTimeout(() => {
      this.playTone(523.25, 1, 'sine', 0.4);  // C
      this.playTone(659.25, 1, 'sine', 0.4);  // E
      this.playTone(783.99, 1, 'sine', 0.4);  // G
    }, 1200);
  }

  // صدای شکست
  lose(): void {
    if (this.isMuted) return;

    // Descending defeated sound
    const notes = [523.25, 493.88, 440.00, 392.00, 349.23]; // C5 -> F4
    notes.forEach((freq, index) => {
      setTimeout(() => {
        this.playTone(freq, 0.4, 'triangle', 0.5);
      }, index * 200);
    });

    // Low rumble
    setTimeout(() => {
      this.playTone(65.41, 1.2, 'sawtooth', 0.3);
    }, 800);
  }

  // Toggle mute/unmute
  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    
    // Also mute/unmute background music
    if (this.backgroundAudio) {
      this.backgroundAudio.volume = this.isMuted ? 0 : this.musicVolume;
    }
    
    localStorage.setItem('soundMuted', String(this.isMuted));
    return this.isMuted;
  }

  getMuted(): boolean {
    return this.isMuted;
  }

  // شروع موزیک پس‌زمینه (فایل واقعی)
  startBackgroundMusic(): void {
    if (this.isMusicPlaying || !this.backgroundAudio) return;

    this.backgroundAudio.play().catch(error => {
      console.error('Failed to play background music:', error);
    });
    this.isMusicPlaying = true;
  }

  // توقف موزیک پس‌زمینه
  stopBackgroundMusic(): void {
    if (!this.isMusicPlaying || !this.backgroundAudio) return;

    this.backgroundAudio.pause();
    this.backgroundAudio.currentTime = 0;
    this.isMusicPlaying = false;
  }

  // Toggle موزیک پس‌زمینه
  toggleBackgroundMusic(): boolean {
    if (this.isMusicPlaying) {
      this.stopBackgroundMusic();
    } else {
      this.startBackgroundMusic();
    }
    return this.isMusicPlaying;
  }

  getMusicPlaying(): boolean {
    return this.isMusicPlaying;
  }

  // تنظیم حجم صدای موزیک
  setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.backgroundAudio) {
      this.backgroundAudio.volume = this.musicVolume;
    }
    localStorage.setItem('musicVolume', String(this.musicVolume));
  }

  // دریافت حجم صدای موزیک
  getMusicVolume(): number {
    return this.musicVolume;
  }
}

// Export singleton instance
export const soundManager = new SoundManager();
