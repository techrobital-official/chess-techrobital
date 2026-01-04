// Chess game logic utilities

export type PieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';
export type PieceColor = 'white' | 'black';

export interface Piece {
  type: PieceType;
  color: PieceColor;
}

export interface Square {
  row: number;
  col: number;
}

export type BoardState = (Piece | null)[][];

export interface Move {
  from: Square;
  to: Square;
  piece: Piece;
  captured?: Piece;
  isCheck?: boolean;
  isCheckmate?: boolean;
  isCastling?: 'kingside' | 'queenside';
  isEnPassant?: boolean;
  promotion?: PieceType;
}

export interface GameState {
  board: BoardState;
  currentTurn: PieceColor;
  moveHistory: Move[];
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  castlingRights: {
    white: { kingside: boolean; queenside: boolean };
    black: { kingside: boolean; queenside: boolean };
  };
  enPassantSquare: Square | null;
}

// Unicode chess pieces
export const PIECE_SYMBOLS: Record<PieceColor, Record<PieceType, string>> = {
  white: {
    king: '♔',
    queen: '♕',
    rook: '♖',
    bishop: '♗',
    knight: '♘',
    pawn: '♙',
  },
  black: {
    king: '♚',
    queen: '♛',
    rook: '♜',
    bishop: '♝',
    knight: '♞',
    pawn: '♟',
  },
};

// Initial board setup
export function createInitialBoard(): BoardState {
  const board: BoardState = Array(8).fill(null).map(() => Array(8).fill(null));
  
  // Set up pawns
  for (let col = 0; col < 8; col++) {
    board[1][col] = { type: 'pawn', color: 'black' };
    board[6][col] = { type: 'pawn', color: 'white' };
  }
  
  // Set up back rows
  const backRow: PieceType[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
  for (let col = 0; col < 8; col++) {
    board[0][col] = { type: backRow[col], color: 'black' };
    board[7][col] = { type: backRow[col], color: 'white' };
  }
  
  return board;
}

export function createInitialGameState(): GameState {
  return {
    board: createInitialBoard(),
    currentTurn: 'white',
    moveHistory: [],
    isCheck: false,
    isCheckmate: false,
    isStalemate: false,
    castlingRights: {
      white: { kingside: true, queenside: true },
      black: { kingside: true, queenside: true },
    },
    enPassantSquare: null,
  };
}

// Convert square to algebraic notation
export function squareToNotation(square: Square): string {
  const files = 'abcdefgh';
  return files[square.col] + (8 - square.row);
}

// Convert algebraic notation to square
export function notationToSquare(notation: string): Square {
  const files = 'abcdefgh';
  return {
    col: files.indexOf(notation[0]),
    row: 8 - parseInt(notation[1]),
  };
}

// Get piece at square
export function getPieceAt(board: BoardState, square: Square): Piece | null {
  if (!isValidSquare(square)) return null;
  return board[square.row][square.col];
}

// Check if square is on the board
export function isValidSquare(square: Square): boolean {
  return square.row >= 0 && square.row < 8 && square.col >= 0 && square.col < 8;
}

// Find king position
export function findKing(board: BoardState, color: PieceColor): Square | null {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece?.type === 'king' && piece.color === color) {
        return { row, col };
      }
    }
  }
  return null;
}

// Check if a square is attacked by the opponent
export function isSquareAttacked(board: BoardState, square: Square, byColor: PieceColor): boolean {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === byColor) {
        const moves = getRawMoves(board, { row, col }, piece, null);
        if (moves.some(m => m.row === square.row && m.col === square.col)) {
          return true;
        }
      }
    }
  }
  return false;
}

