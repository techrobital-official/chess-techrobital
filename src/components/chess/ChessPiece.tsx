import { Piece, PIECE_SYMBOLS } from '@/lib/chess';
import { cn } from '@/lib/utils';

interface ChessPieceProps {
  piece: Piece;
  className?: string;
}

export function ChessPiece({ piece, className }: ChessPieceProps) {
  return (
    <span
      className={cn(
        'text-4xl md:text-5xl lg:text-6xl select-none cursor-pointer transition-transform hover:scale-110',
        piece.color === 'white' ? 'piece-white' : 'piece-black',
        className
      )}
    >
      {PIECE_SYMBOLS[piece.color][piece.type]}
    </span>
  );
}