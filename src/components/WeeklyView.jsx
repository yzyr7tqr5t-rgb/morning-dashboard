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

  const secondary = isLight ? 'text-slate-400' : 'text-white/40'
  const sectionLabel = cn('text-xs font-medium mb-3', secondary)

  return (
    <div className="space-y-5">
      {/* Bar chart */}
      <div>
        <p className={sectionLabel}>Last 7 days</p>
        <div className="flex items-end gap-1.5" style={{ height: '72px' }}>
          {days.map(({ date, label, pct, completed, total }) => (
            <div key={date} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={cn('w-full rounded-lg relative', isLight ? 'bg-slate-100' : 'bg-white/8')}
                style={{ height: '48px' }}
              >
                <div
                  className={cn(
                    'absolute bottom-0 left-0 right-0 rounded-lg transition-all duration-500',
                    pct === 100 ? 'bg-indigo-500' :
                    pct >= 60  ? 'bg-indigo-400/70' :
                    pct > 0    ? (isLight ? 'bg-slate-300' : 'bg-white/20') :
                                 'bg-transparent'
                  )}
                  style={{ height: `${Math.max(pct, pct > 0 ? 15 : 0)}%` }}
                />
              </div>
              <span className={cn('text-[10px] font-medium',
                label === 'Today'
                  ? (isLight ? 'text-indigo-500' : 'text-indigo-400')
                  : secondary
              )}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* History list — iOS grouped style */}
      <div>
        <p className={sectionLabel}>History</p>
        <div className={cn('rounded-2xl overflow-hidden max-h-72 overflow-y-auto', isLight ? 'bg-slate-50' : 'bg-white/5')}>
          {[...days].reverse().map(({ date, label, completed, total }, i, arr) => {
            const done = habitMap[date] ?? new Set()
            const isToday = label === 'Today'
            const isLast = i === arr.length - 1
            return (
              <div
                key={date}
                className={cn('px-4 py-3', !isLast && (isLight ? 'border-b border-slate-100' : 'border-b border-white/5'))}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={cn('text-sm font-medium',
                    isToday
                      ? (isLight ? 'text-indigo-600' : 'text-indigo-400')
                      : (isLight ? 'text-slate-700' : 'text-white/80')
                  )}>
                    {isToday ? 'Today' : new Date(date + 'T12:00:00').toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
                  </span>
                  <span className={cn('text-xs tabular-nums', secondary)}>{completed}/{total}</span>
                </div>
                {habits.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {habits.map(h => (
                      <span
                        key={h.id}
                        className={cn(
                          'text-[11px] px-2 py-0.5 rounded-full flex items-center gap-0.5',
                          done.has(h.id)
                            ? (isLight ? 'bg-indigo-100 text-indigo-600' : 'bg-indigo-500/20 text-indigo-300')
                            : (isLight ? 'text-slate-300' : 'text-white/20')
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
