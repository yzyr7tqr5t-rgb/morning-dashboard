-- Fix habit_id type: int → uuid to match habits.id
alter table public.habits_log drop constraint if exists habits_log_user_id_habit_id_date_key;
alter table public.habits_log drop column habit_id;
alter table public.habits_log add column habit_id uuid references public.habits(id) on delete cascade not null;
alter table public.habits_log add constraint habits_log_user_id_habit_id_date_key unique (user_id, habit_id, date);
