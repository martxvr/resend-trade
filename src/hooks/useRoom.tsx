import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { BiasType, TimeframeBiases, calculateAggregateBias } from '@/components/TimeframeBiasGrid';
import { Json } from '@/integrations/supabase/types';

interface RoomMember {
  id: string;
  user_id: string;
  bias: string;
  timeframe_biases: TimeframeBiases;
  is_online: boolean;
}

interface Room {
  id: string;
  name: string;
  instrument: string;
  join_code: string;
  owner_id: string;
  is_active: boolean;
  timeframes: string[];
  participation_mode: 'participate' | 'follow';
  created_at: string;
}

interface RoomStats {
  bullish: number;
  bearish: number;
  neutral: number;
  total: number;
  overallBias: BiasType;
}

const DEFAULT_TIMEFRAMES = ['5m', '15m', '1h', '4h', '1D'];

// Helper to safely parse timeframes from DB
function parseTimeframes(data: unknown): string[] {
  if (Array.isArray(data)) {
    return data.filter((item): item is string => typeof item === 'string');
  }
  return DEFAULT_TIMEFRAMES;
}

// Helper to parse timeframe_biases from DB
function parseTimeframeBiases(data: Json | null | undefined): TimeframeBiases {
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    return data as TimeframeBiases;
  }
  return {};
}

// Helper to parse participation_mode
function parseParticipationMode(data: unknown): 'participate' | 'follow' {
  if (data === 'follow') return 'follow';
  return 'participate';
}

