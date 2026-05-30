-- Enable realtime
create table if not exists public.habits_log (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  habit_id int not null,
  date date not null default current_date,
  completed boolean not null default true,
  created_at timestamptz default now(),
  unique (user_id, habit_id, date)
);

-- Row level security
alter table public.habits_log enable row level security;

create policy "Users can manage their own habits"
  on public.habits_log
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Enable realtime on this table
alter publication supabase_realtime add table public.habits_log;
