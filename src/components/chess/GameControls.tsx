import { Button } from '@/components/ui/button';
import { Flag, Handshake, X, Check } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

interface GameControlsProps {
  onResign: () => void;
  onOfferDraw: () => void;
  onAcceptDraw: () => void;
  onDeclineDraw: () => void;
  drawOffered: boolean;
  drawPending: boolean;
  disabled?: boolean;
}

export function GameControls({
  onResign,
  onOfferDraw,
  onAcceptDraw,
  onDeclineDraw,
  drawOffered,
  drawPending,
  disabled = false,
}: GameControlsProps) {
  return (
    <div className="glass-panel p-4 space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">Game Controls</h3>
      
      {drawPending ? (
        <div className="space-y-2">
          <p className="text-sm text-center text-accent">Opponent offers a draw!</p>
          <div className="flex gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={onAcceptDraw}
              className="flex-1"
            >
              <Check className="w-4 h-4 mr-1" />
              Accept
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDeclineDraw}
              className="flex-1"
            >
              <X className="w-4 h-4 mr-1" />
              Decline
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onOfferDraw}
            disabled={disabled || drawOffered}
            className={cn("flex-1", drawOffered && "opacity-50")}
          >
            <Handshake className="w-4 h-4 mr-1" />
            {drawOffered ? 'Draw Offered' : 'Offer Draw'}
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                disabled={disabled}
                className="flex-1"
              >
                <Flag className="w-4 h-4 mr-1" />
                Resign
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Resign Game?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to resign? Your opponent will win the game.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onResign}>Resign</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
}
