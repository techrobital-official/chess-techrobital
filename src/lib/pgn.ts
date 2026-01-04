import { Move, getMoveNotation } from './chess';

interface PGNOptions {
  event?: string;
  site?: string;
  date?: string;
  round?: string;
  white: string;
  black: string;
  result: string;
  timeControl?: string;
}

export function generatePGN(moves: Move[], options: PGNOptions): string {
  const headers: string[] = [];
  
  headers.push(`[Event "${options.event || 'Online Chess Game'}"]`);
  headers.push(`[Site "${options.site || 'Lovable Chess'}"]`);
  headers.push(`[Date "${options.date || new Date().toISOString().split('T')[0]}"]`);
  headers.push(`[Round "${options.round || '-'}"]`);
  headers.push(`[White "${options.white}"]`);
  headers.push(`[Black "${options.black}"]`);
  headers.push(`[Result "${options.result}"]`);
  
  if (options.timeControl) {
    headers.push(`[TimeControl "${options.timeControl}"]`);
  }
  
  // Generate move text
  const moveText: string[] = [];
  
  for (let i = 0; i < moves.length; i++) {
    const move = moves[i];
    const moveNumber = Math.floor(i / 2) + 1;
    const notation = getMoveNotation(move);
    
    if (i % 2 === 0) {
      // White's move
      moveText.push(`${moveNumber}. ${notation}`);
    } else {
      // Black's move
      moveText.push(notation);
    }
  }
  
  // Format moves into lines of ~80 characters
  let formattedMoves = '';
  let currentLine = '';
  
  for (const item of moveText) {
    if (currentLine.length + item.length + 1 > 80) {
      formattedMoves += currentLine.trim() + '\n';
      currentLine = item + ' ';
    } else {
      currentLine += item + ' ';
    }
  }
  
  if (currentLine.trim()) {
    formattedMoves += currentLine.trim();
  }
  
  // Add result at the end
  formattedMoves += ' ' + options.result;
  
  return headers.join('\n') + '\n\n' + formattedMoves;
}

export function downloadPGN(pgn: string, filename: string = 'game.pgn') {
  const blob = new Blob([pgn], { type: 'application/x-chess-pgn' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function getGameResult(status: string, winner?: string): string {
  if (status === 'checkmate' || status === 'resigned' || status === 'timeout') {
    return winner === 'white' ? '1-0' : '0-1';
  }
  if (status === 'stalemate' || status === 'draw') {
    return '1/2-1/2';
  }
  return '*'; // Game in progress
}
