import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { FireShooterLogo } from '../components/FireShooterLogo';
import { ParticleBackground } from '../components/ParticleBackground';
import { LogIn, UserPlus, User } from 'lucide-react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn, signUp, guestLogin } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await signIn(email, password);
        toast.success('Welcome back!');
        navigate('/lobby');
      } else {
        if (!username) throw new Error('Username required');
        await signUp(email, password, username);
        toast.success('Account created! Please sign in.');
        setIsLogin(true);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    setLoading(true);
    try {
      await guestLogin();
      toast.success('Playing as Guest');
      navigate('/lobby');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <ParticleBackground />
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-fire-card/80 backdrop-blur-md rounded-2xl p-8 w-full max-w-md border border-fire-border"
        >
          <div className="flex justify-center mb-6">
            <FireShooterLogo className="w-16 h-16" />
          </div>
          <h2 className="text-2xl font-orbitron text-center mb-6">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-black/50 rounded-lg px-4 py-3 border border-fire-border focus:outline-none focus:border-fire-accent"
                required
              />
            )}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/50 rounded-lg px-4 py-3 border border-fire-border focus:outline-none focus:border-fire-accent"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/50 rounded-lg px-4 py-3 border border-fire-border focus:outline-none focus:border-fire-accent"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-fire-accent rounded-lg font-bold hover:bg-fire-accent/80 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLogin ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              {isLogin ? 'Sign In' : 'Sign Up'}
            </button>
          </form>
          
          <button
            onClick={handleGuest}
            disabled={loading}
            className="w-full mt-3 py-3 border border-fire-border rounded-lg font-bold hover:bg-fire-accent/20 transition flex items-center justify-center gap-2"
          >
            <User className="w-4 h-4" />
            Continue as Guest
          </button>
          
          <p className="text-center mt-6 text-gray-400">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => setIsLogin(!isLogin)} className="text-fire-accent hover:underline">
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
