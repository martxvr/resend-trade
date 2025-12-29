-- 1. Create helper functions to check access without recursion (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION public.check_is_strategy_owner(p_strategy_id UUID)
RETURNS BOOLEAN 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.strategies 
    WHERE id = p_strategy_id AND owner_id = auth.uid()
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.check_is_strategy_co_owner(p_strategy_id UUID)
RETURNS BOOLEAN 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.strategy_co_owners 
    WHERE strategy_id = p_strategy_id AND user_id = auth.uid()
  );
END;
$$;

-- 2. Clean up existing policies that are causing recursion
DROP POLICY IF EXISTS "Co-owners can view strategies" ON public.strategies;
DROP POLICY IF EXISTS "Owners can view own strategies" ON public.strategies;
DROP POLICY IF EXISTS "Public strategies are viewable by everyone" ON public.strategies;
DROP POLICY IF EXISTS "Co-owners can view their co-ownerships" ON public.strategy_co_owners;
DROP POLICY IF EXISTS "Strategy owners can manage co-owners" ON public.strategy_co_owners;

-- 3. Create new non-recursive policies for 'strategies'
-- Combine select policies into one for clarity and to ensure no recursion
CREATE POLICY "strategies_select_policy" 
ON public.strategies FOR SELECT 
USING (
  is_public = true 
  OR owner_id = auth.uid() 
  OR check_is_strategy_co_owner(id)
);

-- 4. Create new non-recursive policies for 'strategy_co_owners'
CREATE POLICY "strategy_co_owners_select_policy" 
ON public.strategy_co_owners FOR SELECT 
USING (
  user_id = auth.uid() 
  OR check_is_strategy_owner(strategy_id)
);

CREATE POLICY "strategy_co_owners_manage_all_policy" 
ON public.strategy_co_owners FOR ALL 
USING (check_is_strategy_owner(strategy_id))
WITH CHECK (check_is_strategy_owner(strategy_id));

-- 5. Revoke execute on helper functions from public if you want extra security
-- (But they rely on auth.uid() anyway, so they are safe)
GRANT EXECUTE ON FUNCTION public.check_is_strategy_owner TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_is_strategy_co_owner TO authenticated;