// Get raw moves without checking for check (to avoid infinite recursion)
export function getRawMoves(board: BoardState, from: Square, piece: Piece, enPassantSquare: Square | null): Square[] {
  const moves: Square[] = [];
  const { row, col } = from;
  
  switch (piece.type) {
    case 'pawn': {
      const direction = piece.color === 'white' ? -1 : 1;
      const startRow = piece.color === 'white' ? 6 : 1;
      
      // Forward move
      const forwardOne = { row: row + direction, col };
      if (isValidSquare(forwardOne) && !getPieceAt(board, forwardOne)) {
        moves.push(forwardOne);
        
        // Double move from start
        if (row === startRow) {
          const forwardTwo = { row: row + 2 * direction, col };
          if (!getPieceAt(board, forwardTwo)) {
            moves.push(forwardTwo);
          }
        }
      }
      
      // Captures
      for (const dc of [-1, 1]) {
        const capture = { row: row + direction, col: col + dc };
        if (isValidSquare(capture)) {
          const target = getPieceAt(board, capture);
          if (target && target.color !== piece.color) {
            moves.push(capture);
          }
          // En passant
          if (enPassantSquare && capture.row === enPassantSquare.row && capture.col === enPassantSquare.col) {
            moves.push(capture);
          }
        }
      }
      break;
    }
    
    case 'knight': {
      const offsets = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1]
      ];
      for (const [dr, dc] of offsets) {
        const to = { row: row + dr, col: col + dc };
        if (isValidSquare(to)) {
          const target = getPieceAt(board, to);
          if (!target || target.color !== piece.color) {
            moves.push(to);
          }
        }
      }
      break;
    }
    
    case 'bishop': {
      const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
      for (const [dr, dc] of directions) {
        for (let i = 1; i < 8; i++) {
          const to = { row: row + dr * i, col: col + dc * i };
          if (!isValidSquare(to)) break;
          const target = getPieceAt(board, to);
          if (!target) {
            moves.push(to);
          } else {
            if (target.color !== piece.color) moves.push(to);
            break;
          }
        }
      }
      break;
    }
    
    case 'rook': {
      const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      for (const [dr, dc] of directions) {
        for (let i = 1; i < 8; i++) {
          const to = { row: row + dr * i, col: col + dc * i };
          if (!isValidSquare(to)) break;
          const target = getPieceAt(board, to);
          if (!target) {
            moves.push(to);
          } else {
            if (target.color !== piece.color) moves.push(to);
            break;
          }
        }
      }
      break;
    }
    
    case 'queen': {
      const directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1], [0, 1],
        [1, -1], [1, 0], [1, 1]
      ];
      for (const [dr, dc] of directions) {
        for (let i = 1; i < 8; i++) {
          const to = { row: row + dr * i, col: col + dc * i };
          if (!isValidSquare(to)) break;
          const target = getPieceAt(board, to);
          if (!target) {
            moves.push(to);
          } else {
            if (target.color !== piece.color) moves.push(to);
            break;
          }
        }
      }
      break;
    }
    
    case 'king': {
      const directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1], [0, 1],
        [1, -1], [1, 0], [1, 1]
      ];
      for (const [dr, dc] of directions) {
        const to = { row: row + dr, col: col + dc };
        if (isValidSquare(to)) {
          const target = getPieceAt(board, to);
          if (!target || target.color !== piece.color) {
            moves.push(to);
          }
        }
      }
      break;
    }
  }
  
  return moves;
}

// Check if current player is in check
export function isInCheck(board: BoardState, color: PieceColor): boolean {
  const kingPos = findKing(board, color);
  if (!kingPos) return false;
  const opponentColor = color === 'white' ? 'black' : 'white';
  return isSquareAttacked(board, kingPos, opponentColor);
}

// Make a move on the board (returns new board)
export function makeMove(board: BoardState, from: Square, to: Square): BoardState {
  const newBoard = board.map(row => [...row]);
  const piece = newBoard[from.row][from.col];
  newBoard[to.row][to.col] = piece;
  newBoard[from.row][from.col] = null;
  return newBoard;
}

// Get all legal moves for a piece
export function getLegalMoves(gameState: GameState, from: Square): Square[] {
  const piece = getPieceAt(gameState.board, from);
  if (!piece || piece.color !== gameState.currentTurn) return [];
  
  const rawMoves = getRawMoves(gameState.board, from, piece, gameState.enPassantSquare);
  const legalMoves: Square[] = [];
  
  for (const to of rawMoves) {
    // Make the move on a copy of the board
    const newBoard = makeMove(gameState.board, from, to);
    
    // Handle en passant capture
    if (piece.type === 'pawn' && gameState.enPassantSquare && 
        to.row === gameState.enPassantSquare.row && to.col === gameState.enPassantSquare.col) {
      const captureRow = piece.color === 'white' ? to.row + 1 : to.row - 1;
      newBoard[captureRow][to.col] = null;
    }
    
    // Check if move leaves king in check
    if (!isInCheck(newBoard, piece.color)) {
      legalMoves.push(to);
    }
  }
  
  // Add castling moves
  if (piece.type === 'king' && !isInCheck(gameState.board, piece.color)) {
    const row = piece.color === 'white' ? 7 : 0;
    const rights = gameState.castlingRights[piece.color];
    
    // Kingside castling
    if (rights.kingside) {
      const rookPos = { row, col: 7 };
      const rook = getPieceAt(gameState.board, rookPos);
      if (rook?.type === 'rook' && rook.color === piece.color) {
        const throughSquares = [{ row, col: 5 }, { row, col: 6 }];
        const canCastle = throughSquares.every(sq => 
          !getPieceAt(gameState.board, sq) && 
          !isSquareAttacked(gameState.board, sq, piece.color === 'white' ? 'black' : 'white')
        );
        if (canCastle) {
          legalMoves.push({ row, col: 6 });
        }
      }
    }
    
    // Queenside castling
    if (rights.queenside) {
      const rookPos = { row, col: 0 };
      const rook = getPieceAt(gameState.board, rookPos);
      if (rook?.type === 'rook' && rook.color === piece.color) {
        const throughSquares = [{ row, col: 1 }, { row, col: 2 }, { row, col: 3 }];
        const emptySquares = throughSquares.every(sq => !getPieceAt(gameState.board, sq));
        const safeSquares = [{ row, col: 2 }, { row, col: 3 }].every(sq => 
          !isSquareAttacked(gameState.board, sq, piece.color === 'white' ? 'black' : 'white')
        );
        if (emptySquares && safeSquares) {
          legalMoves.push({ row, col: 2 });
        }
      }
    }
  }
  
  return legalMoves;
}

