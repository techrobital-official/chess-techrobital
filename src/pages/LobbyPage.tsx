import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { generateRoomCode, createInitialBoard, boardToJson } from '@/lib/chess';
import { useToast } from '@/hooks/use-toast';
import { Crown, Users, Loader2, Share2, Copy, Check, Clock, Eye } from 'lucide-react';

export default function LobbyPage() {
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [timerDuration, setTimerDuration] = useState<string>('none');
  const [createdRoomCode, setCreatedRoomCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const createGame = async () => {
    if (!playerName.trim()) {
      toast({ title: 'Please enter your name', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const code = generateRoomCode();
    const initialBoard = createInitialBoard();
    const timer = timerDuration !== 'none' ? parseInt(timerDuration) * 60 : null;
    
    const { error } = await supabase.from('games').insert({
      room_code: code,
      white_player_name: playerName.trim(),
      board_state: JSON.parse(boardToJson(initialBoard)),
      status: 'waiting',
      timer_duration: timer,
      white_time_remaining: timer,
      black_time_remaining: timer,
    });

    if (error) {
      toast({ title: 'Failed to create game', variant: 'destructive' });
      setLoading(false);
      return;
    }

    setCreatedRoomCode(code);
    sessionStorage.setItem('chess_player_name', playerName.trim());
    setLoading(false);
  };

  const copyRoomCode = async () => {
    if (!createdRoomCode) return;
    await navigator.clipboard.writeText(createdRoomCode);
    setCopied(true);
    toast({ title: 'Room code copied!' });
    setTimeout(() => setCopied(false), 2000);
  };

  const shareGame = async () => {
    if (!createdRoomCode) return;
    const shareUrl = `${window.location.origin}/game/${createdRoomCode}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Chess Game Invite',
          text: `Join my chess game! Room code: ${createdRoomCode}`,
          url: shareUrl,
        });
      } catch (e) {
        copyRoomCode();
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast({ title: 'Game link copied!' });
    }
  };

  const goToGame = () => {
    if (createdRoomCode) {
      navigate(`/game/${createdRoomCode}`);
    }
  };

  const joinGame = async () => {
    if (!playerName.trim() || !roomCode.trim()) {
      toast({ title: 'Please enter your name and room code', variant: 'destructive' });
      return;
    }
    setLoading(true);
    
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('room_code', roomCode.toUpperCase())
      .maybeSingle();

    if (error || !data) {
      toast({ title: 'Game not found', variant: 'destructive' });
      setLoading(false);
      return;
    }

    if (data.black_player_name) {
      toast({ title: 'Game is full', variant: 'destructive' });
      setLoading(false);
      return;
    }

    await supabase.from('games').update({
      black_player_name: playerName.trim(),
      status: 'playing',
    }).eq('id', data.id);

    sessionStorage.setItem('chess_player_name', playerName.trim());
    navigate(`/game/${roomCode.toUpperCase()}`);
  };

  const spectateGame = async () => {
    if (!roomCode.trim()) {
      toast({ title: 'Please enter a room code', variant: 'destructive' });
      return;
    }
    setLoading(true);

    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('room_code', roomCode.toUpperCase())
      .maybeSingle();

    if (error || !data) {
      toast({ title: 'Game not found', variant: 'destructive' });
      setLoading(false);
      return;
    }

    // Mark as spectator in session storage
    sessionStorage.setItem('chess_player_name', 'Spectator');
    sessionStorage.setItem('chess_spectator', 'true');
    navigate(`/game/${roomCode.toUpperCase()}`);
  };

  // Show created room UI
  if (createdRoomCode) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="w-full max-w-md animate-fade-in">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <span className="text-6xl">♔</span>
            </div>
            <h1 className="text-3xl font-serif font-bold mb-2">Game Created!</h1>
            <p className="text-muted-foreground">Share this code with your opponent</p>
          </div>

          <Card className="glass-panel">
            <CardContent className="pt-6 space-y-6">
              <div className="text-center">
                <div className="font-mono text-5xl font-bold tracking-widest mb-2">{createdRoomCode}</div>
                <p className="text-sm text-muted-foreground">Room Code</p>
              </div>

              <div className="flex gap-2">
                <Button onClick={copyRoomCode} variant="outline" className="flex-1">
                  {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                  {copied ? 'Copied!' : 'Copy Code'}
                </Button>
                <Button onClick={shareGame} variant="outline" className="flex-1">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>

              <Button onClick={goToGame} className="w-full" size="lg">
                Enter Game Room
              </Button>

              <Button onClick={() => setCreatedRoomCode(null)} variant="ghost" className="w-full">
                Create Another Game
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <span className="text-6xl">♔</span>
            <span className="text-6xl">♚</span>
          </div>
          <h1 className="text-4xl font-serif font-bold mb-2">Chess Online</h1>
          <p className="text-muted-foreground">Play chess with friends in real-time</p>
        </div>

        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="font-serif">Get Started</CardTitle>
            <CardDescription>Create a new game or join an existing one</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Input
                placeholder="Enter your name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="text-center text-lg"
                maxLength={20}
              />
            </div>

            <Tabs defaultValue="create" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="create"><Crown className="w-4 h-4 mr-1" />Create</TabsTrigger>
                <TabsTrigger value="join"><Users className="w-4 h-4 mr-1" />Join</TabsTrigger>
                <TabsTrigger value="spectate"><Eye className="w-4 h-4 mr-1" />Watch</TabsTrigger>
              </TabsList>
              <TabsContent value="create" className="mt-4 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Game Timer (optional)
                  </label>
                  <Select value={timerDuration} onValueChange={setTimerDuration}>
                    <SelectTrigger>
                      <SelectValue placeholder="No timer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No timer</SelectItem>
                      <SelectItem value="5">5 minutes</SelectItem>
                      <SelectItem value="10">10 minutes</SelectItem>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={createGame} disabled={loading} className="w-full" size="lg">
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Create Game
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  You'll play as White and get a room code to share
                </p>
              </TabsContent>
              <TabsContent value="join" className="mt-4 space-y-4">
                <Input
                  placeholder="Enter room code"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  className="text-center text-lg font-mono tracking-widest"
                  maxLength={6}
                />
                <Button onClick={joinGame} disabled={loading} className="w-full" size="lg">
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Join Game
                </Button>
              </TabsContent>
              <TabsContent value="spectate" className="mt-4 space-y-4">
                <Input
                  placeholder="Enter room code"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  className="text-center text-lg font-mono tracking-widest"
                  maxLength={6}
                />
                <Button onClick={spectateGame} disabled={loading} className="w-full" size="lg">
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Watch Game
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Watch a game as a spectator (no name required)
                </p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}