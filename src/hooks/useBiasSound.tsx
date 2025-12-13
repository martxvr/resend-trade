import { useCallback, useState } from 'react';

type BiasType = 'bullish' | 'bearish' | 'neutral';

// Audio context for premium sound generation
let audioContext: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

// Generate a professional, terminal-like sound
const playTone = (frequency: number, duration: number, type: OscillatorType = 'sine', fadeDirection: 'up' | 'down' | 'none' = 'none') => {
  const ctx = getAudioContext();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
  
  // Very subtle volume - professional and quiet
  const baseVolume = 0.08;
  
  if (fadeDirection === 'up') {
    // Rising tone for bullish
    oscillator.frequency.linearRampToValueAtTime(frequency * 1.2, ctx.currentTime + duration);
    gainNode.gain.setValueAtTime(baseVolume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
  } else if (fadeDirection === 'down') {
    // Falling tone for bearish
    oscillator.frequency.linearRampToValueAtTime(frequency * 0.8, ctx.currentTime + duration);
    gainNode.gain.setValueAtTime(baseVolume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
  } else {
    // Neutral click
    gainNode.gain.setValueAtTime(baseVolume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
  }
  
  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + duration);
};

export function useBiasSound() {
  const [isMuted, setIsMuted] = useState(false);

  const playBiasSound = useCallback((bias: BiasType) => {
    if (isMuted) return;
    
    try {
      switch (bias) {
        case 'bullish':
          // Soft upward tick - rising confidence
          playTone(440, 0.12, 'sine', 'up');
          break;
        case 'bearish':
          // Soft downward tick - falling tone
          playTone(330, 0.12, 'sine', 'down');
          break;
        case 'neutral':
          // Short balanced click
          playTone(520, 0.06, 'triangle', 'none');
          break;
      }
    } catch (error) {
      console.log('Audio playback not available');
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  return { playBiasSound, isMuted, toggleMute };
}
