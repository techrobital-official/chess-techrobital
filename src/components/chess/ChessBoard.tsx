import { useState, useCallback, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import {
  GameState,
  Square,
  PieceColor,
  getLegalMoves,
  executeMove,
  findKing,
  PieceType,
} from '@/lib/chess';
import { ChessSquare } from './ChessSquare';
import { PromotionDialog } from './PromotionDialog';

interface ChessBoardProps {
  gameState: GameState;
  playerColor: PieceColor;
  onMove: (gameState: GameState, from: Square, to: Square, promotion?: PieceType) => void;
  disabled?: boolean;
  lastMove?: { from: Square; to: Square } | null;
}

export function ChessBoard({
  gameState,
  playerColor,
  onMove,
  disabled = false,
  lastMove,
}: ChessBoardProps) {
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<Square[]>([]);
  const [promotionMove, setPromotionMove] = useState<{ from: Square; to: Square } | null>(null);
  const [draggedSquare, setDraggedSquare] = useState<Square | null>(null);
  
  const isFlipped = playerColor === 'black';
  const isMyTurn = gameState.currentTurn === playerColor;
  
  // Find the king in check
  const kingInCheck = gameState.isCheck ? findKing(gameState.board, gameState.currentTurn) : null;
  
  // Reset selection when turn changes
  useEffect(() => {
    setSelectedSquare(null);
    setLegalMoves([]);
    setDraggedSquare(null);
  }, [gameState.currentTurn]);

  const tryMove = useCallback((from: Square, to: Square) => {
    const movingPiece = gameState.board[from.row][from.col];
    if (!movingPiece) return false;

    const moves = getLegalMoves(gameState, from);
    const isLegal = moves.some(m => m.row === to.row && m.col === to.col);
    
    if (!isLegal) return false;

    // Check for pawn promotion
    if (movingPiece.type === 'pawn') {
      const promotionRow = movingPiece.color === 'white' ? 0 : 7;
      if (to.row === promotionRow) {
        setPromotionMove({ from, to });
        return true;
      }
    }

    const newState = executeMove(gameState, from, to);
    onMove(newState, from, to);
    return true;
  }, [gameState, onMove]);
  
  const handleSquareClick = useCallback((square: Square) => {
    if (disabled || !isMyTurn) return;
    
    const piece = gameState.board[square.row][square.col];
    
    // If we have a selected piece and click on a legal move
    if (selectedSquare && legalMoves.some(m => m.row === square.row && m.col === square.col)) {
      tryMove(selectedSquare, square);
      setSelectedSquare(null);
      setLegalMoves([]);
      return;
    }
    
    // If clicking on own piece, select it
    if (piece && piece.color === playerColor) {
      setSelectedSquare(square);
      const moves = getLegalMoves(gameState, square);
      setLegalMoves(moves);
      return;
    }
    
    // Otherwise, deselect
    setSelectedSquare(null);
    setLegalMoves([]);
  }, [disabled, isMyTurn, selectedSquare, legalMoves, gameState, playerColor, tryMove]);

  const handleDragStart = useCallback((square: Square) => {
    if (disabled || !isMyTurn) return;
    const piece = gameState.board[square.row][square.col];
    if (piece && piece.color === playerColor) {
      setDraggedSquare(square);
      setSelectedSquare(square);
      const moves = getLegalMoves(gameState, square);
      setLegalMoves(moves);
    }
  }, [disabled, isMyTurn, gameState, playerColor]);

  const handleDragEnd = useCallback(() => {
    setDraggedSquare(null);
  }, []);

  const handleDrop = useCallback((square: Square) => {
    if (!draggedSquare) return;
    
    const isLegal = legalMoves.some(m => m.row === square.row && m.col === square.col);
    if (isLegal) {
      tryMove(draggedSquare, square);
    }
    
    setDraggedSquare(null);
    setSelectedSquare(null);
    setLegalMoves([]);
  }, [draggedSquare, legalMoves, tryMove]);
  
  const handlePromotion = useCallback((pieceType: PieceType) => {
    if (!promotionMove) return;
    
    const newState = executeMove(gameState, promotionMove.from, promotionMove.to, pieceType);
    onMove(newState, promotionMove.from, promotionMove.to, pieceType);
    setPromotionMove(null);
    setSelectedSquare(null);
    setLegalMoves([]);
  }, [promotionMove, gameState, onMove]);
  
  const renderBoard = () => {
    const squares = [];
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const actualRow = isFlipped ? 7 - row : row;
        const actualCol = isFlipped ? 7 - col : col;
        const isLight = (actualRow + actualCol) % 2 === 0;
        const piece = gameState.board[actualRow][actualCol];
        
        const isSelected = selectedSquare?.row === actualRow && selectedSquare?.col === actualCol;
        const isLegalMove = legalMoves.some(m => m.row === actualRow && m.col === actualCol);
        const isLastMoveSquare = lastMove && (
          (lastMove.from.row === actualRow && lastMove.from.col === actualCol) ||
          (lastMove.to.row === actualRow && lastMove.to.col === actualCol)
        );
        const isCheck = kingInCheck?.row === actualRow && kingInCheck?.col === actualCol;
        const isDragging = draggedSquare?.row === actualRow && draggedSquare?.col === actualCol;
        
        squares.push(
          <ChessSquare
            key={`${actualRow}-${actualCol}`}
            row={actualRow}
            col={actualCol}
            piece={piece}
            isLight={isLight}
            isSelected={isSelected}
            isLegalMove={isLegalMove}
            isLastMove={isLastMoveSquare || false}
            isCheck={isCheck}
            isDragging={isDragging}
            onClick={handleSquareClick}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDrop={handleDrop}
            canDrag={!disabled && isMyTurn && piece?.color === playerColor}
          />
        );
      }
    }
    return squares;
  };
  
  return (
    <>
      <div
        className={cn(
          'grid grid-cols-8 rounded-lg overflow-hidden shadow-2xl',
          'border-4 border-secondary',
          'w-[320px] h-[320px] sm:w-[400px] sm:h-[400px] md:w-[480px] md:h-[480px] lg:w-[560px] lg:h-[560px]',
          !isMyTurn && !disabled && 'opacity-90',
          disabled && 'opacity-60 pointer-events-none'
        )}
      >
        {renderBoard()}
      </div>
      
      <PromotionDialog
        isOpen={!!promotionMove}
        color={playerColor}
        onSelect={handlePromotion}
        onClose={() => setPromotionMove(null)}
      />
    </>
  );
}
