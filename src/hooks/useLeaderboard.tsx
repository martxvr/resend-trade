import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TraderStats {
  user_id: string;
  username: string | null;
  total_predictions: number;
  correct_predictions: number;
  accuracy_percentage: number;
  rooms_participated: number;
}

export function useLeaderboard() {
  const [traders, setTraders] = useState<TraderStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const { data, error } = await supabase
        .from('trader_stats')
        .select('*')
        .order('accuracy_percentage', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching leaderboard:', error);
      } else {
        setTraders((data || []) as TraderStats[]);
      }
      setLoading(false);
    };

    fetchLeaderboard();
  }, []);

  return { traders, loading };
}
