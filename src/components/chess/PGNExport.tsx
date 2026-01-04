import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { Move } from '@/lib/chess';
import { generatePGN, downloadPGN, getGameResult } from '@/lib/pgn';
import { useToast } from '@/hooks/use-toast';

interface PGNExportProps {
  moves: Move[];
  whitePlayer: string;
  blackPlayer: string;
  status: string;
  winner?: string;
  timerDuration?: number | null;
  roomCode: string;
}

export function PGNExport({
  moves,
  whitePlayer,
  blackPlayer,
  status,
  winner,
  timerDuration,
  roomCode,
}: PGNExportProps) {
  const { toast } = useToast();

  const handleExport = () => {
    if (moves.length === 0) {
      toast({ title: 'No moves to export', variant: 'destructive' });
      return;
    }

    const result = getGameResult(status, winner);
    const timeControl = timerDuration ? `${timerDuration}+0` : '-';

    const pgn = generatePGN(moves, {
      event: `Room ${roomCode}`,
      white: whitePlayer,
      black: blackPlayer,
      result,
      timeControl,
    });

    const filename = `chess_${roomCode}_${new Date().toISOString().split('T')[0]}.pgn`;
    downloadPGN(pgn, filename);
    toast({ title: 'PGN downloaded!' });
  };

  return (
    <Button 
      onClick={handleExport} 
      variant="outline" 
      size="sm" 
      className="gap-2"
      disabled={moves.length === 0}
    >
      <Download className="w-4 h-4" />
      Export PGN
    </Button>
  );
}