export function useRoom(roomId: string | null) {
  const { user } = useAuth();
  const [room, setRoom] = useState<Room | null>(null);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [myTimeframeBiases, setMyTimeframeBiases] = useState<TimeframeBiases>({});
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<RoomStats>({
    bullish: 0,
    bearish: 0,
    neutral: 0,
    total: 0,
    overallBias: 'neutral'
  });

  // Calculate stats from members' aggregate biases
  const calculateStats = useCallback((membersList: RoomMember[], timeframes: string[]): RoomStats => {
    const onlineMembers = membersList.filter(m => m.is_online);
    let bullish = 0;
    let bearish = 0;
    let neutral = 0;
    
    onlineMembers.forEach(member => {
      const { overallBias } = calculateAggregateBias(member.timeframe_biases || {}, timeframes);
      if (overallBias === 'bullish') bullish++;
      else if (overallBias === 'bearish') bearish++;
      else neutral++;
    });
    
    const total = onlineMembers.length;
    
    let overallBias: BiasType = 'neutral';
    if (bullish > bearish && bullish > neutral) overallBias = 'bullish';
    else if (bearish > bullish && bearish > neutral) overallBias = 'bearish';
    
    return { bullish, bearish, neutral, total, overallBias };
  }, []);

  // Fetch room data
  useEffect(() => {
    if (!roomId) {
      setLoading(false);
      return;
    }

    const fetchRoom = async () => {
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .maybeSingle();

      if (roomError) {
        console.error('Error fetching room:', roomError);
        setLoading(false);
        return;
      }

      // Parse room with all fields
      const parsedRoom: Room | null = roomData ? {
        id: roomData.id,
        name: roomData.name,
        instrument: roomData.instrument,
        join_code: roomData.join_code,
        owner_id: roomData.owner_id,
        is_active: roomData.is_active,
        created_at: roomData.created_at,
        timeframes: parseTimeframes((roomData as Record<string, unknown>).timeframes),
        participation_mode: parseParticipationMode((roomData as Record<string, unknown>).participation_mode)
      } : null;
      
      setRoom(parsedRoom);

      // Fetch members
      const { data: membersData, error: membersError } = await supabase
        .from('room_members')
        .select('id, user_id, bias, is_online, timeframe_biases')
        .eq('room_id', roomId);

      if (membersError) {
        console.error('Error fetching members:', membersError);
      } else {
        const typedMembers = (membersData || []).map(m => ({
          ...m,
          timeframe_biases: parseTimeframeBiases(m.timeframe_biases)
        }));
        setMembers(typedMembers);
        setStats(calculateStats(typedMembers, parsedRoom?.timeframes || []));
        
        // Set my biases if I'm a member
        const myMembership = typedMembers.find(m => m.user_id === user?.id);
        if (myMembership) {
          setMyTimeframeBiases(myMembership.timeframe_biases || {});
        }
      }

      setLoading(false);
    };

    fetchRoom();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_members',
          filter: `room_id=eq.${roomId}`
        },
        async () => {
          // Refetch members on any change
          const { data: membersData } = await supabase
            .from('room_members')
            .select('id, user_id, bias, is_online, timeframe_biases')
            .eq('room_id', roomId);

          if (membersData) {
            const typedMembers = membersData.map(m => ({
              ...m,
              timeframe_biases: parseTimeframeBiases(m.timeframe_biases)
            }));
            setMembers(typedMembers);
            
            // Get current room for timeframes
            const { data: currentRoom } = await supabase
              .from('rooms')
              .select('*')
              .eq('id', roomId)
              .single();
              
            const timeframes = currentRoom 
              ? parseTimeframes((currentRoom as Record<string, unknown>).timeframes)
              : DEFAULT_TIMEFRAMES;
            setStats(calculateStats(typedMembers, timeframes));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${roomId}`
        },
        async (payload) => {
          // Room settings updated
          const updatedData = payload.new as Record<string, unknown>;
          setRoom(prev => prev ? { 
            ...prev, 
            timeframes: parseTimeframes(updatedData.timeframes),
            participation_mode: parseParticipationMode(updatedData.participation_mode)
          } : null);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, user?.id, calculateStats]);

  // Join room
  const joinRoom = useCallback(async () => {
    if (!roomId || !user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('room_members')
      .upsert({
        room_id: roomId,
        user_id: user.id,
        bias: 'neutral',
        timeframe_biases: {},
        is_online: true
      }, {
        onConflict: 'room_id,user_id'
      });

    if (error) {
      console.error('Error joining room:', error);
      return { error };
    }

    setMyTimeframeBiases({});
    return { error: null };
  }, [roomId, user]);

  // Leave room
  const leaveRoom = useCallback(async () => {
    if (!roomId || !user) return;

    await supabase
      .from('room_members')
      .update({ is_online: false })
      .eq('room_id', roomId)
      .eq('user_id', user.id);
  }, [roomId, user]);

  // Update timeframe bias
  const updateTimeframeBias = useCallback(async (timeframe: string, bias: BiasType) => {
    if (!roomId || !user) return { error: new Error('Not authenticated') };

    const newBiases = { ...myTimeframeBiases, [timeframe]: bias };
    
    const { error } = await supabase
      .from('room_members')
      .update({ timeframe_biases: newBiases })
      .eq('room_id', roomId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating timeframe bias:', error);
      return { error };
    }

    setMyTimeframeBiases(newBiases);
    return { error: null };
  }, [roomId, user, myTimeframeBiases]);

  // Update room timeframes (owner only)
  const updateTimeframes = useCallback(async (timeframes: string[]) => {
    if (!roomId || !user || room?.owner_id !== user.id) {
      return { error: new Error('Not authorized') };
    }

    const { error } = await supabase
      .from('rooms')
      .update({ timeframes } as unknown as Record<string, never>)
      .eq('id', roomId)
      .eq('owner_id', user.id);

    if (error) {
      console.error('Error updating timeframes:', error);
      return { error };
    }

    setRoom(prev => prev ? { ...prev, timeframes } : null);
    return { error: null };
  }, [roomId, user, room?.owner_id]);

  // Update participation mode (owner only)
  const updateParticipationMode = useCallback(async (mode: 'participate' | 'follow') => {
    if (!roomId || !user || room?.owner_id !== user.id) {
      return { error: new Error('Not authorized') };
    }

    const { error } = await supabase
      .from('rooms')
      .update({ participation_mode: mode } as unknown as Record<string, never>)
      .eq('id', roomId)
      .eq('owner_id', user.id);

    if (error) {
      console.error('Error updating participation mode:', error);
      return { error };
    }

    setRoom(prev => prev ? { ...prev, participation_mode: mode } : null);
    return { error: null };
  }, [roomId, user, room?.owner_id]);

  // Reset all biases (owner only) - uses server-side RPC with owner validation
  const resetAllBiases = useCallback(async () => {
    if (!roomId || !user || room?.owner_id !== user.id) {
      return { error: new Error('Not authorized') };
    }

    const { error } = await supabase
      .rpc('reset_room_biases', { p_room_id: roomId });

    if (error) {
      console.error('Error resetting biases:', error);
      return { error };
    }

    setMyTimeframeBiases({});
    return { error: null };
  }, [roomId, user, room?.owner_id]);

  // Get my aggregate bias
  const myAggregateBias = room 
    ? calculateAggregateBias(myTimeframeBiases, room.timeframes)
    : { overallBias: 'neutral' as BiasType, bullishCount: 0, bearishCount: 0, neutralCount: 0 };

  return {
    room,
    members,
    myTimeframeBiases,
    myAggregateBias,
    stats,
    loading,
    joinRoom,
    leaveRoom,
    updateTimeframeBias,
    updateTimeframes,
    updateParticipationMode,
    resetAllBiases,
    isOwner: user?.id === room?.owner_id
  };
}

// Hook for managing user's rooms
export function useMyRooms() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<(Room & { member_count: number })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRooms([]);
      setLoading(false);
      return;
    }

    const fetchRooms = async () => {
      // Fetch rooms user owns or is a member of
      const { data: ownedRooms, error: ownedError } = await supabase
        .from('rooms')
        .select('*')
        .eq('owner_id', user.id)
        .eq('is_active', true);

      const { data: memberRooms, error: memberError } = await supabase
        .from('room_members')
        .select(`
          room_id,
          rooms (*)
        `)
        .eq('user_id', user.id);

      if (ownedError || memberError) {
        console.error('Error fetching rooms:', ownedError || memberError);
        setLoading(false);
        return;
      }

      // Combine and deduplicate
      const allRooms = new Map<string, Room>();
      
      (ownedRooms || []).forEach(r => allRooms.set(r.id, {
        id: r.id,
        name: r.name,
        instrument: r.instrument,
        join_code: r.join_code,
        owner_id: r.owner_id,
        is_active: r.is_active,
        created_at: r.created_at,
        timeframes: parseTimeframes((r as Record<string, unknown>).timeframes),
        participation_mode: parseParticipationMode((r as Record<string, unknown>).participation_mode)
      }));
      
      (memberRooms || []).forEach(m => {
        if (m.rooms && typeof m.rooms === 'object' && 'id' in m.rooms) {
          const r = m.rooms as Record<string, unknown>;
          if (r.is_active) {
            allRooms.set(r.id as string, {
              id: r.id as string,
              name: r.name as string,
              instrument: r.instrument as string,
              join_code: r.join_code as string,
              owner_id: r.owner_id as string,
              is_active: r.is_active as boolean,
              created_at: r.created_at as string,
              timeframes: parseTimeframes(r.timeframes),
              participation_mode: parseParticipationMode(r.participation_mode)
            });
          }
        }
      });

      // Get member counts
      const roomsWithCounts = await Promise.all(
        Array.from(allRooms.values()).map(async (room) => {
          const { count } = await supabase
            .from('room_members')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', room.id)
            .eq('is_online', true);
          
          return { ...room, member_count: count || 0 };
        })
      );

      setRooms(roomsWithCounts);
      setLoading(false);
    };

    fetchRooms();
  }, [user]);

  const createRoom = useCallback(async (name: string, instrument: string, timeframes: string[]) => {
    if (!user) return { error: new Error('Not authenticated'), room: null };

    const { data, error } = await supabase
      .from('rooms')
      .insert([{
        name,
        instrument,
        owner_id: user.id
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating room:', error);
      return { error, room: null };
    }

    // Update timeframes separately since column may not be in types
    await supabase
      .from('rooms')
      .update({ timeframes } as unknown as Record<string, never>)
      .eq('id', data.id);

    // Auto-join the room
    await supabase
      .from('room_members')
      .insert([{
        room_id: data.id,
        user_id: user.id,
        bias: 'neutral',
        is_online: true
      }]);

    const newRoom: Room & { member_count: number } = { 
      id: data.id,
      name: data.name,
      instrument: data.instrument,
      join_code: data.join_code,
      owner_id: data.owner_id,
      is_active: data.is_active,
      created_at: data.created_at,
      timeframes: timeframes,
      participation_mode: 'participate',
      member_count: 1 
    };
    setRooms(prev => [...prev, newRoom]);
    return { error: null, room: data };
  }, [user]);

  const joinByCode = useCallback(async (code: string) => {
    if (!user) return { error: new Error('Not authenticated'), room: null };

    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('join_code', code.toLowerCase())
      .eq('is_active', true)
      .maybeSingle();

    if (roomError || !room) {
      return { error: new Error('Room not found'), room: null };
    }

    const { error: joinError } = await supabase
      .from('room_members')
      .upsert({
        room_id: room.id,
        user_id: user.id,
        bias: 'neutral',
        timeframe_biases: {},
        is_online: true
      }, {
        onConflict: 'room_id,user_id'
      });

    if (joinError) {
      return { error: joinError, room: null };
    }

    return { error: null, room };
  }, [user]);

  const deleteRoom = useCallback(async (roomId: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('rooms')
      .update({ is_active: false })
      .eq('id', roomId)
      .eq('owner_id', user.id);

    if (error) {
      console.error('Error deleting room:', error);
      return { error };
    }

    setRooms(prev => prev.filter(r => r.id !== roomId));
    return { error: null };
  }, [user]);

  return {
    rooms,
    loading,
    createRoom,
    joinByCode,
    deleteRoom
  };
}