// Check if player has any legal moves
export function hasLegalMoves(gameState: GameState, color: PieceColor): boolean {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = gameState.board[row][col];
      if (piece && piece.color === color) {
        const tempState = { ...gameState, currentTurn: color };
        const moves = getLegalMoves(tempState, { row, col });
        if (moves.length > 0) return true;
      }
    }
  }
  return false;
}

// Execute a move and update game state
export function executeMove(gameState: GameState, from: Square, to: Square, promotion?: PieceType): GameState {
  const piece = getPieceAt(gameState.board, from);
  if (!piece) return gameState;
  
  const newBoard = gameState.board.map(row => [...row]);
  const captured = getPieceAt(newBoard, to);
  
  // Handle en passant capture
  let isEnPassant = false;
  if (piece.type === 'pawn' && gameState.enPassantSquare && 
      to.row === gameState.enPassantSquare.row && to.col === gameState.enPassantSquare.col) {
    isEnPassant = true;
    const captureRow = piece.color === 'white' ? to.row + 1 : to.row - 1;
    newBoard[captureRow][to.col] = null;
  }
  
  // Handle castling
  let isCastling: 'kingside' | 'queenside' | undefined;
  if (piece.type === 'king' && Math.abs(to.col - from.col) === 2) {
    if (to.col === 6) {
      // Kingside
      isCastling = 'kingside';
      newBoard[from.row][5] = newBoard[from.row][7];
      newBoard[from.row][7] = null;
    } else if (to.col === 2) {
      // Queenside
      isCastling = 'queenside';
      newBoard[from.row][3] = newBoard[from.row][0];
      newBoard[from.row][0] = null;
    }
  }
  
  // Handle pawn promotion
  let finalPiece = piece;
  if (piece.type === 'pawn') {
    const promotionRow = piece.color === 'white' ? 0 : 7;
    if (to.row === promotionRow) {
      finalPiece = { type: promotion || 'queen', color: piece.color };
    }
  }
  
  // Make the move
  newBoard[to.row][to.col] = finalPiece;
  newBoard[from.row][from.col] = null;
  
  // Update castling rights
  const newCastlingRights = JSON.parse(JSON.stringify(gameState.castlingRights));
  if (piece.type === 'king') {
    newCastlingRights[piece.color] = { kingside: false, queenside: false };
  }
  if (piece.type === 'rook') {
    if (from.col === 0) newCastlingRights[piece.color].queenside = false;
    if (from.col === 7) newCastlingRights[piece.color].kingside = false;
  }
  
  // Update en passant square
  let newEnPassantSquare: Square | null = null;
  if (piece.type === 'pawn' && Math.abs(to.row - from.row) === 2) {
    newEnPassantSquare = { row: (from.row + to.row) / 2, col: from.col };
  }
  
  const nextTurn = piece.color === 'white' ? 'black' : 'white';
  const inCheck = isInCheck(newBoard, nextTurn);
  
  const newState: GameState = {
    board: newBoard,
    currentTurn: nextTurn,
    moveHistory: [...gameState.moveHistory, {
      from,
      to,
      piece,
      captured: captured || undefined,
      isCheck: inCheck,
      isCastling,
      isEnPassant,
      promotion: promotion,
    }],
    isCheck: inCheck,
    isCheckmate: false,
    isStalemate: false,
    castlingRights: newCastlingRights,
    enPassantSquare: newEnPassantSquare,
  };
  
  // Check for checkmate or stalemate
  if (!hasLegalMoves(newState, nextTurn)) {
    if (inCheck) {
      newState.isCheckmate = true;
      // Update the last move to indicate checkmate
      newState.moveHistory[newState.moveHistory.length - 1].isCheckmate = true;
    } else {
      newState.isStalemate = true;
    }
  }
  
  return newState;
}

// Generate move notation
export function getMoveNotation(move: Move): string {
  const pieceSymbols: Record<PieceType, string> = {
    king: 'K',
    queen: 'Q',
    rook: 'R',
    bishop: 'B',
    knight: 'N',
    pawn: '',
  };
  
  if (move.isCastling === 'kingside') return 'O-O';
  if (move.isCastling === 'queenside') return 'O-O-O';
  
  let notation = pieceSymbols[move.piece.type];
  
  if (move.captured) {
    if (move.piece.type === 'pawn') {
      notation += squareToNotation(move.from)[0];
    }
    notation += 'x';
  }
  
  notation += squareToNotation(move.to);
  
  if (move.promotion) {
    notation += '=' + pieceSymbols[move.promotion];
  }
  
  if (move.isCheckmate) {
    notation += '#';
  } else if (move.isCheck) {
    notation += '+';
  }
  
  return notation;
}

// Board state to JSON (for database)
export function boardToJson(board: BoardState): string {
  return JSON.stringify(board);
}

// JSON to board state
export function jsonToBoard(json: string): BoardState {
  return JSON.parse(json);
}

// Generate a random room code
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}