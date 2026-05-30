import { useState, useEffect } from 'react'
import { Sun, Cloud, CloudRain, Wind, Droplets, CheckCircle2, Circle, Coffee, BookOpen, Dumbbell, Apple, Smile, Flame, Moon, LogOut } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import Auth from '@/components/Auth'

const HABITS = [
  { id: 1, label: 'Morning coffee', icon: Coffee },
  { id: 2, label: 'Read 10 pages', icon: BookOpen },
  { id: 3, label: 'Exercise', icon: Dumbbell },
  { id: 4, label: 'Healthy breakfast', icon: Apple },
  { id: 5, label: 'Gratitude journal', icon: Smile },
]

const QUOTES = [
  "The morning is wiser than the evening.",
  "Each morning we are born again.",
  "Win the morning, win the day.",
  "Rise up, start fresh, see the bright opportunity in each new day.",
  "Your future is created by what you do today, not tomorrow.",
]

function useTime() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return time
}

function WeatherIcon({ code }) {
  if (code <= 1) return <Sun className="w-10 h-10 text-yellow-400" />
  if (code <= 3) return <Cloud className="w-10 h-10 text-slate-400" />
  return <CloudRain className="w-10 h-10 text-blue-400" />
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

export default function App() {
  const now = useTime()
  const [session, setSession] = useState(undefined)
  const [checked, setChecked] = useState({})
  const [weather, setWeather] = useState(null)
  const [streak, setStreak] = useState(0)

  const quote = QUOTES[now.getDay() % QUOTES.length]
  const hours = now.getHours()
  const greeting = hours < 12 ? 'Good morning' : hours < 17 ? 'Good afternoon' : 'Good evening'
  const GreetIcon = hours < 17 ? Sun : Moon
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const dateStr = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })
  const done = Object.values(checked).filter(Boolean).length

  // Auth state
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  // Load today's habits + realtime sync
  useEffect(() => {
    if (!session) return

    const load = async () => {
      const { data } = await supabase
        .from('habits_log')
        .select('habit_id')
        .eq('date', today())
        .eq('user_id', session.user.id)

      const map = {}
      data?.forEach(r => { map[r.habit_id] = true })
      setChecked(map)
    }

    load()

    const channel = supabase
      .channel('habits-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'habits_log',
        filter: `user_id=eq.${session.user.id}`,
      }, () => load())
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [session])

  // Compute streak
  useEffect(() => {
    if (!session) return
    supabase
      .from('habits_log')
      .select('date')
      .eq('user_id', session.user.id)
      .order('date', { ascending: false })
      .then(({ data }) => {
        if (!data?.length) return
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
  }, [session, checked])

  // Weather
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(({ coords }) => {
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&current=temperature_2m,weathercode,windspeed_10m,relativehumidity_2m`)
        .then(r => r.json())
        .then(d => setWeather(d.current))
        .catch(() => {})
    })
  }, [])

  const toggle = async (id) => {
    if (!session) return
    if (checked[id]) {
      await supabase.from('habits_log').delete()
        .eq('user_id', session.user.id)
        .eq('habit_id', id)
        .eq('date', today())
    } else {
      await supabase.from('habits_log').upsert({
        user_id: session.user.id,
        habit_id: id,
        date: today(),
      })
    }
  }

  if (session === undefined) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!session) return <Auth />

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="text-center space-y-1 py-4 relative">
          <button
            onClick={() => supabase.auth.signOut()}
            className="absolute right-0 top-4 flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-xs transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
          <div className="flex items-center justify-center gap-2 text-indigo-300 mb-2">
            <GreetIcon className="w-5 h-5" />
            <span className="text-sm font-medium tracking-widest uppercase">{greeting}</span>
          </div>
          <h1 className="text-6xl font-bold text-white tabular-nums tracking-tight">{timeStr}</h1>
          <p className="text-slate-400 text-lg">{dateStr}</p>
        </div>

        {/* Quote */}
        <Card className="bg-indigo-950/60 border-indigo-800/50 backdrop-blur-sm">
          <CardContent className="py-5 px-6">
            <p className="text-indigo-200 text-center italic text-base">"{quote}"</p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Habits */}
          <Card className="md:col-span-2 bg-slate-900/60 border-slate-700/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Morning Habits</CardTitle>
                <span className="text-sm text-slate-400">{done}/{HABITS.length} done</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-violet-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${(done / HABITS.length) * 100}%` }}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {HABITS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => toggle(id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left cursor-pointer',
                    checked[id]
                      ? 'bg-indigo-500/20 border border-indigo-500/40 text-indigo-200'
                      : 'bg-slate-800/50 border border-slate-700/50 text-slate-300 hover:bg-slate-800'
                  )}
                >
                  {checked[id]
                    ? <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />
                    : <Circle className="w-5 h-5 text-slate-500 shrink-0" />
                  }
                  <Icon className="w-4 h-4 shrink-0 opacity-60" />
                  <span className={cn('text-sm font-medium', checked[id] && 'line-through opacity-60')}>{label}</span>
                </button>
              ))}
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

        {done === HABITS.length && (
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
