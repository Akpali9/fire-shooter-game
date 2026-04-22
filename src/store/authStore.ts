import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  profile: any | null;
  loading: boolean;
  init: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  guestLogin: () => Promise<void>;
  updateCoins: (amount: number) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  init: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      set({ user, profile, loading: false });
    } else {
      set({ loading: false });
    }
    supabase.auth.onAuthStateChange(async (_, session) => {
      if (session?.user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        set({ user: session.user, profile });
      } else {
        set({ user: null, profile: null });
      }
    });
  },
  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  },
  signUp: async (email, password, username) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    if (data.user) {
      await supabase.from('profiles').insert([{ id: data.user.id, username, coins: 500, xp: 0, kills: 0, deaths: 0 }]);
    }
  },
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null });
  },
  guestLogin: async () => {
    const guestEmail = `guest_${Date.now()}@fire-shooter.com`;
    const guestPass = 'guest123456';
    const { error } = await supabase.auth.signUp({ email: guestEmail, password: guestPass });
    if (!error) {
      await supabase.auth.signInWithPassword({ email: guestEmail, password: guestPass });
    } else {
      await supabase.auth.signInWithPassword({ email: guestEmail, password: guestPass });
    }
  },
  updateCoins: async (amount: number) => {
    const { profile } = get();
    if (!profile) return;
    const newCoins = profile.coins + amount;
    await supabase.from('profiles').update({ coins: newCoins }).eq('id', profile.id);
    set({ profile: { ...profile, coins: newCoins } });
  }
}));
