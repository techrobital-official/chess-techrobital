import { cn } from '@/lib/utils';
import { Piece, Square } from '@/lib/chess';
import { ChessPiece } from './ChessPiece';
import { useCallback } from 'react';

interface ChessSquareProps {
  row: number;
  col: number;
  piece: Piece | null;
  isLight: boolean;
  isSelected: boolean;
  isLegalMove: boolean;
  isLastMove: boolean;
  isCheck: boolean;
  isDragging?: boolean;
  canDrag?: boolean;
  onClick: (square: Square) => void;
  onDragStart?: (square: Square) => void;
  onDragEnd?: () => void;
  onDrop?: (square: Square) => void;
}

export function ChessSquare({
  row,
  col,
  piece,
  isLight,
  isSelected,
  isLegalMove,
  isLastMove,
  isCheck,
  isDragging = false,
  canDrag = false,
  onClick,
  onDragStart,
  onDragEnd,
  onDrop,
}: ChessSquareProps) {
  const baseClasses = isLight ? 'chess-square-light' : 'chess-square-dark';

  const handleDragStart = useCallback((e: React.DragEvent) => {
    if (!canDrag || !piece) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `${row},${col}`);
    onDragStart?.({ row, col });
  }, [canDrag, piece, row, col, onDragStart]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    onDrop?.({ row, col });
  }, [row, col, onDrop]);

  const handleDragEnd = useCallback(() => {
    onDragEnd?.();
  }, [onDragEnd]);
  
  return (
    <div
      className={cn(
        'w-full h-full flex items-center justify-center relative cursor-pointer transition-all duration-150',
        baseClasses,
        isSelected && 'chess-square-selected',
        isLastMove && !isSelected && 'chess-square-last-move',
        isCheck && 'chess-square-check',
        isDragging && 'opacity-50',
      )}
      onClick={() => onClick({ row, col })}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Legal move indicator */}
      {isLegalMove && (
        <div
          className={cn(
            'absolute rounded-full transition-all z-10',
            piece 
              ? 'w-full h-full border-4 border-primary/60' 
              : 'w-1/3 h-1/3 bg-primary/40'
          )}
        />
      )}
      
      {/* Chess piece */}
      {piece && (
        <div
          draggable={canDrag}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          className={cn(
            'w-full h-full flex items-center justify-center',
            canDrag && 'cursor-grab active:cursor-grabbing'
          )}
        >
          <ChessPiece piece={piece} />
        </div>
      )}
      
      {/* Coordinate labels */}
      {col === 0 && (
        <span className="absolute left-0.5 top-0.5 text-[10px] font-medium text-foreground/60 pointer-events-none">
          {8 - row}
        </span>
      )}
      {row === 7 && (
        <span className="absolute right-0.5 bottom-0.5 text-[10px] font-medium text-foreground/60 pointer-events-none">
          {String.fromCharCode(97 + col)}
        </span>
      )}
    </div>
  );
}