-- TradeBias Consolidated Setup Script
-- Generated: 2025-12-25
-- Combines all previous migrations + Strategy Evolution

-- 1. Base Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_username text;
BEGIN
  v_username := new.raw_user_meta_data ->> 'username';
  IF v_username IS NOT NULL THEN
    v_username := trim(v_username);
    IF length(v_username) = 0 OR length(v_username) > 50 THEN
      v_username := NULL;
    END IF;
  END IF;
  INSERT INTO public.profiles (user_id, username)
  VALUES (new.id, v_username);
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Base Rooms (to be renamed Strategies later)
CREATE TABLE public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  instrument TEXT NOT NULL,
  join_code TEXT NOT NULL UNIQUE DEFAULT substring(md5(random()::text), 1, 8),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  participation_mode text NOT NULL DEFAULT 'participate' CHECK (participation_mode IN ('participate', 'follow')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can view active rooms" ON public.rooms FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Owners can view own rooms" ON public.rooms FOR SELECT TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "Users can create rooms" ON public.rooms FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update own rooms" ON public.rooms FOR UPDATE TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "Owners can delete own rooms" ON public.rooms FOR DELETE TO authenticated USING (auth.uid() = owner_id);

-- 3. Room Members
CREATE TABLE public.room_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bias TEXT NOT NULL DEFAULT 'neutral' CHECK (bias IN ('bullish', 'bearish', 'neutral')),
  is_online BOOLEAN NOT NULL DEFAULT true,
  timeframe_biases jsonb NOT NULL DEFAULT '{}'::jsonb,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view room members" ON public.room_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can join rooms" ON public.room_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own membership" ON public.room_members FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can leave rooms" ON public.room_members FOR DELETE TO authenticated USING (auth.uid() = user_id);
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_members;

-- 4. Utility Functions & Constraints
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON public.rooms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_room_members_updated_at BEFORE UPDATE ON public.room_members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.rooms 
  ADD CONSTRAINT rooms_name_length CHECK (char_length(name) > 0 AND char_length(name) <= 100),
  ADD CONSTRAINT rooms_instrument_length CHECK (char_length(instrument) > 0 AND char_length(instrument) <= 50);

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_username_length CHECK (username IS NULL OR (char_length(username) > 0 AND char_length(username) <= 50));

CREATE OR REPLACE FUNCTION public.reset_room_biases(p_room_id uuid)
RETURNS void
SECURITY INVOKER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM rooms WHERE id = p_room_id AND owner_id = auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized: must be room owner';
  END IF;
  UPDATE room_members SET timeframe_biases = '{}' WHERE room_id = p_room_id;
END;
$$;

-- 5. Advanced Features (Enums, Templates, Notifications)
CREATE TYPE public.asset_class AS ENUM ('forex', 'crypto', 'indices', 'commodities', 'stocks');
CREATE TYPE public.trading_style AS ENUM ('scalping', 'day_trading', 'swing_trading', 'position_trading', 'news_trading');
CREATE TYPE public.notification_type AS ENUM ('bias_change', 'follow', 'room_invite', 'accuracy_milestone');

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
INSERT INTO public.room_templates (name, description, timeframes, asset_class, trading_style, is_system) VALUES
('Scalper Setup', 'Quick trades on M1-M15 timeframes', ARRAY['M1', 'M5', 'M15'], NULL, 'scalping', true),
('Day Trader Setup', 'Intraday moves on M15-H4', ARRAY['M15', 'H1', 'H4'], NULL, 'day_trading', true),
('Swing Trader Setup', 'Multi-day positions H4-W1', ARRAY['H4', 'D1', 'W1'], NULL, 'swing_trading', true),
('News Trading Setup', 'Economic events focus', ARRAY['M5', 'M15', 'H1'], NULL, 'news_trading', true),
('Technical Analysis', 'Classic TA timeframes', ARRAY['H1', 'H4', 'D1'], NULL, NULL, true),
('Forex Majors', 'Major currency pairs', ARRAY['M15', 'H1', 'H4', 'D1'], 'forex', NULL, true),
('Crypto Swing', 'Crypto swing trading', ARRAY['H4', 'D1', 'W1'], 'crypto', 'swing_trading', true);
ALTER TABLE public.room_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view templates" ON public.room_templates FOR SELECT USING (true);

ALTER TABLE public.rooms 
ADD COLUMN asset_class asset_class,
ADD COLUMN trading_style trading_style,
ADD COLUMN timeframes TEXT[] NOT NULL DEFAULT ARRAY['M15', 'H1', 'H4', 'D1'];

CREATE TABLE public.room_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(room_id, tag)
);
ALTER TABLE public.room_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view room tags" ON public.room_tags FOR SELECT USING (true);
CREATE POLICY "Room owners can manage tags" ON public.room_tags FOR ALL USING (EXISTS (SELECT 1 FROM public.rooms WHERE id = room_id AND owner_id = auth.uid()));

