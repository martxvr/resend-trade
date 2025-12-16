import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface RoomData {
  name: string;
  instrument: string;
}

interface Stats {
  overallBias: 'bullish' | 'bearish' | 'neutral';
  bullish: number;
  bearish: number;
  neutral: number;
}

export default function Embed() {
  const { roomId } = useParams<{ roomId: string }>();
  const [room, setRoom] = useState<RoomData | null>(null);
  const [stats, setStats] = useState<Stats>({ overallBias: 'neutral', bullish: 0, bearish: 0, neutral: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomId) return;

    const fetchRoom = async () => {
      const { data: roomData } = await supabase
        .from('rooms')
        .select('name, instrument')
        .eq('id', roomId)
        .eq('is_active', true)
        .single();

      if (roomData) {
        setRoom(roomData);
      }
      setLoading(false);
    };

    const fetchStats = async () => {
      const { data: members } = await supabase
        .from('room_members')
        .select('timeframe_biases')
        .eq('room_id', roomId)
        .eq('is_online', true);

      if (members) {
        let bullish = 0;
        let bearish = 0;
        let neutral = 0;

        members.forEach(member => {
          const biases = member.timeframe_biases as Record<string, string>;
          Object.values(biases).forEach(bias => {
            if (bias === 'bullish') bullish++;
            else if (bias === 'bearish') bearish++;
            else neutral++;
          });
        });

        const overallBias: 'bullish' | 'bearish' | 'neutral' = 
          bullish > bearish && bullish > neutral ? 'bullish' :
          bearish > bullish && bearish > neutral ? 'bearish' : 'neutral';

        setStats({ overallBias, bullish, bearish, neutral });
      }
    };

    fetchRoom();
    fetchStats();

    // Real-time subscription
    const channel = supabase
      .channel(`embed-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_members',
          filter: `room_id=eq.${roomId}`,
        },
        () => fetchStats()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  const biasColor = stats.overallBias === 'bullish' ? '#22c55e' : stats.overallBias === 'bearish' ? '#ef4444' : '#6b7280';

  if (loading) {
    return (
      <div className="w-full h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="w-full h-screen bg-[#0a0a0a] flex items-center justify-center">
        <p className="text-gray-500 text-xs">Room not found</p>
      </div>
    );
  }

  return (
    <div 
      className="w-full min-h-screen p-4"
      style={{ backgroundColor: '#0a0a0a' }}
    >
      <p className="text-[9px] uppercase tracking-[0.15em] text-gray-500 mb-1">
        {room.instrument}
      </p>
      <h4 className="text-sm font-semibold text-white mb-3">{room.name}</h4>
      
      <div className="flex items-center justify-between">
        <div 
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
          style={{ 
            backgroundColor: `${biasColor}15`,
            border: `1px solid ${biasColor}40`
          }}
        >
          <span className="text-[9px] uppercase tracking-[0.1em] text-gray-400">Bias</span>
          <span 
            className="text-xs font-bold uppercase"
            style={{ color: biasColor }}
          >
            {stats.overallBias}
          </span>
        </div>
        
        <div className="flex items-center gap-3 text-[10px]">
          <span className="text-green-500 font-medium">{stats.bullish}↑</span>
          <span className="text-red-500 font-medium">{stats.bearish}↓</span>
          <span className="text-gray-400">{stats.neutral}○</span>
        </div>
      </div>
      
      <div className="mt-3 pt-2 border-t border-gray-800">
        <p className="text-[8px] text-gray-600 text-center">
          Powered by TradeBias
        </p>
      </div>
    </div>
  );
}