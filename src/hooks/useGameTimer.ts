import { useState, useEffect, useCallback, useRef } from 'react';
import { PieceColor } from '@/lib/chess';
import { supabase } from '@/integrations/supabase/client';

interface UseGameTimerProps {
  gameId: string | null;
  initialWhiteTime: number | null;
  initialBlackTime: number | null;
  currentTurn: PieceColor;
  isGameOver: boolean;
  isPlaying: boolean;
}

export function useGameTimer({
  gameId,
  initialWhiteTime,
  initialBlackTime,
  currentTurn,
  isGameOver,
  isPlaying,
}: UseGameTimerProps) {
  const [whiteTime, setWhiteTime] = useState<number | null>(initialWhiteTime);
  const [blackTime, setBlackTime] = useState<number | null>(initialBlackTime);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<number>(Date.now());

  // Update times from server
  useEffect(() => {
    setWhiteTime(initialWhiteTime);
    setBlackTime(initialBlackTime);
  }, [initialWhiteTime, initialBlackTime]);

  // Timer countdown
  useEffect(() => {
    if (!isPlaying || isGameOver || whiteTime === null || blackTime === null) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    lastUpdateRef.current = Date.now();

    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - lastUpdateRef.current) / 1000);
      
      if (elapsed >= 1) {
        lastUpdateRef.current = now;
        
        if (currentTurn === 'white') {
          setWhiteTime(prev => {
            if (prev === null) return null;
            const newTime = Math.max(0, prev - elapsed);
            return newTime;
          });
        } else {
          setBlackTime(prev => {
            if (prev === null) return null;
            const newTime = Math.max(0, prev - elapsed);
            return newTime;
          });
        }
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [currentTurn, isPlaying, isGameOver, whiteTime, blackTime]);

  // Save time to database periodically
  const saveTime = useCallback(async () => {
    if (!gameId || whiteTime === null || blackTime === null) return;
    
    await supabase.from('games').update({
      white_time_remaining: whiteTime,
      black_time_remaining: blackTime,
    }).eq('id', gameId);
  }, [gameId, whiteTime, blackTime]);

  // Check for timeout
  useEffect(() => {
    if (whiteTime === 0 || blackTime === 0) {
      if (gameId) {
        const winner = whiteTime === 0 ? 'black' : 'white';
        supabase.from('games').update({
          status: 'timeout',
          winner,
          white_time_remaining: whiteTime,
          black_time_remaining: blackTime,
        }).eq('id', gameId);
      }
    }
  }, [whiteTime, blackTime, gameId]);

  return { whiteTime, blackTime, saveTime };
}
