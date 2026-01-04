import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GameState, PieceColor, Square, PieceType, createInitialGameState, boardToJson, jsonToBoard, squareToNotation, getMoveNotation } from '@/lib/chess';
import { useToast } from '@/hooks/use-toast';
import { useSoundEffects } from './useSoundEffects';

interface GameData {
  id: string;
  roomCode: string;
  whitePlayerName: string;
  blackPlayerName: string | null;
  gameState: GameState;
  status: string;
  winner?: PieceColor;
  whiteTimeRemaining: number | null;
  blackTimeRemaining: number | null;
  timerDuration: number | null;
  drawOfferedBy?: PieceColor | null;
}

interface ChatMessage {
  id: string;
  playerName: string;
  playerColor: PieceColor;
  message: string;
  timestamp: Date;
}

export function useChessGame(roomCode: string, playerName: string) {
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [playerColor, setPlayerColor] = useState<PieceColor | null>(null);
  const [isSpectator, setIsSpectator] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { playMove, playCapture, playCheck, playGameOver } = useSoundEffects();
  const lastMoveIdRef = useRef<number>(0);

  // Fetch game data
  const fetchGame = useCallback(async () => {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('room_code', roomCode)
      .maybeSingle();

    if (error) {
      setError('Failed to load game');
      setLoading(false);
      return;
    }

    if (!data) {
      setError('Game not found');
      setLoading(false);
      return;
    }

    const gameState = {
      ...createInitialGameState(),
      board: jsonToBoard(JSON.stringify(data.board_state)),
      currentTurn: data.current_turn as PieceColor,
      isCheckmate: data.status === 'checkmate',
      isStalemate: data.status === 'stalemate',
    };

    // Determine player color or spectator status
    const spectatorFlag = sessionStorage.getItem('chess_spectator') === 'true';
    if (spectatorFlag) {
      setIsSpectator(true);
      setPlayerColor(null);
    } else if (data.white_player_name === playerName) {
      setPlayerColor('white');
    } else if (data.black_player_name === playerName) {
      setPlayerColor('black');
    }

    setGameData({
      id: data.id,
      roomCode: data.room_code,
      whitePlayerName: data.white_player_name,
      blackPlayerName: data.black_player_name,
      gameState,
      status: data.status,
      winner: data.winner as PieceColor | undefined,
      whiteTimeRemaining: data.white_time_remaining,
      blackTimeRemaining: data.black_time_remaining,
      timerDuration: data.timer_duration,
      drawOfferedBy: null,
    });
    setLoading(false);
  }, [roomCode, playerName]);

  // Fetch chat messages
  const fetchMessages = useCallback(async (gameId: string) => {
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('game_id', gameId)
      .order('created_at', { ascending: true });

    if (data) {
      setMessages(data.map(m => ({
        id: m.id,
        playerName: m.player_name,
        playerColor: m.player_color as PieceColor,
        message: m.message,
        timestamp: new Date(m.created_at),
      })));
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchGame();
  }, [fetchGame]);

  // Load messages when game is loaded
  useEffect(() => {
    if (gameData?.id) {
      fetchMessages(gameData.id);
    }
  }, [gameData?.id, fetchMessages]);

  // Real-time subscriptions
  useEffect(() => {
    if (!gameData?.id) return;

    const channel = supabase
      .channel(`game-${roomCode}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'games', filter: `room_code=eq.${roomCode}` }, (payload) => {
        const data = payload.new as any;
        const gameState = {
          ...createInitialGameState(),
          board: jsonToBoard(JSON.stringify(data.board_state)),
          currentTurn: data.current_turn as PieceColor,
          isCheckmate: data.status === 'checkmate',
          isStalemate: data.status === 'stalemate',
        };
        
        // Check for game over
        if (data.status === 'checkmate' || data.status === 'stalemate' || data.status === 'timeout' || data.status === 'resigned' || data.status === 'draw') {
          playGameOver();
        }
        
        setGameData(prev => prev ? {
          ...prev,
          gameState,
          status: data.status,
          winner: data.winner as PieceColor | undefined,
          blackPlayerName: data.black_player_name,
          whiteTimeRemaining: data.white_time_remaining,
          blackTimeRemaining: data.black_time_remaining,
        } : null);
        
        if (data.black_player_name && !gameData.blackPlayerName) {
          toast({ title: `${data.black_player_name} joined the game!` });
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'moves', filter: `game_id=eq.${gameData.id}` }, (payload) => {
        const move = payload.new as any;
        
        // Only play sounds for opponent's moves
        if (move.player !== playerColor) {
          if (move.is_checkmate) {
            playGameOver();
          } else if (move.is_check) {
            playCheck();
          } else if (move.captured_piece) {
            playCapture();
          } else {
            playMove();
          }
        }
        
        setLastMove({
          from: { row: 8 - parseInt(move.from_square[1]), col: move.from_square.charCodeAt(0) - 97 },
          to: { row: 8 - parseInt(move.to_square[1]), col: move.to_square.charCodeAt(0) - 97 },
        });
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `game_id=eq.${gameData.id}` }, (payload) => {
        const msg = payload.new as any;
        
        // Handle draw offer/decline via chat messages
        if (msg.message === '__DRAW_OFFER__' && msg.player_color !== playerColor) {
          setGameData(prev => prev ? { ...prev, drawOfferedBy: msg.player_color as PieceColor } : null);
          toast({ title: 'Your opponent offers a draw!' });
          return;
        }
        if (msg.message === '__DRAW_DECLINED__') {
          setGameData(prev => prev ? { ...prev, drawOfferedBy: null } : null);
          if (msg.player_color !== playerColor) {
            toast({ title: 'Draw offer declined' });
          }
          return;
        }
        
        setMessages(prev => [...prev, {
          id: msg.id,
          playerName: msg.player_name,
          playerColor: msg.player_color as PieceColor,
          message: msg.message,
          timestamp: new Date(msg.created_at),
        }]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [gameData?.id, roomCode, toast, playerColor, playMove, playCapture, playCheck, playGameOver]);

  // Make a move
  const makeMove = useCallback(async (newGameState: GameState, from: Square, to: Square, promotion?: PieceType) => {
    if (!gameData || !playerColor) return;

    const move = newGameState.moveHistory[newGameState.moveHistory.length - 1];
    const status = newGameState.isCheckmate ? 'checkmate' : newGameState.isStalemate ? 'stalemate' : 'playing';

    // Play sound for own moves
    if (move.isCheckmate) {
      playGameOver();
    } else if (move.isCheck) {
      playCheck();
    } else if (move.captured) {
      playCapture();
    } else {
      playMove();
    }

    await supabase.from('games').update({
      board_state: JSON.parse(boardToJson(newGameState.board)),
      current_turn: newGameState.currentTurn,
      status,
      winner: newGameState.isCheckmate ? playerColor : null,
      last_move_at: new Date().toISOString(),
    }).eq('id', gameData.id);

    await supabase.from('moves').insert({
      game_id: gameData.id,
      move_number: newGameState.moveHistory.length,
      player: playerColor,
      from_square: squareToNotation(from),
      to_square: squareToNotation(to),
      piece: move.piece.type,
      captured_piece: move.captured?.type || null,
      is_check: move.isCheck || false,
      is_checkmate: move.isCheckmate || false,
      notation: getMoveNotation(move),
      board_state_after: JSON.parse(boardToJson(newGameState.board)),
    });

    setLastMove({ from, to });
  }, [gameData, playerColor, playMove, playCapture, playCheck, playGameOver]);

  // Resign
  const resign = useCallback(async () => {
    if (!gameData || !playerColor) return;
    const winner = playerColor === 'white' ? 'black' : 'white';
    
    await supabase.from('games').update({
      status: 'resigned',
      winner,
    }).eq('id', gameData.id);
    
    playGameOver();
  }, [gameData, playerColor, playGameOver]);

  // Offer draw
  const offerDraw = useCallback(async () => {
    if (!gameData || !playerColor) return;
    
    await supabase.from('chat_messages').insert({
      game_id: gameData.id,
      player_name: playerName,
      player_color: playerColor,
      message: '__DRAW_OFFER__',
    });
    
    setGameData(prev => prev ? { ...prev, drawOfferedBy: playerColor } : null);
    toast({ title: 'Draw offer sent' });
  }, [gameData, playerColor, playerName, toast]);

  // Accept draw
  const acceptDraw = useCallback(async () => {
    if (!gameData) return;
    
    await supabase.from('games').update({
      status: 'draw',
    }).eq('id', gameData.id);
    
    playGameOver();
  }, [gameData, playGameOver]);

  // Decline draw
  const declineDraw = useCallback(async () => {
    if (!gameData || !playerColor) return;
    
    await supabase.from('chat_messages').insert({
      game_id: gameData.id,
      player_name: playerName,
      player_color: playerColor,
      message: '__DRAW_DECLINED__',
    });
    
    setGameData(prev => prev ? { ...prev, drawOfferedBy: null } : null);
  }, [gameData, playerColor, playerName]);

  // Send chat message
  const sendMessage = useCallback(async (message: string) => {
    if (!gameData || !playerColor) return;
    await supabase.from('chat_messages').insert({
      game_id: gameData.id,
      player_name: playerName,
      player_color: playerColor,
      message,
    });
  }, [gameData, playerColor, playerName]);

  return { 
    gameData, 
    playerColor, 
    isSpectator,
    messages: messages.filter(m => !m.message.startsWith('__')), 
    lastMove, 
    loading, 
    error, 
    makeMove, 
    sendMessage, 
    resign,
    offerDraw,
    acceptDraw,
    declineDraw,
    refetch: fetchGame 
  };
}