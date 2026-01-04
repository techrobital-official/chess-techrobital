import { useParams, useNavigate } from 'react-router-dom';
import { useChessGame } from '@/hooks/useChessGame';
import { useGameTimer } from '@/hooks/useGameTimer';
import { useBoardTheme } from '@/hooks/useBoardTheme';
import { ChessBoard } from '@/components/chess/ChessBoard';
import { GameInfo } from '@/components/chess/GameInfo';
import { MoveHistory } from '@/components/chess/MoveHistory';
import { CapturedPieces } from '@/components/chess/CapturedPieces';
import { GameChat } from '@/components/chess/GameChat';
import { GameOverDialog } from '@/components/chess/GameOverDialog';
import { GameControls } from '@/components/chess/GameControls';
import { BoardThemeSelector } from '@/components/chess/BoardThemeSelector';
import { PGNExport } from '@/components/chess/PGNExport';
import { Button } from '@/components/ui/button';
import { Loader2, Copy, Check, Share2, Eye } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function GamePage() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const playerName = sessionStorage.getItem('chess_player_name') || 'Player';
  const { 
    gameData, 
    playerColor, 
    isSpectator,
    messages, 
    lastMove, 
    loading, 
    error, 
    makeMove, 
    sendMessage,
    resign,
    offerDraw,
    acceptDraw,
    declineDraw,
  } = useChessGame(roomCode || '', playerName);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { themeId, setTheme } = useBoardTheme();

  const isPlaying = gameData?.status === 'playing';
  const isGameOver = gameData?.status === 'checkmate' || gameData?.status === 'stalemate' || gameData?.status === 'timeout' || gameData?.status === 'resigned' || gameData?.status === 'draw';

  const { whiteTime, blackTime } = useGameTimer({
    gameId: gameData?.id || null,
    initialWhiteTime: gameData?.whiteTimeRemaining ?? null,
    initialBlackTime: gameData?.blackTimeRemaining ?? null,
    currentTurn: gameData?.gameState.currentTurn || 'white',
    isGameOver,
    isPlaying,
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !gameData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <p className="text-destructive">{error || 'Game not found'}</p>
        <Button onClick={() => navigate('/')}>Back to Lobby</Button>
      </div>
    );
  }

  const isWaiting = gameData.status === 'waiting';

  const copyRoomCode = async () => {
    await navigator.clipboard.writeText(roomCode || '');
    setCopied(true);
    toast({ title: 'Room code copied!' });
    setTimeout(() => setCopied(false), 2000);
  };

  const shareGame = async () => {
    const shareUrl = `${window.location.origin}/game/${roomCode}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Chess Game Invite',
          text: `Join my chess game! Room code: ${roomCode}`,
          url: shareUrl,
        });
      } catch (e) {
        copyRoomCode();
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast({ title: 'Game link copied!' });
    }
  };

  if (isWaiting) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-6 p-4">
        <div className="text-center animate-fade-in">
          <div className="text-6xl mb-4">♔</div>
          <h1 className="text-2xl font-serif font-bold mb-2">Waiting for opponent...</h1>
          <p className="text-muted-foreground mb-6">Share this room code with a friend</p>
          <div className="glass-panel p-6 inline-block">
            <div className="font-mono text-4xl font-bold tracking-widest mb-4">{roomCode}</div>
            <div className="flex gap-2 justify-center">
              <Button onClick={copyRoomCode} variant="outline">
                {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {copied ? 'Copied!' : 'Copy Code'}
              </Button>
              <Button onClick={shareGame} variant="outline">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const hasTimer = gameData.timerDuration !== null;
  const drawOffered = gameData.drawOfferedBy === playerColor;
  const drawPending = gameData.drawOfferedBy !== null && gameData.drawOfferedBy !== playerColor;

  const getGameOverReason = () => {
    if (gameData.status === 'resigned') return 'resignation';
    if (gameData.status === 'timeout') return 'timeout';
    if (gameData.status === 'draw') return 'agreement';
    return undefined;
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        {/* Top bar with theme selector and spectator badge */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            {isSpectator && (
              <div className="flex items-center gap-2 px-3 py-1 bg-primary/20 text-primary rounded-full text-sm">
                <Eye className="w-4 h-4" />
                Spectator Mode
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <PGNExport
              moves={gameData.gameState.moveHistory}
              whitePlayer={gameData.whitePlayerName}
              blackPlayer={gameData.blackPlayerName || 'Unknown'}
              status={gameData.status}
              winner={gameData.winner}
              timerDuration={gameData.timerDuration}
              roomCode={roomCode || ''}
            />
            <BoardThemeSelector currentTheme={themeId} onThemeChange={setTheme} />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start justify-center">
          {/* Left sidebar */}
          <div className="w-full lg:w-64 space-y-4">
            <GameInfo
              whitePlayer={{ 
                name: gameData.whitePlayerName, 
                color: 'white', 
                timeRemaining: hasTimer ? whiteTime : undefined 
              }}
              blackPlayer={{ 
                name: gameData.blackPlayerName || 'Waiting...', 
                color: 'black',
                timeRemaining: hasTimer ? blackTime : undefined 
              }}
              currentTurn={gameData.gameState.currentTurn}
              playerColor={playerColor || 'white'}
              roomCode={roomCode || ''}
              isCheck={gameData.gameState.isCheck}
              isCheckmate={gameData.gameState.isCheckmate}
              isStalemate={gameData.gameState.isStalemate}
              winner={gameData.winner}
              hasTimer={hasTimer}
            />
            {!isGameOver && playerColor && !isSpectator && (
              <GameControls
                onResign={resign}
                onOfferDraw={offerDraw}
                onAcceptDraw={acceptDraw}
                onDeclineDraw={declineDraw}
                drawOffered={drawOffered}
                drawPending={drawPending}
                disabled={!isPlaying}
              />
            )}
            <CapturedPieces moves={gameData.gameState.moveHistory} />
          </div>

          {/* Chess board */}
          <div className="flex justify-center">
            <ChessBoard
              gameState={gameData.gameState}
              playerColor={playerColor || 'white'}
              onMove={makeMove}
              disabled={isGameOver || isSpectator || gameData.gameState.currentTurn !== playerColor}
              lastMove={lastMove}
            />
          </div>

          {/* Right sidebar */}
          <div className="w-full lg:w-64 space-y-4">
            <MoveHistory moves={gameData.gameState.moveHistory} />
            <GameChat
              messages={messages}
              onSendMessage={sendMessage}
              playerColor={playerColor || 'white'}
              disabled={!playerColor || isSpectator}
            />
          </div>
        </div>
      </div>

      <GameOverDialog
        isOpen={isGameOver}
        winner={gameData.winner}
        winnerName={gameData.winner === 'white' ? gameData.whitePlayerName : gameData.blackPlayerName || ''}
        isDraw={gameData.status === 'stalemate' || gameData.status === 'draw'}
        reason={getGameOverReason()}
        onRematch={() => {}}
        onNewGame={() => navigate('/')}
      />
    </div>
  );
}