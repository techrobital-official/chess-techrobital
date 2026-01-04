-- Create enum for game status
CREATE TYPE public.game_status AS ENUM ('waiting', 'playing', 'checkmate', 'stalemate', 'draw', 'resigned', 'timeout');

-- Create games table
CREATE TABLE public.games (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_code VARCHAR(6) NOT NULL UNIQUE,
  white_player_name VARCHAR(50) NOT NULL,
  black_player_name VARCHAR(50),
  board_state JSONB NOT NULL,
  current_turn VARCHAR(5) NOT NULL DEFAULT 'white' CHECK (current_turn IN ('white', 'black')),
  status game_status NOT NULL DEFAULT 'waiting',
  winner VARCHAR(5) CHECK (winner IN ('white', 'black')),
  white_time_remaining INTEGER,
  black_time_remaining INTEGER,
  timer_duration INTEGER,
  last_move_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create moves table for move history
CREATE TABLE public.moves (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  move_number INTEGER NOT NULL,
  player VARCHAR(5) NOT NULL CHECK (player IN ('white', 'black')),
  from_square VARCHAR(2) NOT NULL,
  to_square VARCHAR(2) NOT NULL,
  piece VARCHAR(10) NOT NULL,
  captured_piece VARCHAR(10),
  is_check BOOLEAN DEFAULT FALSE,
  is_checkmate BOOLEAN DEFAULT FALSE,
  notation VARCHAR(10) NOT NULL,
  board_state_after JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chat messages table
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  player_name VARCHAR(50) NOT NULL,
  player_color VARCHAR(5) NOT NULL CHECK (player_color IN ('white', 'black')),
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_games_room_code ON public.games(room_code);
CREATE INDEX idx_games_status ON public.games(status);
CREATE INDEX idx_moves_game_id ON public.moves(game_id);
CREATE INDEX idx_moves_move_number ON public.moves(game_id, move_number);
CREATE INDEX idx_chat_game_id ON public.chat_messages(game_id);

-- Enable RLS (but allow public access since no auth required for this game)
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for public access (no authentication required for chess game)
CREATE POLICY "Anyone can view games" ON public.games FOR SELECT USING (true);
CREATE POLICY "Anyone can create games" ON public.games FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update games" ON public.games FOR UPDATE USING (true);

CREATE POLICY "Anyone can view moves" ON public.moves FOR SELECT USING (true);
CREATE POLICY "Anyone can create moves" ON public.moves FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view chat" ON public.chat_messages FOR SELECT USING (true);
CREATE POLICY "Anyone can send chat" ON public.chat_messages FOR INSERT WITH CHECK (true);

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.games;
ALTER PUBLICATION supabase_realtime ADD TABLE public.moves;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for games table
CREATE TRIGGER update_games_updated_at
  BEFORE UPDATE ON public.games
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();