import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sun, Cloud, CloudRain, Wind, Droplets, CheckCircle2, Circle, Flame, Moon, LogOut, Settings, BarChart2, SlidersHorizontal } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import Auth from '@/components/Auth'
import HabitsManager, { getEmoji } from '@/components/HabitsManager'
import WeeklyView from '@/components/WeeklyView'
import PrefsManager from '@/components/PrefsManager'

const QUOTES = [
  "The morning is wiser than the evening.",
  "Each morning we are born again.",
  "Win the morning, win the day.",
  "Rise up, start fresh, see the bright opportunity in each new day.",
  "Your future is created by what you do today, not tomorrow.",
]

const DEFAULT_HABITS = [
  { label: 'Morning coffee', icon: 'coffee', position: 0 },
  { label: 'Read 10 pages', icon: 'book', position: 1 },
  { label: 'Exercise', icon: 'dumbbell', position: 2 },
  { label: 'Healthy breakfast', icon: 'apple', position: 3 },
  { label: 'Gratitude journal', icon: 'smile', position: 4 },
]

function today() {
  return new Date().toISOString().slice(0, 10)
}

// ─── Clock ────────────────────────────────────────────────────────────────────
const Clock = memo(function Clock({ name, isLight }) {
  const [time, setTime] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  const hours = time.getHours()
  const greeting = hours < 12 ? 'Good morning' : hours < 17 ? 'Good afternoon' : 'Good evening'
  const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const dateStr = time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })
  const greetingText = name ? `${greeting}, ${name}` : greeting
  return (
    <div className="text-center py-6">
      <p className={cn('text-sm font-medium mb-1', isLight ? 'text-blue-500' : 'text-blue-300')}>{greetingText}</p>
      <h1 className={cn('font-bold tabular-nums tracking-tight leading-none', isLight ? 'text-slate-900' : 'text-white')}
          style={{ fontSize: 'clamp(4rem, 18vw, 6rem)', fontWeight: 700 }}>
        {timeStr}
      </h1>
      <p className={cn('text-base font-medium mt-2', isLight ? 'text-slate-400' : 'text-slate-400')}>{dateStr}</p>
    </div>
  )
})

// ─── Weather icon ─────────────────────────────────────────────────────────────
const WeatherIcon = memo(function WeatherIcon({ code }) {
  if (code <= 1) return <Sun className="w-10 h-10 text-yellow-400" />
  if (code <= 3) return <Cloud className="w-10 h-10 text-slate-400" />
  return <CloudRain className="w-10 h-10 text-blue-400" />
})

