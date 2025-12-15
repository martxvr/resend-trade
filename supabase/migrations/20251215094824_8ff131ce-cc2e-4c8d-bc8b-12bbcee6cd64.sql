-- Add participation_mode column to rooms table
-- 'participate' = all can change bias, 'follow' = only owner can change bias
ALTER TABLE public.rooms 
ADD COLUMN IF NOT EXISTS participation_mode text NOT NULL DEFAULT 'participate';

-- Add constraint to ensure valid values
ALTER TABLE public.rooms 
ADD CONSTRAINT rooms_participation_mode_check 
CHECK (participation_mode IN ('participate', 'follow'));