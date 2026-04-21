import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { ParticleBackground } from '../components/ParticleBackground';
import { FireShooterLogo } from '../components/FireShooterLogo';
import { ChatBox } from '../components/ChatBox';
import { Users, Trophy, Swords, DoorOpen, Plus, Target } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Lobby() {
  const { profile, signOut } = useAuthStore();
  const navigate = useNavigate();
  const [missions, setMissions] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [selectedMission, setSelectedMission] = useState('industrial');
  const [mode, setMode] = useState('solo');

  useEffect(() => {
    fetchMissions();
    fetchRooms();
    fetchLeaderboard();
    
    const roomsSubscription = supabase
      .channel('rooms-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, () => fetchRooms())
      .subscribe();
      
    return () => { supabase.removeChannel(roomsSubscription); };
  }, []);

  const fetchMissions = async () => {
    const { data } = await supabase.from('missions').select('*');
    if (data) setMissions(data);
  };

  const fetchRooms = async () => {
    const { data } = await supabase.from('rooms').select('*, host:profiles!host_id(username)').eq('status', 'waiting').order('created_at', { ascending: false });
    if (data) setRooms(data);
  };

  const fetchLeaderboard = async () => {
    const { data } = await supabase.from('profiles').select('username, kills, deaths, xp').order('kills', { ascending: false }).limit(10);
    if (data) setLeaderboard(data);
  };

  const createRoom = async () => {
    if (!roomName.trim()) return toast.error('Room name required');
    const { data, error } = await supabase.from('rooms').insert({
      name: roomName,
      mission_id: selectedMission,
      mode: mode,
      host_id: profile.id,
      max_players: mode === 'solo' ? 1 : 4,
      current_players: 1
    }).select().single();
    if (error) toast.error(error.message);
    else {
      await supabase.from('room_players').insert({ room_id: data.id, player_id: profile.id });
      navigate(`/game/${selectedMission}?room=${data.id}`);
    }
    setShowCreateRoom(false);
  };

  const joinRoom = async (roomId: string) => {
    const { error } = await supabase.from('room_players').insert({ room_id: roomId, player_id: profile.id });
    if (error) toast.error('Failed to join');
    else {
      const { data: room } = await supabase.from('rooms').select('mission_id').eq('id', roomId).single();
      navigate(`/game/${room?.mission_id}?room=${roomId}`);
    }
  };

  const playSolo = (missionId: string) => {
    navigate(`/game/${missionId}`);
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <ParticleBackground />
      <div className="relative z-10">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 bg-black/50 backdrop-blur-md border-b border-fire-border">
          <FireShooterLogo />
          <div className="flex items-center gap-4">
            <span className="text-fire-accent font-bold">💰 {profile?.coins || 0}</span>
            <button onClick={() => navigate('/store')} className="px-4 py-2 bg-fire-accent rounded-lg text-sm font-bold hover:bg-fire-accent/80 transition">
              STORE
            </button>
            <button onClick={signOut} className="px-4 py-2 border border-fire-border rounded-lg text-sm hover:bg-fire-accent/20 transition">
              LOGOUT
            </button>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto p-6 grid lg:grid-cols-3 gap-6">
          {/* Missions & Rooms */}
          <div className="lg:col-span-2 space-y-6">
            {/* Missions */}
            <div className="bg-fire-card/50 backdrop-blur-sm rounded-xl p-4 border border-fire-border">
              <h2 className="text-xl font-orbitron mb-4 flex items-center gap-2"><Target className="w-5 h-5 text-fire-accent" /> MISSIONS</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {missions.map((mission) => (
                  <button
                    key={mission.id}
                    onClick={() => playSolo(mission.id)}
                    className="bg-black/50 rounded-lg p-3 text-left hover:border-fire-accent border border-transparent transition group"
                  >
                    <div className="font-bold">{mission.name}</div>
                    <div className="text-xs text-gray-400">💰 {mission.reward_coins} XP</div>
                    <div className="text-xs text-fire-accent mt-2 opacity-0 group-hover:opacity-100 transition">▶ PLAY SOLO</div>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Rooms List */}
            <div className="bg-fire-card/50 backdrop-blur-sm rounded-xl p-4 border border-fire-border">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-orbitron flex items-center gap-2"><Users className="w-5 h-5 text-fire-accent" /> WAR ROOMS</h2>
                <button onClick={() => setShowCreateRoom(true)} className="px-3 py-1 bg-fire-accent rounded-lg text-sm flex items-center gap-1"><Plus className="w-4 h-4" /> Create</button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {rooms.map((room) => (
                  <div key={room.id} className="flex justify-between items-center bg-black/30 rounded-lg p-3">
                    <div>
                      <div className="font-bold">{room.name}</div>
                      <div className="text-xs text-gray-400">{room.mode} | {room.current_players}/{room.max_players}</div>
                    </div>
                    <button onClick={() => joinRoom(room.id)} className="px-4 py-1 bg-fire-accent rounded-lg text-sm">Join</button>
                  </div>
                ))}
                {rooms.length === 0 && <div className="text-center text-gray-500 py-8">No active rooms. Create one!</div>}
              </div>
            </div>
          </div>
          
          {/* Sidebar - Leaderboard & Chat */}
          <div className="space-y-6">
            <div className="bg-fire-card/50 backdrop-blur-sm rounded-xl p-4 border border-fire-border">
              <h2 className="text-xl font-orbitron mb-3 flex items-center gap-2"><Trophy className="w-5 h-5 text-yellow-500" /> GLOBAL RANKINGS</h2>
              <div className="space-y-2">
                {leaderboard.map((player, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <span className="flex items-center gap-2"><span className="text-yellow-500 w-5">#{idx+1}</span>{player.username}</span>
                    <span className="text-fire-accent">{player.kills} kills</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="h-96">
              <ChatBox type="global" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Create Room Modal */}
      {showCreateRoom && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-fire-card rounded-xl p-6 w-full max-w-md border border-fire-border">
            <h3 className="text-xl font-orbitron mb-4">Create War Room</h3>
            <input
              type="text"
              placeholder="Room Name"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="w-full bg-black/50 rounded-lg px-4 py-2 mb-3 border border-fire-border"
            />
            <select value={selectedMission} onChange={(e) => setSelectedMission(e.target.value)} className="w-full bg-black/50 rounded-lg px-4 py-2 mb-3 border border-fire-border">
              {missions.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <select value={mode} onChange={(e) => setMode(e.target.value)} className="w-full bg-black/50 rounded-lg px-4 py-2 mb-4 border border-fire-border">
              <option value="solo">Solo</option>
              <option value="coop">Co-op</option>
              <option value="competitive">Competitive</option>
            </select>
            <div className="flex gap-3">
              <button onClick={createRoom} className="flex-1 py-2 bg-fire-accent rounded-lg">Create</button>
              <button onClick={() => setShowCreateRoom(false)} className="flex-1 py-2 border border-fire-border rounded-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
