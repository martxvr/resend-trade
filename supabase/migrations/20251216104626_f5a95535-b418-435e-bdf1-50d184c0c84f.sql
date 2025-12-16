-- Add database constraints for input validation on rooms table
ALTER TABLE public.rooms 
  ADD CONSTRAINT rooms_name_length CHECK (char_length(name) > 0 AND char_length(name) <= 100),
  ADD CONSTRAINT rooms_instrument_length CHECK (char_length(instrument) > 0 AND char_length(instrument) <= 50);

-- Add constraint for profiles username
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_username_length CHECK (username IS NULL OR (char_length(username) > 0 AND char_length(username) <= 50));

-- Update handle_new_user function with validation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_username text;
BEGIN
  v_username := new.raw_user_meta_data ->> 'username';
  
  -- Validate username if provided
  IF v_username IS NOT NULL THEN
    v_username := trim(v_username);
    IF length(v_username) = 0 OR length(v_username) > 50 THEN
      v_username := NULL; -- Set to NULL if invalid
    END IF;
  END IF;
  
  INSERT INTO public.profiles (user_id, username)
  VALUES (new.id, v_username);
  RETURN new;
END;
$$;

-- Create reset_room_biases function for secure owner-only reset
CREATE OR REPLACE FUNCTION public.reset_room_biases(p_room_id uuid)
RETURNS void
SECURITY INVOKER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Check if caller is room owner
  IF NOT EXISTS (
    SELECT 1 FROM rooms 
    WHERE id = p_room_id AND owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized: must be room owner';
  END IF;
  
  -- Reset all member biases for this room
  UPDATE room_members 
  SET timeframe_biases = '{}' 
  WHERE room_id = p_room_id;
END;
$$;