// ─── Habit row ────────────────────────────────────────────────────────────────
const HabitRow = memo(function HabitRow({ id, label, icon, checked, onToggle, isLight, isLast }) {
  return (
    <motion.button
      onClick={() => onToggle(id)}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={cn(
        'w-full flex items-center gap-3.5 px-5 py-4 text-left cursor-pointer',
        !isLast && (isLight ? 'border-b border-slate-100' : 'border-b border-white/6')
      )}
    >
      {/* Animated check circle */}
      <motion.span
        animate={checked ? { scale: [1, 1.25, 1], backgroundColor: '#3b82f6' } : { scale: 1, backgroundColor: 'transparent' }}
        transition={{ type: 'spring', stiffness: 500, damping: 20 }}
        className={cn(
          'w-5 h-5 rounded-full shrink-0 flex items-center justify-center',
          !checked && (isLight ? 'border-[1.5px] border-slate-300' : 'border-[1.5px] border-white/25')
        )}
      >
        <AnimatePresence>
          {checked && (
            <motion.svg
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 600, damping: 20 }}
              className="w-2.5 h-2.5 text-white"
              viewBox="0 0 10 10"
              fill="none"
            >
              <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </motion.svg>
          )}
        </AnimatePresence>
      </motion.span>
      <span className="text-lg shrink-0 leading-none">{getEmoji(icon)}</span>
      <span className={cn('text-[17px] font-medium flex-1 leading-snug',
        checked
          ? isLight ? 'line-through text-slate-300' : 'line-through text-white/30'
          : isLight ? 'text-slate-800' : 'text-white/90'
      )}>{label}</span>
    </motion.button>
  )
})

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(undefined)
  const [habits, setHabits] = useState([])
  const [checked, setChecked] = useState({})
  const [weekLog, setWeekLog] = useState([])
  const [weather, setWeather] = useState(null)
  const [streak, setStreak] = useState(0)
  const [tab, setTab] = useState('today') // today | week
  const [showManager, setShowManager] = useState(false)
  const [showPrefs, setShowPrefs] = useState(false)
  const [prefs, setPrefs] = useState(() => {
    try {
      const cached = localStorage.getItem('morning-prefs')
      if (cached) return { name: '', widget_quote: true, widget_weather: true, widget_streak: true, ...JSON.parse(cached) }
    } catch {}
    return { name: '', theme: 'dark', widget_quote: true, widget_weather: true, widget_streak: true }
  })

  const quote = useMemo(() => QUOTES[new Date().getDay() % QUOTES.length], [])
  const done = useMemo(() => Object.values(checked).filter(Boolean).length, [checked])
  const isLight = prefs.theme === 'light'

  // Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  // Load user prefs
  useEffect(() => {
    if (!session) return
    supabase.from('user_prefs').select('*').eq('user_id', session.user.id).single()
      .then(({ data }) => {
        if (data) {
          setPrefs(data)
          localStorage.setItem('morning-prefs', JSON.stringify(data))
        }
      })
  }, [session])

  // Load habits from DB, seed defaults on first login
  useEffect(() => {
    if (!session) return
    const load = async () => {
      const { data } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', session.user.id)
        .order('position')

      if (data && data.length === 0) {
        // Seed defaults for new user
        await supabase.from('habits').insert(
          DEFAULT_HABITS.map(h => ({ ...h, user_id: session.user.id }))
        )
        const { data: seeded } = await supabase
          .from('habits').select('*').eq('user_id', session.user.id).order('position')
        setHabits(seeded ?? [])
      } else {
        setHabits(data ?? [])
      }
    }
    load()

    const channel = supabase.channel('habits-def')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'habits', filter: `user_id=eq.${session.user.id}` },
        () => load())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [session])

  // Load today's completions + last 7 days log + realtime
  useEffect(() => {
    if (!session) return

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
    const fromDate = sevenDaysAgo.toISOString().slice(0, 10)

    const load = async () => {
      const { data } = await supabase
        .from('habits_log')
        .select('habit_id, date')
        .eq('user_id', session.user.id)
        .gte('date', fromDate)
        .order('date', { ascending: false })

      setWeekLog(data ?? [])
      const map = {}
      data?.filter(r => r.date === today()).forEach(r => { map[r.habit_id] = true })
      setChecked(map)
    }

    load()

    const channel = supabase.channel('habits-log-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'habits_log', filter: `user_id=eq.${session.user.id}` },
        () => load())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [session])

  // Streak (on session only)
  useEffect(() => {
    if (!session) return
    supabase.from('habits_log').select('date').eq('user_id', session.user.id)
      .order('date', { ascending: false })
      .then(({ data }) => {
        if (!data?.length) return setStreak(0)
        const dates = [...new Set(data.map(r => r.date))].sort().reverse()
        let count = 0
        let cursor = new Date()
        for (const d of dates) {
          const diff = Math.round((cursor - new Date(d)) / 86400000)
          if (diff > 1) break
          count++
          cursor = new Date(d)
        }
        setStreak(count)
      })
  }, [session])

  // Weather
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(({ coords }) => {
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&current=temperature_2m,weathercode,windspeed_10m,relativehumidity_2m`)
        .then(r => r.json()).then(d => setWeather(d.current)).catch(() => {})
    })
  }, [])

  const savePrefs = useCallback(async (newPrefs) => {
    setPrefs(newPrefs)
    localStorage.setItem('morning-prefs', JSON.stringify(newPrefs))
    await supabase.from('user_prefs').upsert({ ...newPrefs, user_id: session.user.id })
  }, [session])

  // Optimistic toggle
  const toggle = useCallback(async (id) => {
    if (!session) return
    const wasChecked = !!checked[id]
    setChecked(prev => ({ ...prev, [id]: !wasChecked }))
    if (wasChecked) {
      const { error } = await supabase.from('habits_log').delete()
        .eq('user_id', session.user.id).eq('habit_id', id).eq('date', today())
      if (error) setChecked(prev => ({ ...prev, [id]: true }))
    } else {
      const { error } = await supabase.from('habits_log').upsert({ user_id: session.user.id, habit_id: id, date: today() })
      if (error) setChecked(prev => ({ ...prev, [id]: false }))
    }
  }, [session, checked])

  if (session === undefined) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!session) return <Auth />

  const cardCls = isLight
    ? 'bg-white/90 border-0 shadow-sm backdrop-blur-xl'
    : 'bg-white/8 border-0 shadow-none backdrop-blur-xl ring-1 ring-white/10'
  const textPrimary = isLight ? 'text-slate-900' : 'text-white'
  const textSecondary = isLight ? 'text-slate-400' : 'text-slate-400'
  const segmentBg = isLight ? 'bg-slate-100' : 'bg-white/8'
  const segmentActive = isLight ? 'bg-white shadow-sm text-slate-900' : 'bg-white/15 text-white'
  const segmentInactive = isLight ? 'text-slate-500' : 'text-slate-400'

  return (
    <div className={cn(
      'min-h-screen px-4 py-3 md:px-8 md:py-6',
      isLight
        ? 'bg-gradient-to-b from-slate-50 to-blue-50/60'
        : 'bg-gradient-to-b from-[#0a0a0f] via-[#0d0d18] to-[#0a0a14]'
    )}>
      {showManager && (
        <HabitsManager habits={habits} userId={session.user.id} onClose={() => setShowManager(false)} isLight={isLight} />
      )}
      {showPrefs && (
        <PrefsManager prefs={prefs} onSave={savePrefs} onClose={() => setShowPrefs(false)} />
      )}

      <div className="max-w-lg mx-auto space-y-5">

        {/* Top bar */}
        <div className="flex justify-end gap-4 pt-1">
          <button onClick={() => setShowPrefs(true)} className={cn('flex items-center gap-1.5 text-xs font-medium cursor-pointer', isLight ? 'text-slate-400 hover:text-slate-600' : 'text-slate-500 hover:text-slate-300')}>
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Personalize
          </button>
          <button onClick={() => supabase.auth.signOut()} className={cn('flex items-center gap-1.5 text-xs font-medium cursor-pointer', isLight ? 'text-slate-400 hover:text-slate-600' : 'text-slate-500 hover:text-slate-300')}>
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>

        {/* Clock */}
        <Clock name={prefs.name} isLight={isLight} />

        {/* Quote */}
        {prefs.widget_quote && (
          <div className="px-2">
            <p className={cn('text-center text-sm leading-relaxed', isLight ? 'text-slate-400' : 'text-slate-500')}>
              <span className={cn('text-2xl leading-none align-bottom mr-0.5 font-serif', isLight ? 'text-blue-300' : 'text-blue-700')}>"</span>
              {quote}
              <span className={cn('text-2xl leading-none align-bottom ml-0.5 font-serif', isLight ? 'text-blue-300' : 'text-blue-700')}>"</span>
            </p>
          </div>
        )}

        {/* Habits card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28, delay: 0.1 }}
          className={cn('rounded-3xl overflow-hidden', isLight ? 'bg-white shadow-sm' : 'bg-white/8 ring-1 ring-white/10')}>
          {/* Card top bar */}
          <div className={cn('flex items-center justify-between px-4 pt-4 pb-3', isLight ? 'border-b border-slate-100' : 'border-b border-white/5')}>
            {/* iOS segmented control */}
            <div className={cn('flex gap-0.5 p-1 rounded-xl', segmentBg)}>
              <button
                onClick={() => setTab('today')}
                className={cn('px-3.5 py-1.5 rounded-lg text-[15px] font-semibold transition-all cursor-pointer', tab === 'today' ? segmentActive : segmentInactive)}
              >
                Today
              </button>
              <button
                onClick={() => setTab('week')}
                className={cn('flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-[15px] font-semibold transition-all cursor-pointer', tab === 'week' ? segmentActive : segmentInactive)}
              >
                <BarChart2 className="w-3 h-3" />
                Week
              </button>
            </div>
            <button onClick={() => setShowManager(true)} className={cn('text-[15px] font-semibold cursor-pointer', isLight ? 'text-blue-500 hover:text-blue-700' : 'text-blue-400 hover:text-blue-300')}>
              Edit
            </button>
          </div>

          {tab === 'today' && (
            <>
              {/* Progress header */}
              <div className="px-5 pt-3 pb-1">
                <div className="flex items-center justify-between mb-2.5">
                  <span className={cn('text-sm font-medium', isLight ? 'text-slate-400' : 'text-white/40')}>
                    {done < habits.length ? `${habits.length - done} remaining` : 'All done'}
                  </span>
                  <span className={cn('text-sm font-semibold tabular-nums', isLight ? 'text-slate-500' : 'text-white/50')}>{done}/{habits.length}</span>
                </div>
                <div className={cn('w-full rounded-full', isLight ? 'bg-slate-100' : 'bg-white/8')} style={{ height: '2px' }}>
                  <div
                    className={cn('h-full rounded-full transition-all duration-500', done === habits.length ? 'bg-emerald-400' : 'bg-blue-500')}
                    style={{ width: habits.length ? `${(done / habits.length) * 100}%` : '0%' }}
                  />
                </div>
              </div>

              {/* Habit list */}
              {habits.length === 0 ? (
                <p className={cn('text-sm text-center py-8', textSecondary)}>
                  No habits yet.{' '}
                  <button onClick={() => setShowManager(true)} className="text-blue-500 cursor-pointer font-medium">Add some</button>
                </p>
              ) : (
                <div className="pb-1">
                  {habits.map((h, i) => (
                    <motion.div
                      key={h.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04, type: 'spring', stiffness: 400, damping: 30 }}
                    >
                      <HabitRow id={h.id} label={h.label} icon={h.icon} checked={!!checked[h.id]} onToggle={toggle} isLight={isLight} isLast={i === habits.length - 1} />
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          )}

          {tab === 'week' && (
            <div className="px-4 pt-3 pb-4">
              <WeeklyView habits={habits} log={weekLog} isLight={isLight} />
            </div>
          )}
        </motion.div>

        {/* Side widgets */}
        <div className="grid grid-cols-2 gap-3">
          {prefs.widget_weather && (
            <div className={cn('rounded-3xl p-4', isLight ? 'bg-white shadow-sm' : 'bg-white/8 ring-1 ring-white/10')}>
              <p className={cn('text-xs font-semibold uppercase tracking-wider mb-3', textSecondary)}>Weather</p>
              {weather ? (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <WeatherIcon code={weather.weathercode} />
                    <span className={cn('text-3xl font-bold tabular-nums', textPrimary)}>{Math.round(weather.temperature_2m)}°</span>
                  </div>
                  <div className="space-y-1">
                    <div className={cn('flex items-center gap-1.5 text-xs', textSecondary)}>
                      <Wind className="w-3 h-3" /><span>{Math.round(weather.windspeed_10m)} km/h</span>
                    </div>
                    <div className={cn('flex items-center gap-1.5 text-xs', textSecondary)}>
                      <Droplets className="w-3 h-3" /><span>{weather.relativehumidity_2m}% humidity</span>
                    </div>
                  </div>
                </>
              ) : (
                <p className={cn('text-xs', textSecondary)}>Allow location access</p>
              )}
            </div>
          )}

          {prefs.widget_streak && (
            <div className={cn('rounded-3xl p-4 flex flex-col items-center justify-center text-center', isLight ? 'bg-white shadow-sm' : 'bg-white/8 ring-1 ring-white/10')}>
              <p className={cn('text-xs font-semibold uppercase tracking-wider mb-3', textSecondary)}>Streak</p>
              <Flame className="w-7 h-7 text-orange-400 mb-1" />
              <span className={cn('text-3xl font-bold tabular-nums', textPrimary)}>{streak}</span>
              <span className={cn('text-xs mt-0.5', textSecondary)}>days</span>
            </div>
          )}
        </div>

        {/* All done banner */}
        <AnimatePresence>
          {tab === 'today' && done === habits.length && habits.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className={cn('rounded-3xl px-5 py-4 text-center', isLight ? 'bg-emerald-50 border border-emerald-100' : 'bg-emerald-500/10 ring-1 ring-emerald-500/20')}
            >
              <p className={cn('font-medium text-sm', isLight ? 'text-emerald-700' : 'text-emerald-400')}>All done — great start to the day 🎉</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Email footer */}
        <p className={cn('text-center text-xs pb-2', isLight ? 'text-slate-300' : 'text-slate-600')}>{session.user.email}</p>
      </div>
    </div>
  )
}
