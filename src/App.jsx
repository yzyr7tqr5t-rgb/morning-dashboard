import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { Sun, Cloud, CloudRain, Wind, Droplets, CheckCircle2, Circle, Flame, Moon, LogOut, Settings, BarChart2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import Auth from '@/components/Auth'
import HabitsManager, { getEmoji } from '@/components/HabitsManager'
import WeeklyView from '@/components/WeeklyView'

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
const Clock = memo(function Clock() {
  const [time, setTime] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  const hours = time.getHours()
  const greeting = hours < 12 ? 'Good morning' : hours < 17 ? 'Good afternoon' : 'Good evening'
  const GreetIcon = hours < 17 ? Sun : Moon
  const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const dateStr = time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })
  return (
    <div className="text-center space-y-1 py-4">
      <div className="flex items-center justify-center gap-2 text-indigo-300 mb-2">
        <GreetIcon className="w-5 h-5" />
        <span className="text-sm font-medium tracking-widest uppercase">{greeting}</span>
      </div>
      <h1 className="text-6xl font-bold text-white tabular-nums tracking-tight">{timeStr}</h1>
      <p className="text-slate-400 text-lg">{dateStr}</p>
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
const HabitRow = memo(function HabitRow({ id, label, icon, checked, onToggle }) {
  return (
    <button
      onClick={() => onToggle(id)}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left cursor-pointer',
        checked
          ? 'bg-indigo-500/20 border border-indigo-500/40 text-indigo-200'
          : 'bg-slate-800/50 border border-slate-700/50 text-slate-300 hover:bg-slate-800'
      )}
    >
      {checked
        ? <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />
        : <Circle className="w-5 h-5 text-slate-500 shrink-0" />
      }
      <span className="text-base shrink-0">{getEmoji(icon)}</span>
      <span className={cn('text-sm font-medium', checked && 'line-through opacity-60')}>{label}</span>
    </button>
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

  const quote = useMemo(() => QUOTES[new Date().getDay() % QUOTES.length], [])
  const done = useMemo(() => Object.values(checked).filter(Boolean).length, [checked])

  // Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!session) return <Auth />

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4 md:p-8">
      {showManager && (
        <HabitsManager
          habits={habits}
          userId={session.user.id}
          onClose={() => setShowManager(false)}
        />
      )}

      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="relative">
          <Clock />
          <button
            onClick={() => supabase.auth.signOut()}
            className="absolute right-0 top-4 flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-xs transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>

        {/* Quote */}
        <Card className="bg-indigo-950/60 border-indigo-800/50 backdrop-blur-sm">
          <CardContent className="py-5 px-6">
            <p className="text-indigo-200 text-center italic text-base">"{quote}"</p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Habits panel */}
          <Card className="md:col-span-2 bg-slate-900/60 border-slate-700/50 backdrop-blur-sm">
            {/* Tabs */}
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between mb-3">
                <div className="flex gap-1 bg-slate-800/60 p-1 rounded-xl">
                  <button
                    onClick={() => setTab('today')}
                    className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer',
                      tab === 'today' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200')}
                  >
                    Today
                  </button>
                  <button
                    onClick={() => setTab('week')}
                    className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer',
                      tab === 'week' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200')}
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                    Week
                  </button>
                </div>
                <button
                  onClick={() => setShowManager(true)}
                  className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 text-xs transition-colors cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5" />
                  Manage
                </button>
              </div>

              {tab === 'today' && (
                <>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">Morning Habits</CardTitle>
                    <span className="text-sm text-slate-400">{done}/{habits.length} done</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-violet-500 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: habits.length ? `${(done / habits.length) * 100}%` : '0%' }}
                    />
                  </div>
                </>
              )}
              {tab === 'week' && <CardTitle className="text-white">Weekly Overview</CardTitle>}
            </CardHeader>

            <CardContent className="space-y-2 mt-3">
              {tab === 'today' && (
                habits.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-6">
                    No habits yet.{' '}
                    <button onClick={() => setShowManager(true)} className="text-indigo-400 hover:text-indigo-300 cursor-pointer underline">Add some →</button>
                  </p>
                ) : (
                  habits.map(h => (
                    <HabitRow key={h.id} id={h.id} label={h.label} icon={h.icon} checked={!!checked[h.id]} onToggle={toggle} />
                  ))
                )
              )}
              {tab === 'week' && (
                <WeeklyView habits={habits} log={weekLog} />
              )}
            </CardContent>
          </Card>

          {/* Side column */}
          <div className="space-y-4">
            {/* Weather */}
            <Card className="bg-slate-900/60 border-slate-700/50 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-base">Weather</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {weather ? (
                  <>
                    <div className="flex items-center gap-3">
                      <WeatherIcon code={weather.weathercode} />
                      <span className="text-4xl font-bold text-white">{Math.round(weather.temperature_2m)}°</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                        <Wind className="w-3.5 h-3.5" />
                        <span>{Math.round(weather.windspeed_10m)} km/h</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                        <Droplets className="w-3.5 h-3.5" />
                        <span>{weather.relativehumidity_2m}%</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-slate-500 text-sm">Allow location for weather…</p>
                )}
              </CardContent>
            </Card>

            {/* Streak */}
            <Card className="bg-slate-900/60 border-slate-700/50 backdrop-blur-sm">
              <CardContent className="py-5 text-center space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <Flame className="w-6 h-6 text-orange-400" />
                  <span className="text-3xl font-bold text-white">{streak}</span>
                </div>
                <p className="text-slate-400 text-sm">day streak</p>
                <p className="text-slate-500 text-xs">{session.user.email}</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {tab === 'today' && done === habits.length && habits.length > 0 && (
          <Card className="bg-gradient-to-r from-indigo-500/20 to-violet-500/20 border-indigo-500/40 backdrop-blur-sm">
            <CardContent className="py-4 text-center">
              <p className="text-indigo-200 font-medium">All habits complete — amazing start to the day! 🎉</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
