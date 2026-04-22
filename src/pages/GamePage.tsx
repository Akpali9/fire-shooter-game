import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { GameEngine } from '../game/GameEngine';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { ChatBox } from '../components/ChatBox';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function GamePage() {
  const { missionId } = useParams();
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get('room');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [game, setGame] = useState<GameEngine | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { profile } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!canvasRef.current || !missionId) return;
    
    const onGameEnd = async (res: any) => {
      setResult(res);
      setShowResults(true);
      
      await supabase.from('game_sessions').insert({
        player_id: profile.id,
        mission_id: missionId,
        kills: res.kills,
        score: res.score,
        duration: 120,
        completed: res.victory,
        room_id: roomId || null
      });
      
      const { data: profileData } = await supabase.from('profiles').select('kills, deaths, xp, coins').eq('id', profile.id).single();
      const newKills = (profileData?.kills || 0) + res.kills;
      const newDeaths = (profileData?.deaths || 0) + (res.victory ? 0 : 1);
      const newXP = (profileData?.xp || 0) + res.score;
      const newCoins = (profileData?.coins || 0) + Math.floor(res.score / 2);
      await supabase.from('profiles').update({ kills: newKills, deaths: newDeaths, xp: newXP, coins: newCoins }).eq('id', profile.id);
      
      toast.success(res.victory ? `Victory! +${res.score} XP` : `Defeat! +${Math.floor(res.score/2)} coins`);
    };
    
    const engine = new GameEngine(canvasRef.current, missionId, onGameEnd);
    engine.start();
    setGame(engine);
    
    return () => { engine.stop(); };
  }, [missionId, roomId]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ cursor: 'none' }} />
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <button onClick={() => navigate('/lobby')} className="bg-black/50 backdrop-blur-md p-2 rounded-lg border border-fire-border">
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>
      {roomId && (
        <div className="absolute bottom-4 left-4 w-80 h-96 z-10">
          <ChatBox roomId={roomId} type="team" />
        </div>
      )}
      {showResults && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-20">
          <div className="bg-fire-card rounded-xl p-8 text-center max-w-md border border-fire-border">
            <h2 className="text-3xl font-orbitron mb-4">{result.victory ? 'VICTORY!' : 'DEFEAT'}</h2>
            <div className="space-y-2 mb-6">
              <p>Kills: {result.kills}</p>
              <p>Score: {result.score}</p>
              <p>Reward: {Math.floor(result.score/2)} Coins</p>
            </div>
            <button onClick={() => navigate('/lobby')} className="px-6 py-2 bg-fire-accent rounded-lg">Return to Lobby</button>
          </div>
        </div>
      )}
    </div>
  );
}
