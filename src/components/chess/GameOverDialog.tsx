import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trophy, RefreshCw, Home, Handshake, Flag, Clock } from 'lucide-react';
import { PieceColor } from '@/lib/chess';

interface GameOverDialogProps {
  isOpen: boolean;
  winner?: PieceColor;
  winnerName?: string;
  isDraw: boolean;
  reason?: 'resignation' | 'timeout' | 'agreement';
  onRematch: () => void;
  onNewGame: () => void;
  rematchRequested?: boolean;
  rematchPending?: boolean;
}

export function GameOverDialog({
  isOpen,
  winner,
  winnerName,
  isDraw,
  reason,
  onRematch,
  onNewGame,
  rematchRequested,
  rematchPending,
}: GameOverDialogProps) {
  const getTitle = () => {
    if (isDraw) return 'Draw!';
    if (reason === 'resignation') return 'Resignation';
    if (reason === 'timeout') return 'Time Out';
    return 'Checkmate!';
  };

  const getIcon = () => {
    if (isDraw) return <Handshake className="w-8 h-8 text-muted-foreground" />;
    if (reason === 'resignation') return <Flag className="w-8 h-8 text-destructive" />;
    if (reason === 'timeout') return <Clock className="w-8 h-8 text-destructive" />;
    return <Trophy className="w-8 h-8 text-accent" />;
  };

  const getDescription = () => {
    if (isDraw) {
      if (reason === 'agreement') return 'The game ended in a draw by mutual agreement.';
      return 'The game ended in a stalemate.';
    }
    if (reason === 'resignation') return `${winnerName} (${winner}) wins by resignation!`;
    if (reason === 'timeout') return `${winnerName} (${winner}) wins on time!`;
    return `${winnerName} (${winner}) wins the game!`;
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md text-center">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl flex items-center justify-center gap-2">
            {getIcon()}
            {getTitle()}
          </DialogTitle>
          <DialogDescription className="text-lg">
            {getDescription()}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-3 mt-6">
          <Button
            onClick={onRematch}
            disabled={rematchRequested}
            className="w-full"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {rematchRequested
              ? 'Waiting for opponent...'
              : rematchPending
              ? 'Accept Rematch'
              : 'Request Rematch'}
          </Button>
          <Button
            variant="outline"
            onClick={onNewGame}
            className="w-full"
          >
            <Home className="w-4 h-4 mr-2" />
            New Game
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}