import { useState, useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PieceColor } from '@/lib/chess';

interface ChatMessage {
  id: string;
  playerName: string;
  playerColor: PieceColor;
  message: string;
  timestamp: Date;
}

interface GameChatProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  playerColor: PieceColor;
  disabled?: boolean;
  className?: string;
}

export function GameChat({
  messages,
  onSendMessage,
  playerColor,
  disabled = false,
  className,
}: GameChatProps) {
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && !disabled) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
    }
  };
  
  return (
    <div className={cn('glass-panel flex flex-col', className)}>
      <div className="p-4 border-b border-border">
        <h3 className="font-serif font-semibold">Chat</h3>
      </div>
      
      <ScrollArea className="flex-1 h-48" ref={scrollRef}>
        <div className="p-4 space-y-3">
          {messages.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">
              No messages yet
            </p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'flex flex-col',
                  msg.playerColor === playerColor && 'items-end'
                )}
              >
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <span
                    className={cn(
                      'text-sm',
                      msg.playerColor === 'white' ? 'piece-white' : 'piece-black'
                    )}
                  >
                    {msg.playerColor === 'white' ? '♔' : '♚'}
                  </span>
                  <span>{msg.playerName}</span>
                </div>
                <div
                  className={cn(
                    'px-3 py-2 rounded-lg max-w-[80%] text-sm',
                    msg.playerColor === playerColor
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground'
                  )}
                >
                  {msg.message}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
      
      <form onSubmit={handleSubmit} className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={disabled}
            className="flex-1"
          />
          <Button
            type="submit"
            size="icon"
            disabled={disabled || !newMessage.trim()}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}