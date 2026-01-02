-- Create table for creator studio waitlist
create table public.creator_waitlist (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  email text, -- For authenticated users we can grab from auth.users but storing here for ease if they want to use different email? Or just rely on user_id. Let's just track user_id mostly, but email is good for quick export.
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table public.creator_waitlist enable row level security;

create policy "Users can join waitlist"
  on public.creator_waitlist for insert
  with check (auth.uid() = user_id);

create policy "Users can view own entry"
  on public.creator_waitlist for select
  using (auth.uid() = user_id);
