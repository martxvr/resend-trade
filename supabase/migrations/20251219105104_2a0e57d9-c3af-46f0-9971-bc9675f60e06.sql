-- ENUM TYPES
CREATE TYPE public.asset_class AS ENUM ('forex', 'crypto', 'indices', 'commodities', 'stocks');
CREATE TYPE public.trading_style AS ENUM ('scalping', 'day_trading', 'swing_trading', 'position_trading', 'news_trading');
CREATE TYPE public.notification_type AS ENUM ('bias_change', 'follow', 'room_invite', 'accuracy_milestone');

-- ROOM TEMPLATES
CREATE TABLE public.room_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  timeframes TEXT[] NOT NULL,
  asset_class asset_class,
  trading_style trading_style,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default templates
INSERT INTO public.room_templates (name, description, timeframes, asset_class, trading_style, is_system) VALUES
('Scalper Setup', 'Quick trades on M1-M15 timeframes', ARRAY['M1', 'M5', 'M15'], NULL, 'scalping', true),
('Day Trader Setup', 'Intraday moves on M15-H4', ARRAY['M15', 'H1', 'H4'], NULL, 'day_trading', true),
('Swing Trader Setup', 'Multi-day positions H4-W1', ARRAY['H4', 'D1', 'W1'], NULL, 'swing_trading', true),
('News Trading Setup', 'Economic events focus', ARRAY['M5', 'M15', 'H1'], NULL, 'news_trading', true),
('Technical Analysis', 'Classic TA timeframes', ARRAY['H1', 'H4', 'D1'], NULL, NULL, true),
('Forex Majors', 'Major currency pairs', ARRAY['M15', 'H1', 'H4', 'D1'], 'forex', NULL, true),
('Crypto Swing', 'Crypto swing trading', ARRAY['H4', 'D1', 'W1'], 'crypto', 'swing_trading', true);

ALTER TABLE public.room_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view templates"
ON public.room_templates FOR SELECT
USING (true);

-- ADD CATEGORIES TO ROOMS
ALTER TABLE public.rooms 
ADD COLUMN asset_class asset_class,
ADD COLUMN trading_style trading_style,
ADD COLUMN timeframes TEXT[] NOT NULL DEFAULT ARRAY['M15', 'H1', 'H4', 'D1'];

-- ROOM TAGS (flexible tagging)
CREATE TABLE public.room_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(room_id, tag)
);

ALTER TABLE public.room_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view room tags"
ON public.room_tags FOR SELECT USING (true);

CREATE POLICY "Room owners can manage tags"
ON public.room_tags FOR ALL
USING (EXISTS (SELECT 1 FROM public.rooms WHERE id = room_id AND owner_id = auth.uid()));

-- USER FOLLOWS
CREATE TABLE public.user_follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL,
  following_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view follows"
ON public.user_follows FOR SELECT USING (true);

CREATE POLICY "Users can follow others"
ON public.user_follows FOR INSERT
WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
ON public.user_follows FOR DELETE
USING (auth.uid() = follower_id);

-- NOTIFICATIONS
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = false;

-- BIAS OUTCOMES (for accuracy tracking)
CREATE TABLE public.bias_outcomes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  timeframe TEXT NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  outcome TEXT NOT NULL CHECK (outcome IN ('bullish', 'bearish', 'neutral')),
  recorded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.bias_outcomes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Room members can view outcomes"
ON public.bias_outcomes FOR SELECT USING (true);

CREATE POLICY "Room owners can record outcomes"
ON public.bias_outcomes FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.rooms WHERE id = room_id AND owner_id = auth.uid()));

-- HISTORICAL BIASES (snapshot of member biases at outcome time)
CREATE TABLE public.bias_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  outcome_id UUID NOT NULL REFERENCES public.bias_outcomes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  timeframe TEXT NOT NULL,
  bias TEXT NOT NULL CHECK (bias IN ('bullish', 'bearish', 'neutral')),
  was_correct BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.bias_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view bias history"
ON public.bias_history FOR SELECT USING (true);

CREATE POLICY "System can insert history"
ON public.bias_history FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.rooms WHERE id = room_id AND owner_id = auth.uid()));

-- LEADERBOARD VIEW (materialized for performance)
CREATE OR REPLACE VIEW public.trader_stats AS
SELECT 
  bh.user_id,
  p.username,
  COUNT(*) as total_predictions,
  COUNT(*) FILTER (WHERE bh.was_correct = true) as correct_predictions,
  ROUND(
    (COUNT(*) FILTER (WHERE bh.was_correct = true)::numeric / NULLIF(COUNT(*), 0)::numeric) * 100, 
    1
  ) as accuracy_percentage,
  COUNT(DISTINCT bh.room_id) as rooms_participated
FROM public.bias_history bh
JOIN public.profiles p ON p.user_id = bh.user_id
GROUP BY bh.user_id, p.username;

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Function to create notification when followed trader changes bias
CREATE OR REPLACE FUNCTION public.notify_followers_on_bias_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  follower_record RECORD;
  trader_username TEXT;
  room_name TEXT;
BEGIN
  -- Only trigger on actual bias changes
  IF OLD.timeframe_biases IS DISTINCT FROM NEW.timeframe_biases THEN
    -- Get trader username
    SELECT username INTO trader_username FROM public.profiles WHERE user_id = NEW.user_id;
    
    -- Get room name
    SELECT name INTO room_name FROM public.rooms WHERE id = NEW.room_id;
    
    -- Notify all followers
    FOR follower_record IN 
      SELECT follower_id FROM public.user_follows WHERE following_id = NEW.user_id
    LOOP
      INSERT INTO public.notifications (user_id, type, title, message, data)
      VALUES (
        follower_record.follower_id,
        'bias_change',
        'Bias Update',
        COALESCE(trader_username, 'A trader') || ' updated their bias in ' || COALESCE(room_name, 'a room'),
        jsonb_build_object(
          'trader_id', NEW.user_id,
          'room_id', NEW.room_id,
          'trader_username', trader_username,
          'room_name', room_name
        )
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_bias_change_notify_followers
AFTER UPDATE ON public.room_members
FOR EACH ROW
EXECUTE FUNCTION public.notify_followers_on_bias_change();