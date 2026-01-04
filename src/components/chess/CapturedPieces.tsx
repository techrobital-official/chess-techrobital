import { Move, PieceColor, PieceType, PIECE_SYMBOLS } from '@/lib/chess';
import { cn } from '@/lib/utils';

interface CapturedPiecesProps {
  moves: Move[];
  className?: string;
}

const PIECE_VALUES: Record<PieceType, number> = {
  pawn: 1,
  knight: 3,
  bishop: 3,
  rook: 5,
  queen: 9,
  king: 0,
};

export function CapturedPieces({ moves, className }: CapturedPiecesProps) {
  const capturedByWhite: PieceType[] = [];
  const capturedByBlack: PieceType[] = [];
  
  moves.forEach((move) => {
    if (move.captured) {
      if (move.piece.color === 'white') {
        capturedByWhite.push(move.captured.type);
      } else {
        capturedByBlack.push(move.captured.type);
      }
    }
  });
  
  // Sort by value
  const sortByValue = (a: PieceType, b: PieceType) => PIECE_VALUES[b] - PIECE_VALUES[a];
  capturedByWhite.sort(sortByValue);
  capturedByBlack.sort(sortByValue);
  
  // Calculate material advantage
  const whiteValue = capturedByWhite.reduce((sum, p) => sum + PIECE_VALUES[p], 0);
  const blackValue = capturedByBlack.reduce((sum, p) => sum + PIECE_VALUES[p], 0);
  const advantage = whiteValue - blackValue;
  
  const CapturedRow = ({ pieces, capturedBy }: { pieces: PieceType[]; capturedBy: PieceColor }) => {
    const capturedColor = capturedBy === 'white' ? 'black' : 'white';
    return (
      <div className="flex items-center gap-2">
        <span className={cn(
          'text-2xl',
          capturedBy === 'white' ? 'piece-white' : 'piece-black'
        )}>
          {capturedBy === 'white' ? '♔' : '♚'}
        </span>
        <div className="flex flex-wrap gap-0.5">
          {pieces.map((piece, i) => (
            <span
              key={i}
              className={cn(
                'text-xl',
                capturedColor === 'white' ? 'piece-white opacity-60' : 'piece-black opacity-60'
              )}
            >
              {PIECE_SYMBOLS[capturedColor][piece]}
            </span>
          ))}
          {pieces.length === 0 && (
            <span className="text-sm text-muted-foreground">No captures</span>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div className={cn('glass-panel p-4 space-y-3', className)}>
      <div className="flex items-center justify-between">
        <h3 className="font-serif font-semibold">Captured Pieces</h3>
        {advantage !== 0 && (
          <span className="text-sm text-muted-foreground">
            {advantage > 0 ? `+${advantage} White` : `+${Math.abs(advantage)} Black`}
          </span>
        )}
      </div>
      <CapturedRow pieces={capturedByWhite} capturedBy="white" />
      <CapturedRow pieces={capturedByBlack} capturedBy="black" />
    </div>
  );
}