create table if not exists public.user_prefs (
  user_id uuid references auth.users(id) on delete cascade primary key,
  name text not null default '',
  theme text not null default 'dark',
  widget_quote boolean not null default true,
  widget_weather boolean not null default true,
  widget_streak boolean not null default true,
  updated_at timestamptz default now()
);

alter table public.user_prefs enable row level security;

create policy "Users manage their own prefs"
  on public.user_prefs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
