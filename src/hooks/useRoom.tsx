import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

type BiasType = 'bullish' | 'bearish' | 'neutral';

interface RoomMember {
  id: string;
  user_id: string;
  bias: BiasType;
  is_online: boolean;
  profiles?: {
    username: string | null;
  };
}

interface Room {
  id: string;
  name: string;
  instrument: string;
  join_code: string;
  owner_id: string;
  is_active: boolean;
  created_at: string;
}

interface RoomStats {
  bullish: number;
  bearish: number;
  neutral: number;
  total: number;
  overallBias: BiasType;
}

export function useRoom(roomId: string | null) {
  const { user } = useAuth();
  const [room, setRoom] = useState<Room | null>(null);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [myBias, setMyBias] = useState<BiasType>('neutral');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<RoomStats>({
    bullish: 0,
    bearish: 0,
    neutral: 0,
    total: 0,
    overallBias: 'neutral'
  });

  // Calculate stats from members
  const calculateStats = useCallback((membersList: RoomMember[]): RoomStats => {
    const onlineMembers = membersList.filter(m => m.is_online);
    const bullish = onlineMembers.filter(m => m.bias === 'bullish').length;
    const bearish = onlineMembers.filter(m => m.bias === 'bearish').length;
    const neutral = onlineMembers.filter(m => m.bias === 'neutral').length;
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

      setRoom(roomData);

      // Fetch members
      const { data: membersData, error: membersError } = await supabase
        .from('room_members')
        .select('id, user_id, bias, is_online')
        .eq('room_id', roomId);

      if (membersError) {
        console.error('Error fetching members:', membersError);
      } else {
        const typedMembers = (membersData || []).map(m => ({
          ...m,
          bias: m.bias as BiasType,
          profiles: undefined
        }));
        setMembers(typedMembers);
        setStats(calculateStats(typedMembers));
        
        // Set my bias if I'm a member
        const myMembership = typedMembers.find(m => m.user_id === user?.id);
        if (myMembership) {
          setMyBias(myMembership.bias);
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
        async (payload) => {
          console.log('Realtime update:', payload);
          
          // Refetch members on any change
          const { data: membersData } = await supabase
            .from('room_members')
            .select('id, user_id, bias, is_online')
            .eq('room_id', roomId);

          if (membersData) {
            const typedMembers = membersData.map(m => ({
              ...m,
              bias: m.bias as BiasType,
              profiles: undefined
            }));
            setMembers(typedMembers);
            setStats(calculateStats(typedMembers));
          }
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
        is_online: true
      }, {
        onConflict: 'room_id,user_id'
      });

    if (error) {
      console.error('Error joining room:', error);
      return { error };
    }

    setMyBias('neutral');
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

  // Update bias
  const updateBias = useCallback(async (newBias: BiasType) => {
    if (!roomId || !user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('room_members')
      .update({ bias: newBias })
      .eq('room_id', roomId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating bias:', error);
      return { error };
    }

    setMyBias(newBias);
    return { error: null };
  }, [roomId, user]);

  return {
    room,
    members,
    myBias,
    stats,
    loading,
    joinRoom,
    leaveRoom,
    updateBias
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
      
      (ownedRooms || []).forEach(r => allRooms.set(r.id, r));
      (memberRooms || []).forEach(m => {
        if (m.rooms && typeof m.rooms === 'object' && 'id' in m.rooms) {
          const room = m.rooms as Room;
          if (room.is_active) {
            allRooms.set(room.id, room);
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

  const createRoom = useCallback(async (name: string, instrument: string) => {
    if (!user) return { error: new Error('Not authenticated'), room: null };

    const { data, error } = await supabase
      .from('rooms')
      .insert({
        name,
        instrument,
        owner_id: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating room:', error);
      return { error, room: null };
    }

    // Auto-join the room
    await supabase
      .from('room_members')
      .insert({
        room_id: data.id,
        user_id: user.id,
        bias: 'neutral',
        is_online: true
      });

    setRooms(prev => [...prev, { ...data, member_count: 1 }]);
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
        is_online: true
      }, {
        onConflict: 'room_id,user_id'
      });

    if (joinError) {
      return { error: joinError, room: null };
    }

    return { error: null, room };
  }, [user]);

  const closeRoom = useCallback(async (roomId: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('rooms')
      .update({ is_active: false })
      .eq('id', roomId)
      .eq('owner_id', user.id);

    if (error) {
      return { error };
    }

    setRooms(prev => prev.filter(r => r.id !== roomId));
    return { error: null };
  }, [user]);

  return { rooms, loading, createRoom, joinByCode, closeRoom };
}
