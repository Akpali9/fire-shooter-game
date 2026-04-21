-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  coins INT DEFAULT 500,
  xp INT DEFAULT 0,
  kills INT DEFAULT 0,
  deaths INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Missions table
CREATE TABLE missions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  map_type TEXT NOT NULL,
  difficulty INT DEFAULT 1,
  reward_coins INT DEFAULT 100,
  reward_xp INT DEFAULT 50
);

INSERT INTO missions (id, name, description, map_type, difficulty, reward_coins, reward_xp) VALUES
('industrial', 'Industrial Mayhem', 'Fight through the factory', 'industrial', 1, 100, 50),
('neon_city', 'Neon City', 'Urban combat under neon lights', 'neon_city', 2, 150, 75),
('nexus_hq', 'Nexus HQ', 'Storm the enemy headquarters', 'nexus_hq', 3, 200, 100),
('warzone', 'Warzone', 'Battlefield chaos', 'warzone', 4, 300, 150);

-- Rooms (multiplayer lobbies)
CREATE TABLE rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  mission_id TEXT REFERENCES missions(id),
  mode TEXT NOT NULL CHECK (mode IN ('solo', 'coop', 'competitive')),
  max_players INT DEFAULT 4,
  current_players INT DEFAULT 0,
  host_id UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Room players
CREATE TABLE room_players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  player_id UUID REFERENCES profiles(id),
  score INT DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT NOW()
);

-- Global chat messages
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  player_id UUID REFERENCES profiles(id),
  player_name TEXT,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'chat',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Game sessions (for stats)
CREATE TABLE game_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES rooms(id),
  player_id UUID REFERENCES profiles(id),
  mission_id TEXT REFERENCES missions(id),
  kills INT DEFAULT 0,
  score INT DEFAULT 0,
  duration INT DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchased skills
CREATE TABLE user_skills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  skill_name TEXT NOT NULL,
  purchased_at TIMESTAMPTZ DEFAULT NOW()
);

-- Coin transactions (for real rewards)
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  amount INT NOT NULL,
  type TEXT CHECK (type IN ('purchase', 'reward', 'refund')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Real-time stats view
CREATE OR REPLACE VIEW global_stats AS
SELECT
  (SELECT COUNT(*) FROM profiles) AS active_players,
  (SELECT COUNT(*) FROM game_sessions) AS total_matches,
  (SELECT COUNT(*) FROM missions) AS missions_count,
  COALESCE((SELECT SUM(amount) FROM transactions WHERE type = 'reward'), 0) AS epic_rewards;

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public profiles viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Rooms viewable by everyone" ON rooms FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create rooms" ON rooms FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Hosts can update rooms" ON rooms FOR UPDATE USING (host_id = auth.uid());

CREATE POLICY "Room players viewable by everyone" ON room_players FOR SELECT USING (true);
CREATE POLICY "Players can join rooms" ON room_players FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Messages viewable by everyone" ON messages FOR SELECT USING (true);
CREATE POLICY "Authenticated users can send messages" ON messages FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Game sessions viewable by owner" ON game_sessions FOR SELECT USING (player_id = auth.uid());
CREATE POLICY "Users can insert own game sessions" ON game_sessions FOR INSERT WITH CHECK (player_id = auth.uid());

CREATE POLICY "User skills viewable by owner" ON user_skills FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can buy skills" ON user_skills FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Transactions viewable by owner" ON transactions FOR SELECT USING (user_id = auth.uid());
