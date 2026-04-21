import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Flame, Users, Trophy, Target, Zap, ChevronRight } from 'lucide-react';
import { ParticleBackground } from '../components/ParticleBackground';
import { FireShooterLogo } from '../components/FireShooterLogo';
import { supabase } from '../lib/supabase';

export default function LandingPage() {
  const [stats, setStats] = useState({ activePlayers: 0, totalMatches: 0, missions: 0, epicRewards: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data, error } = await supabase.from('global_stats').select('*').single();
        if (!error && data) {
          setStats({
            activePlayers: data.active_players || 0,
            totalMatches: data.total_matches || 0,
            missions: data.missions_count || 0,
            epicRewards: data.epic_rewards || 0
          });
        } else {
          // Fallback mock data while DB populates
          setStats({ activePlayers: 1250000, totalMatches: 52000000, missions: 4, epicRewards: 10250000 });
        }
      } catch (e) {
        setStats({ activePlayers: 1250000, totalMatches: 52000000, missions: 4, epicRewards: 10250000 });
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, []);

  const statItems = [
    { label: 'Active Players', value: stats.activePlayers.toLocaleString(), icon: Users, suffix: '+' },
    { label: 'Total Matches', value: stats.totalMatches.toLocaleString(), icon: Trophy, suffix: '+' },
    { label: 'Missions', value: stats.missions.toString(), icon: Target, suffix: '' },
    { label: 'Epic Rewards', value: `$${(stats.epicRewards / 1_000_000).toFixed(1)}M`, icon: Zap, suffix: '+' }
  ];

  return (
    <div className="relative min-h-screen overflow-hidden">
      <ParticleBackground />
      
      {/* Navbar */}
      <nav className="relative z-20 flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
        <FireShooterLogo />
        <div className="hidden md:flex gap-8 text-gray-300">
          <a href="#features" className="hover:text-fire-accent transition">Features</a>
          <a href="#stats" className="hover:text-fire-accent transition">Stats</a>
          <Link to="/auth" className="hover:text-fire-accent transition">Play Now</Link>
        </div>
      </nav>
      
      {/* Hero */}
      <div className="relative z-10 min-h-[90vh] flex flex-col items-center justify-center text-center px-4">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, type: 'spring' }}
          className="mb-6"
        >
          <Flame className="w-28 h-28 text-fire-accent animate-glow" />
        </motion.div>
        
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-6xl md:text-8xl font-orbitron font-bold bg-gradient-fire bg-clip-text text-transparent"
        >
          FIRE SHOOTER
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-xl text-gray-300 mt-4 max-w-2xl"
        >
          The ultimate shooting experience. Compete, conquer, and become a legend.
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex gap-4 mt-8"
        >
          <Link to="/auth" className="px-8 py-3 bg-fire-accent hover:bg-fire-accent/80 rounded-lg font-bold transition-all transform hover:scale-105 flex items-center gap-2">
            PLAY NOW <ChevronRight className="w-4 h-4" />
          </Link>
          <a href="#features" className="px-8 py-3 border border-fire-accent hover:bg-fire-accent/20 rounded-lg font-bold transition-all">
            LEARN MORE
          </a>
        </motion.div>
      </div>
      
      {/* Stats Banner */}
      <div id="stats" className="relative z-10 bg-black/50 backdrop-blur-md py-12 border-y border-fire-border">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 px-4">
          {statItems.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <stat.icon className="w-8 h-8 mx-auto text-fire-accent mb-2" />
              <div className="text-3xl font-bold">{loadingStats ? '...' : stat.value}{stat.suffix}</div>
              <div className="text-gray-400">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Features */}
      <div id="features" className="relative z-10 max-w-6xl mx-auto py-20 px-4">
        <h2 className="text-4xl font-orbitron text-center mb-12">Why Play Fire Shooter?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { title: 'Intense Combat', desc: 'Fast-paced shooting with realistic mechanics and stunning visual effects', icon: Target },
            { title: 'Team Play', desc: 'Squad up with friends or compete globally in ranked matches', icon: Users },
            { title: 'Rewards System', desc: 'Earn coins, unlock powerful skills, and dominate the leaderboards', icon: Trophy }
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.2 }}
              className="bg-fire-card rounded-xl p-6 border border-fire-border hover:border-fire-accent transition-all group"
            >
              <feature.icon className="w-12 h-12 text-fire-accent mb-4 group-hover:scale-110 transition" />
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* CTA */}
      <div className="relative z-10 text-center py-20">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} className="inline-block">
          <Link to="/auth" className="px-12 py-4 bg-gradient-fire rounded-full font-bold text-lg transform hover:scale-105 transition-all inline-flex items-center gap-2 shadow-lg shadow-fire-accent/30">
            <Flame className="w-5 h-5" />
            START YOUR JOURNEY
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
