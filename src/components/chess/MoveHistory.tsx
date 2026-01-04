import { ScrollArea } from '@/components/ui/scroll-area';
import { Move, getMoveNotation } from '@/lib/chess';
import { cn } from '@/lib/utils';

interface MoveHistoryProps {
  moves: Move[];
  className?: string;
}

export function MoveHistory({ moves, className }: MoveHistoryProps) {
  // Group moves into pairs (white, black)
  const movePairs: { number: number; white?: Move; black?: Move }[] = [];
  
  for (let i = 0; i < moves.length; i += 2) {
    movePairs.push({
      number: Math.floor(i / 2) + 1,
      white: moves[i],
      black: moves[i + 1],
    });
  }
  
  return (
    <div className={cn('glass-panel', className)}>
      <div className="p-4 border-b border-border">
        <h3 className="font-serif font-semibold">Move History</h3>
      </div>
      <ScrollArea className="h-64">
        <div className="p-4 space-y-1">
          {movePairs.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">
              No moves yet
            </p>
          ) : (
            movePairs.map((pair) => (
              <div
                key={pair.number}
                className="flex items-center gap-2 text-sm font-mono"
              >
                <span className="w-8 text-muted-foreground">{pair.number}.</span>
                <span className="w-16">{pair.white ? getMoveNotation(pair.white) : ''}</span>
                <span className="w-16">{pair.black ? getMoveNotation(pair.black) : ''}</span>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}