-- Add new column for timeframe biases (jsonb: {"5m": "bullish", "1h": "neutral", ...})
ALTER TABLE public.room_members 
ADD COLUMN timeframe_biases jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Keep the old bias column for backward compatibility, it can be removed later