CREATE TABLE public.user_follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL,
  following_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view follows" ON public.user_follows FOR SELECT USING (true);
CREATE POLICY "Users can follow others" ON public.user_follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON public.user_follows FOR DELETE USING (auth.uid() = follower_id);

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
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = false;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

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
CREATE POLICY "Room members can view outcomes" ON public.bias_outcomes FOR SELECT USING (true);
CREATE POLICY "Room owners can record outcomes" ON public.bias_outcomes FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.rooms WHERE id = room_id AND owner_id = auth.uid()));

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
CREATE POLICY "Anyone can view bias history" ON public.bias_history FOR SELECT USING (true);
CREATE POLICY "System can insert history" ON public.bias_history FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.rooms WHERE id = room_id AND owner_id = auth.uid()));

CREATE VIEW public.trader_stats 
WITH (security_invoker = true)
AS
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

-- 6. EVOLUTION: Strategies (The Rename)
ALTER TABLE public.rooms RENAME TO strategies;

-- Add new columns to 'strategies'
ALTER TABLE public.strategies 
ADD COLUMN description TEXT, 
ADD COLUMN price_monthly NUMERIC(10, 2) DEFAULT 0 CHECK (price_monthly >= 0),
ADD COLUMN is_public BOOLEAN DEFAULT false,
ADD COLUMN cover_image_url TEXT;

-- Update RLS policies for strategies
DROP POLICY "Anyone authenticated can view active rooms" ON public.strategies;
DROP POLICY "Owners can view own rooms" ON public.strategies;
DROP POLICY "Users can create rooms" ON public.strategies;
DROP POLICY "Owners can update own rooms" ON public.strategies;
DROP POLICY "Owners can delete own rooms" ON public.strategies;

CREATE POLICY "Public strategies are viewable by everyone" 
ON public.strategies FOR SELECT 
USING (is_public = true);

CREATE POLICY "Owners can view own strategies" 
ON public.strategies FOR SELECT 
USING (auth.uid() = owner_id);

CREATE POLICY "Users can create strategies" 
ON public.strategies FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update own strategies" 
ON public.strategies FOR UPDATE 
USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete own strategies" 
ON public.strategies FOR DELETE 
USING (auth.uid() = owner_id);

-- 7. New Bias & Subscription Tables
CREATE TABLE public.biases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id UUID NOT NULL REFERENCES public.strategies(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES auth.users(id),
  direction TEXT NOT NULL CHECK (direction IN ('long', 'short', 'neutral')),
  instrument TEXT NOT NULL, 
  timeframe TEXT NOT NULL,
  logic_context TEXT CHECK (logic_context IN ('session', 'macro', 'news', 'technical')),
  thesis TEXT NOT NULL,
  invalidation_level TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invalidated', 'validated', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  closed_at TIMESTAMP WITH TIME ZONE
);
ALTER TABLE public.biases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public strategy biases are viewable" 
ON public.biases FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.strategies 
    WHERE id = biases.strategy_id AND is_public = true
  )
);

CREATE POLICY "Strategy owners can manage biases" 
ON public.biases FOR ALL 
USING (auth.uid() = creator_id);

CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID NOT NULL REFERENCES auth.users(id),
  strategy_id UUID NOT NULL REFERENCES public.strategies(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  tiers TEXT DEFAULT 'standard',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(subscriber_id, strategy_id)
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions" 
ON public.subscriptions FOR SELECT 
USING (auth.uid() = subscriber_id);

CREATE POLICY "Strategy owners can view their subscribers" 
ON public.subscriptions FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.strategies 
    WHERE id = subscriptions.strategy_id AND owner_id = auth.uid()
  )
);

CREATE POLICY "Subscribers can view strategy biases" 
ON public.biases FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.subscriptions 
    WHERE strategy_id = biases.strategy_id 
    AND subscriber_id = auth.uid() 
    AND status = 'active'
  )
);

-- 8. FIX: Update Notification Function to user 'strategies' instead of 'rooms'
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
    SELECT username INTO trader_username FROM public.profiles WHERE user_id = NEW.user_id;
    
    -- UPDATED: Select from 'strategies' instead of 'rooms'
    SELECT name INTO room_name FROM public.strategies WHERE id = NEW.room_id;
    
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
