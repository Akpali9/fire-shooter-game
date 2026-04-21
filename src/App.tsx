import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import LandingPage from './pages/LandingPage';
import Lobby from './pages/Lobby';
import GamePage from './pages/GamePage';
import StorePage from './pages/StorePage';
import AuthPage from './pages/AuthPage';
import { useEffect } from 'react';

function App() {
  const { user, loading, init } = useAuthStore();
  
  useEffect(() => { init(); }, []);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-fire-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ style: { background: '#111', color: '#fff', border: '1px solid #ff3300' } }} />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={!user ? <AuthPage /> : <Navigate to="/lobby" />} />
        <Route path="/lobby" element={user ? <Lobby /> : <Navigate to="/auth" />} />
        <Route path="/game/:missionId" element={user ? <GamePage /> : <Navigate to="/auth" />} />
        <Route path="/store" element={user ? <StorePage /> : <Navigate to="/auth" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
