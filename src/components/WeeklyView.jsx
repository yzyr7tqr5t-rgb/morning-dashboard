import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { getEmoji } from './HabitsManager'

function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

export default function WeeklyView({ habits, log, isLight }) {
  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = daysAgo(6 - i)
      const label = i === 6
        ? 'Today'
        : new Date(date + 'T12:00:00').toLocaleDateString([], { weekday: 'short' })
      const completed = log.filter(r => r.date === date).length
      const total = habits.length
      const pct = total ? Math.round((completed / total) * 100) : 0
      return { date, label, completed, total, pct }
    })
  }, [habits, log])

  const habitMap = useMemo(() => {
    const m = {}
    log.forEach(r => {
      if (!m[r.date]) m[r.date] = new Set()
      m[r.date].add(r.habit_id)
    })
    return m
  }, [log])

  return (
    <div className="space-y-6">
      {/* Bar chart */}
      <div>
        <h3 className={cn('text-xs font-medium uppercase tracking-wider mb-3', isLight ? 'text-slate-500' : 'text-slate-400')}>7-day completion</h3>
        <div className="flex items-end gap-2 h-24">
          {days.map(({ date, label, pct, completed, total }) => (
            <div key={date} className="flex-1 flex flex-col items-center gap-1">
              <span className={cn('text-xs', isLight ? 'text-slate-400' : 'text-slate-500')}>{completed}/{total}</span>
              <div className={cn('w-full rounded-t-md relative', isLight ? 'bg-slate-200' : 'bg-slate-800')} style={{ height: '56px' }}>
                <div
                  className={cn(
                    'absolute bottom-0 left-0 right-0 rounded-t-md transition-all duration-500',
                    pct === 100 ? 'bg-gradient-to-t from-indigo-600 to-violet-500' :
                    pct >= 60 ? 'bg-indigo-500/70' :
                    pct > 0 ? (isLight ? 'bg-slate-400' : 'bg-slate-600') :
                    (isLight ? 'bg-slate-200' : 'bg-slate-800')
                  )}
                  style={{ height: `${Math.max(pct, pct > 0 ? 8 : 0)}%` }}
                />
              </div>
              <span className={cn('text-xs', label === 'Today' ? (isLight ? 'text-indigo-600 font-medium' : 'text-indigo-300 font-medium') : (isLight ? 'text-slate-400' : 'text-slate-500'))}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* History list */}
      <div>
        <h3 className={cn('text-xs font-medium uppercase tracking-wider mb-3', isLight ? 'text-slate-500' : 'text-slate-400')}>History</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {[...days].reverse().map(({ date, label, completed, total }) => {
            const done = habitMap[date] ?? new Set()
            return (
              <div key={date} className={cn('rounded-xl px-4 py-3 border', isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/50 border-slate-700/50')}>
                <div className="flex items-center justify-between mb-2">
                  <span className={cn('text-sm font-medium',
                    label === 'Today'
                      ? (isLight ? 'text-indigo-600' : 'text-indigo-300')
                      : (isLight ? 'text-slate-700' : 'text-slate-300')
                  )}>
                    {label === 'Today' ? 'Today' : new Date(date + 'T12:00:00').toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
                  </span>
                  <span className={cn('text-xs', isLight ? 'text-slate-400' : 'text-slate-500')}>{completed}/{total}</span>
                </div>
                {habits.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {habits.map(h => (
                      <span
                        key={h.id}
                        className={cn(
                          'text-xs px-2 py-0.5 rounded-full border flex items-center gap-1',
                          done.has(h.id)
                            ? (isLight ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-700' : 'bg-indigo-500/20 border-indigo-500/40 text-indigo-200')
                            : (isLight ? 'bg-slate-100 border-slate-200 text-slate-400' : 'bg-slate-700/30 border-slate-600/30 text-slate-500')
                        )}
                      >
                        {getEmoji(h.icon)} {h.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
