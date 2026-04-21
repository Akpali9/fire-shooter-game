import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Send } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface ChatBoxProps {
  roomId?: string;
  type: 'global' | 'team';
}

export const ChatBox = ({ roomId, type }: ChatBoxProps) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const { profile } = useAuthStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const channel = supabase
      .channel(type === 'global' ? 'global-chat' : `room-${roomId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: type === 'global' ? undefined : `room_id=eq.${roomId}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
      })
      .subscribe();
      
    // Load existing messages
    const loadMessages = async () => {
      let query = supabase.from('messages').select('*').order('created_at', { ascending: true }).limit(50);
      if (type === 'global') {
        query = query.is('room_id', null);
      } else if (roomId) {
        query = query.eq('room_id', roomId);
      }
      const { data } = await query;
      if (data) setMessages(data);
    };
    loadMessages();
    
    return () => { supabase.removeChannel(channel); };
  }, [roomId, type]);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const sendMessage = async () => {
    if (!input.trim() || !profile) return;
    await supabase.from('messages').insert({
      room_id: type === 'global' ? null : roomId,
      player_id: profile.id,
      player_name: profile.username,
      content: input,
      type: type
    });
    setInput('');
  };
  
  return (
    <div className="flex flex-col h-full bg-fire-card/50 backdrop-blur-sm rounded-xl border border-fire-border">
      <div className="p-3 border-b border-fire-border font-orbitron text-sm">
        {type === 'global' ? '🌍 GLOBAL CHAT' : '🎮 TEAM CHAT'}
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map((msg) => (
          <div key={msg.id} className="text-sm">
            <span className="text-fire-accent font-bold">{msg.player_name}: </span>
            <span className="text-gray-300">{msg.content}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-3 border-t border-fire-border flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
          className="flex-1 bg-black/50 rounded-lg px-3 py-2 text-sm border border-fire-border focus:outline-none focus:border-fire-accent"
        />
        <button onClick={sendMessage} className="p-2 bg-fire-accent rounded-lg hover:bg-fire-accent/80 transition">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
