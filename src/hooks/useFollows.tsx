import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface FollowedTrader {
  id: string;
  following_id: string;
  username: string | null;
  created_at: string;
}

export function useFollows() {
  const { user } = useAuth();
  const [following, setFollowing] = useState<FollowedTrader[]>([]);
  const [followers, setFollowers] = useState<FollowedTrader[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setFollowing([]);
      setFollowers([]);
      setLoading(false);
      return;
    }

    const fetchFollows = async () => {
      // Fetch who I'm following
      const { data: followingData, error: followingError } = await supabase
        .from('user_follows')
        .select(`
          id,
          following_id,
          created_at
        `)
        .eq('follower_id', user.id);

      if (followingError) {
        console.error('Error fetching following:', followingError);
      } else {
        // Get usernames for followed users
        const userIds = (followingData || []).map(f => f.following_id);
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, username')
            .in('user_id', userIds);

          const profileMap = new Map((profiles || []).map(p => [p.user_id, p.username]));
          
          setFollowing((followingData || []).map(f => ({
            ...f,
            username: profileMap.get(f.following_id) || null
          })));
        } else {
          setFollowing([]);
        }
      }

      // Fetch my followers
      const { data: followersData, error: followersError } = await supabase
        .from('user_follows')
        .select(`
          id,
          follower_id,
          created_at
        `)
        .eq('following_id', user.id);

      if (followersError) {
        console.error('Error fetching followers:', followersError);
      } else {
        const userIds = (followersData || []).map(f => f.follower_id);
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, username')
            .in('user_id', userIds);

          const profileMap = new Map((profiles || []).map(p => [p.user_id, p.username]));
          
          setFollowers((followersData || []).map(f => ({
            id: f.id,
            following_id: f.follower_id,
            username: profileMap.get(f.follower_id) || null,
            created_at: f.created_at
          })));
        } else {
          setFollowers([]);
        }
      }

      setLoading(false);
    };

    fetchFollows();
  }, [user]);

  const followTrader = useCallback(async (traderId: string) => {
    if (!user) return { error: new Error('Not authenticated') };
    if (traderId === user.id) return { error: new Error('Cannot follow yourself') };

    const { error } = await supabase
      .from('user_follows')
      .insert({ follower_id: user.id, following_id: traderId });

    if (error) {
      if (error.code === '23505') {
        toast.info('Already following this trader');
      } else {
        console.error('Error following trader:', error);
        toast.error('Failed to follow trader');
      }
      return { error };
    }

    // Get username
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('user_id', traderId)
      .maybeSingle();

    setFollowing(prev => [...prev, {
      id: crypto.randomUUID(),
      following_id: traderId,
      username: profile?.username || null,
      created_at: new Date().toISOString()
    }]);

    toast.success('Now following trader');
    return { error: null };
  }, [user]);

  const unfollowTrader = useCallback(async (traderId: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('user_follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', traderId);

    if (error) {
      console.error('Error unfollowing trader:', error);
      toast.error('Failed to unfollow trader');
      return { error };
    }

    setFollowing(prev => prev.filter(f => f.following_id !== traderId));
    toast.success('Unfollowed trader');
    return { error: null };
  }, [user]);

  const isFollowing = useCallback((traderId: string) => {
    return following.some(f => f.following_id === traderId);
  }, [following]);

  return {
    following,
    followers,
    followingCount: following.length,
    followersCount: followers.length,
    loading,
    followTrader,
    unfollowTrader,
    isFollowing
  };
}
