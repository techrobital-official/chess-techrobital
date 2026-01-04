import { useCallback, useRef } from 'react';

// Sound frequencies and types
const SOUNDS = {
  move: { frequency: 300, duration: 0.1, type: 'sine' as OscillatorType },
  capture: { frequency: 200, duration: 0.15, type: 'sawtooth' as OscillatorType },
  check: { frequency: 600, duration: 0.3, type: 'square' as OscillatorType },
  gameOver: { frequencies: [523, 659, 784], duration: 0.4, type: 'sine' as OscillatorType },
};

export function useSoundEffects() {
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playTone = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine', volume = 0.3) => {
    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = type;
      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio not supported:', e);
    }
  }, [getAudioContext]);

  const playMove = useCallback(() => {
    playTone(SOUNDS.move.frequency, SOUNDS.move.duration, SOUNDS.move.type);
  }, [playTone]);

  const playCapture = useCallback(() => {
    playTone(SOUNDS.capture.frequency, SOUNDS.capture.duration, SOUNDS.capture.type, 0.4);
  }, [playTone]);

  const playCheck = useCallback(() => {
    const ctx = getAudioContext();
    playTone(SOUNDS.check.frequency, SOUNDS.check.duration, SOUNDS.check.type, 0.3);
    setTimeout(() => playTone(700, 0.2, 'square', 0.2), 150);
  }, [playTone, getAudioContext]);

  const playGameOver = useCallback(() => {
    const { frequencies, duration, type } = SOUNDS.gameOver;
    frequencies.forEach((freq, i) => {
      setTimeout(() => playTone(freq, duration, type, 0.25), i * 200);
    });
  }, [playTone]);

  return { playMove, playCapture, playCheck, playGameOver };
}
