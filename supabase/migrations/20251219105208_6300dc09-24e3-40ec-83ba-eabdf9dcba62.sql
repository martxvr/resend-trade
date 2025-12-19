-- Fix security definer view issue by recreating with security_invoker
DROP VIEW IF EXISTS public.trader_stats;

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