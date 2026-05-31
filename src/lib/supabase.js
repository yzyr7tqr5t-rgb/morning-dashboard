import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL.replace(/\/$/, ''),
  import.meta.env.VITE_SUPABASE_ANON_KEY.trim(),
  {
    auth: {
      redirectTo: 'https://yzyr7tqr5t-rgb.github.io/morning-dashboard/',
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
)
