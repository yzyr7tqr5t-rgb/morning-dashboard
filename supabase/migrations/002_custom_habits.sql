-- User-defined habits table
create table if not exists public.habits (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  label text not null,
  icon text not null default 'circle',
  position int not null default 0,
  created_at timestamptz default now()
);

alter table public.habits enable row level security;

create policy "Users manage their own habits"
  on public.habits for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter publication supabase_realtime add table public.habits;
