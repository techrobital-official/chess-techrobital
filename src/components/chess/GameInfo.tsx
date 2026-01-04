import { cn } from '@/lib/utils';
import { PieceColor } from '@/lib/chess';
import { Crown, Clock, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface PlayerInfo {
  name: string;
  color: PieceColor;
  timeRemaining?: number | null;
}

interface GameInfoProps {
  whitePlayer: PlayerInfo;
  blackPlayer: PlayerInfo;
  currentTurn: PieceColor;
  playerColor: PieceColor;
  roomCode: string;
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  winner?: PieceColor;
  hasTimer?: boolean;
}

function formatTime(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function GameInfo({
  whitePlayer,
  blackPlayer,
  currentTurn,
  playerColor,
  roomCode,
  isCheck,
  isCheckmate,
  isStalemate,
  winner,
  hasTimer = false,
}: GameInfoProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  const copyRoomCode = async () => {
    await navigator.clipboard.writeText(roomCode);
    setCopied(true);
    toast({ title: 'Room code copied!' });
    setTimeout(() => setCopied(false), 2000);
  };
  
  const getGameStatus = () => {
    if (isCheckmate) return `Checkmate! ${winner === 'white' ? whitePlayer.name : blackPlayer.name} wins!`;
    if (isStalemate) return 'Stalemate! Game is a draw.';
    if (isCheck) return `${currentTurn === 'white' ? whitePlayer.name : blackPlayer.name} is in check!`;
    return `${currentTurn === 'white' ? whitePlayer.name : blackPlayer.name}'s turn`;
  };
  
  const PlayerCard = ({ player, isActive }: { player: PlayerInfo; isActive: boolean }) => {
    const isLowTime = player.timeRemaining !== null && player.timeRemaining !== undefined && player.timeRemaining < 60;
    
    return (
      <div
        className={cn(
          'glass-panel p-4 transition-all duration-300',
          isActive && 'glow-primary border-primary/50',
          player.color === playerColor && 'ring-2 ring-accent/50'
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center text-2xl',
              player.color === 'white' 
                ? 'bg-[hsl(35,20%,95%)] text-[hsl(220,15%,15%)]' 
                : 'bg-[hsl(220,15%,15%)] text-[hsl(35,20%,95%)]'
            )}
          >
            {player.color === 'white' ? '♔' : '♚'}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{player.name}</span>
              {player.color === playerColor && (
                <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">You</span>
              )}
            </div>
            <span className="text-sm text-muted-foreground capitalize">{player.color}</span>
          </div>
          {isActive && (
            <Crown className="w-5 h-5 text-accent animate-pulse" />
          )}
          {hasTimer && player.timeRemaining !== null && player.timeRemaining !== undefined && (
            <div className={cn(
              'flex items-center gap-1 text-sm font-mono px-2 py-1 rounded',
              isLowTime && isActive ? 'bg-destructive/20 text-destructive animate-pulse' : 'bg-secondary'
            )}>
              <Clock className="w-4 h-4" />
              {formatTime(player.timeRemaining)}
            </div>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div className="space-y-4 w-full max-w-xs">
      {/* Room Code */}
      <div className="glass-panel p-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground">Room Code</span>
            <div className="font-mono text-xl font-bold tracking-wider">{roomCode}</div>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={copyRoomCode}
            className="shrink-0"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
      </div>
      
      {/* Players */}
      <PlayerCard player={blackPlayer} isActive={currentTurn === 'black'} />
      <PlayerCard player={whitePlayer} isActive={currentTurn === 'white'} />
      
      {/* Game Status */}
      <div
        className={cn(
          'glass-panel p-4 text-center font-medium',
          isCheck && !isCheckmate && 'border-destructive/50 text-destructive',
          isCheckmate && 'border-accent/50 text-accent',
          isStalemate && 'border-muted-foreground/50'
        )}
      >
        {getGameStatus()}
      </div>
    </div>
  );
}