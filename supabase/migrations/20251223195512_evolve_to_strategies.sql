-- Rename 'rooms' to 'strategies'
ALTER TABLE public.rooms RENAME TO strategies;

-- Add new columns to 'strategies'
ALTER TABLE public.strategies 
ADD COLUMN description TEXT, 
ADD COLUMN price_monthly NUMERIC(10, 2) DEFAULT 0 CHECK (price_monthly >= 0),
ADD COLUMN is_public BOOLEAN DEFAULT false,
ADD COLUMN cover_image_url TEXT;

-- Update RLS policies for strategies (formerly rooms)
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


-- Create 'biases' table (Structured Context)
CREATE TABLE public.biases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id UUID NOT NULL REFERENCES public.strategies(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Core Bias Props
  direction TEXT NOT NULL CHECK (direction IN ('long', 'short', 'neutral')),
  instrument TEXT NOT NULL, 
  timeframe TEXT NOT NULL,
  
  -- Structure & Context (Layer 1)
  logic_context TEXT CHECK (logic_context IN ('session', 'macro', 'news', 'technical')),
  thesis TEXT NOT NULL, -- The "Why"
  invalidation_level TEXT, -- "Price < 100" or "News event passes"
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invalidated', 'validated', 'closed')),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  closed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on biases
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


-- Create 'subscriptions' table (Layer 2 - Monetization)
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

-- Enable RLS on subscriptions
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

-- Allow subscribers to view private biases (Layer 2 Access)
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

-- Clean up old room_members table references if needed or migrate data
-- For this step we will leave room_members as legacy for specific 'membership' logic if we want to keep it, 
-- or we can drop it. Let's keep it but maybe deprecate it linguistically.
-- Updating foreign keys if necessary.
