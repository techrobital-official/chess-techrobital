import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PieceColor, PieceType, PIECE_SYMBOLS } from '@/lib/chess';
import { cn } from '@/lib/utils';

interface PromotionDialogProps {
  isOpen: boolean;
  color: PieceColor;
  onSelect: (piece: PieceType) => void;
  onClose: () => void;
}

const promotionPieces: PieceType[] = ['queen', 'rook', 'bishop', 'knight'];

export function PromotionDialog({ isOpen, color, onSelect, onClose }: PromotionDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center font-serif">Choose Promotion</DialogTitle>
        </DialogHeader>
        <div className="flex justify-center gap-4 py-4">
          {promotionPieces.map((piece) => (
            <button
              key={piece}
              onClick={() => onSelect(piece)}
              className={cn(
                'w-16 h-16 flex items-center justify-center rounded-lg',
                'bg-secondary hover:bg-secondary/80 transition-colors',
                'text-5xl cursor-pointer',
                color === 'white' ? 'piece-white' : 'piece-black'
              )}
            >
              {PIECE_SYMBOLS[color][piece]}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}