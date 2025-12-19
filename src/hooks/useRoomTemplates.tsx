import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface RoomTemplate {
  id: string;
  name: string;
  description: string | null;
  timeframes: string[];
  asset_class: 'forex' | 'crypto' | 'indices' | 'commodities' | 'stocks' | null;
  trading_style: 'scalping' | 'day_trading' | 'swing_trading' | 'position_trading' | 'news_trading' | null;
  is_system: boolean;
}

export function useRoomTemplates() {
  const [templates, setTemplates] = useState<RoomTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTemplates = async () => {
      const { data, error } = await supabase
        .from('room_templates')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching templates:', error);
      } else {
        setTemplates((data || []).map(t => ({
          ...t,
          timeframes: Array.isArray(t.timeframes) ? t.timeframes : [],
          asset_class: t.asset_class as RoomTemplate['asset_class'],
          trading_style: t.trading_style as RoomTemplate['trading_style']
        })));
      }
      setLoading(false);
    };

    fetchTemplates();
  }, []);

  return { templates, loading };
}

export const ASSET_CLASSES = [
  { value: 'forex', label: 'Forex' },
  { value: 'crypto', label: 'Crypto' },
  { value: 'indices', label: 'Indices' },
  { value: 'commodities', label: 'Commodities' },
  { value: 'stocks', label: 'Stocks' }
] as const;

export const TRADING_STYLES = [
  { value: 'scalping', label: 'Scalping' },
  { value: 'day_trading', label: 'Day Trading' },
  { value: 'swing_trading', label: 'Swing Trading' },
  { value: 'position_trading', label: 'Position Trading' },
  { value: 'news_trading', label: 'News Trading' }
] as const;
