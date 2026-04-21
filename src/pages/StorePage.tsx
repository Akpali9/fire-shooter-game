import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { ParticleBackground } from '../components/ParticleBackground';
import { FireShooterLogo } from '../components/FireShooterLogo';
import { ShoppingCart, Zap, Shield, Eye, Bomb, Heart, Rocket, Crosshair, Skull } from 'lucide-react';
import toast from 'react-hot-toast';

const skills = [
  { name: 'Rapid Fire', price: 200, icon: Zap, description: 'Faster shooting rate', effect: 'shootCooldown -50%' },
  { name: 'Armor', price: 150, icon: Shield, description: '+15 armor', effect: 'Damage reduction' },
  { name: 'Stealth', price: 300, icon: Eye, description: 'Reduced enemy detection', effect: 'Stealth mode' },
  { name: 'Grenades', price: 250, icon: Bomb, description: '3 explosive grenades', effect: 'Area damage' },
  { name: 'Medkit', price: 100, icon: Heart, description: '+50 health', effect: 'Instant heal' },
  { name: 'Jetpack', price: 400, icon: Rocket, description: 'Speed boost on shift', effect: 'Double speed' },
  { name: 'Sniper', price: 350, icon: Crosshair, description: 'High damage shots', effect: '+25 damage' },
  { name: 'Berserker', price: 500, icon: Skull, description: 'Increased damage & speed', effect: '+15 dmg, +1 speed' }
];

const coinPackages = [
  { coins: 100, price: 0.99, popular: false },
  { coins: 500, price: 4.99, popular: true },
  { coins: 1200, price: 9.99, popular: false },
  { coins: 3000, price: 19.99, popular: false }
];

export default function StorePage() {
  const { profile, updateCoins } = useAuthStore();
  const navigate = useNavigate();
  const [ownedSkills, setOwnedSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!profile) return;
    const fetchSkills = async () => {
      const { data } = await supabase.from('user_skills').select('skill_name').eq('user_id', profile.id);
      if (data) setOwnedSkills(data.map(s => s.skill_name));
    };
    fetchSkills();
  }, [profile]);

  const buySkill = async (skill: typeof skills[0]) => {
    if (ownedSkills.includes(skill.name)) return toast.error('Already owned');
    if ((profile?.coins || 0) < skill.price) return toast.error('Not enough coins');
    
    setLoading(true);
    try {
      await updateCoins(-skill.price);
      await supabase.from('user_skills').insert({ user_id: profile.id, skill_name: skill.name });
      setOwnedSkills([...ownedSkills, skill.name]);
      toast.success(`Purchased ${skill.name}!`);
    } catch (e) {
      toast.error('Purchase failed');
    } finally {
      setLoading(false);
    }
  };

  const buyCoins = async (pkg: typeof coinPackages[0]) => {
    // Stripe integration ready - for demo we just add coins
    toast.success(`Added ${pkg.coins} coins (demo)`);
    await updateCoins(pkg.coins);
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <ParticleBackground />
      <div className="relative z-10">
        <div className="flex justify-between items-center px-6 py-4 bg-black/50 backdrop-blur-md border-b border-fire-border">
          <FireShooterLogo />
          <div className="flex items-center gap-4">
            <span className="text-fire-accent font-bold">💰 {profile?.coins || 0}</span>
            <button onClick={() => navigate('/lobby')} className="px-4 py-2 border border-fire-border rounded-lg text-sm">BACK</button>
          </div>
        </div>
        
        <div className="max-w-6xl mx-auto p-6">
          <h1 className="text-3xl font-orbitron text-center mb-8">⚡ POWER UP ⚡</h1>
          
          {/* Coin Packages */}
          <div className="mb-12">
            <h2 className="text-xl font-orbitron mb-4 flex items-center gap-2"><ShoppingCart className="w-5 h-5 text-fire-accent" /> GET COINS</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {coinPackages.map((pkg, i) => (
                <button
                  key={i}
                  onClick={() => buyCoins(pkg)}
                  className="relative bg-fire-card rounded-xl p-4 text-center border border-fire-border hover:border-fire-accent transition"
                >
                  {pkg.popular && <span className="absolute -top-2 -right-2 bg-fire-accent text-xs px-2 py-0.5 rounded-full">POPULAR</span>}
                  <div className="text-2xl font-bold">{pkg.coins} coins</div>
                  <div className="text-gray-400">${pkg.price}</div>
                </button>
              ))}
            </div>
          </div>
          
          {/* Skills */}
          <h2 className="text-xl font-orbitron mb-4 flex items-center gap-2"><Zap className="w-5 h-5 text-fire-accent" /> UNLOCK SKILLS</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {skills.map((skill) => {
              const owned = ownedSkills.includes(skill.name);
              return (
                <div key={skill.name} className="bg-fire-card rounded-xl p-4 border border-fire-border">
                  <skill.icon className="w-10 h-10 text-fire-accent mb-2" />
                  <div className="font-bold text-lg">{skill.name}</div>
                  <div className="text-sm text-gray-400 mb-1">{skill.description}</div>
                  <div className="text-xs text-gray-500 mb-3">{skill.effect}</div>
                  <button
                    onClick={() => buySkill(skill)}
                    disabled={owned || loading}
                    className={`w-full py-2 rounded-lg text-sm font-bold transition ${owned ? 'bg-gray-700 cursor-not-allowed' : 'bg-fire-accent hover:bg-fire-accent/80'}`}
                  >
                    {owned ? 'OWNED' : `${skill.price} COINS`}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
