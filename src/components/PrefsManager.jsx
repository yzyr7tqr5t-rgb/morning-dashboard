import { useState } from 'react'
import { X, User, Palette, LayoutDashboard } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function PrefsManager({ prefs, onSave, onClose }) {
  const [form, setForm] = useState({ ...prefs })

  function toggle(field) {
    setForm(f => ({ ...f, [field]: !f[field] }))
  }

  async function handleSave() {
    await onSave(form)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className={cn(
        'w-full max-w-sm rounded-2xl border shadow-2xl',
        form.theme === 'light'
          ? 'bg-white border-slate-200'
          : 'bg-slate-900 border-slate-700'
      )}>
        {/* Header */}
        <div className={cn('flex items-center justify-between px-5 py-4 border-b',
          form.theme === 'light' ? 'border-slate-200' : 'border-slate-700/60')}>
          <h2 className={cn('font-semibold text-base', form.theme === 'light' ? 'text-slate-900' : 'text-white')}>
            Personalization
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-300 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-5">
          {/* Name */}
          <div className="space-y-1.5">
            <label className={cn('flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider',
              form.theme === 'light' ? 'text-slate-500' : 'text-slate-400')}>
              <User className="w-3.5 h-3.5" /> Your name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Luc"
              className={cn(
                'w-full rounded-lg px-3 py-2 text-sm border outline-none focus:ring-2 focus:ring-indigo-500/50',
                form.theme === 'light'
                  ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
                  : 'bg-slate-800 border-slate-600 text-white placeholder:text-slate-500'
              )}
            />
          </div>

          {/* Theme */}
          <div className="space-y-1.5">
            <label className={cn('flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider',
              form.theme === 'light' ? 'text-slate-500' : 'text-slate-400')}>
              <Palette className="w-3.5 h-3.5" /> Theme
            </label>
            <div className={cn('flex gap-1 p-1 rounded-xl', form.theme === 'light' ? 'bg-slate-100' : 'bg-slate-800')}>
              {['dark', 'light'].map(t => (
                <button
                  key={t}
                  onClick={() => setForm(f => ({ ...f, theme: t }))}
                  className={cn(
                    'flex-1 py-1.5 rounded-lg text-sm font-medium capitalize transition-all cursor-pointer',
                    form.theme === t
                      ? 'bg-indigo-600 text-white'
                      : form.theme === 'light' ? 'text-slate-500 hover:text-slate-700' : 'text-slate-400 hover:text-slate-200'
                  )}
                >
                  {t === 'dark' ? '🌙 Dark' : '☀️ Light'}
                </button>
              ))}
            </div>
          </div>

          {/* Widgets */}
          <div className="space-y-1.5">
            <label className={cn('flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider',
              form.theme === 'light' ? 'text-slate-500' : 'text-slate-400')}>
              <LayoutDashboard className="w-3.5 h-3.5" /> Widgets
            </label>
            <div className="space-y-2">
              {[
                { key: 'widget_quote', label: 'Daily quote' },
                { key: 'widget_weather', label: 'Weather' },
                { key: 'widget_streak', label: 'Streak' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center justify-between cursor-pointer group">
                  <span className={cn('text-sm', form.theme === 'light' ? 'text-slate-700' : 'text-slate-300')}>{label}</span>
                  <button
                    role="switch"
                    aria-checked={form[key]}
                    onClick={() => toggle(key)}
                    className={cn(
                      'relative w-10 h-5.5 rounded-full transition-colors cursor-pointer',
                      form[key] ? 'bg-indigo-600' : form.theme === 'light' ? 'bg-slate-200' : 'bg-slate-700'
                    )}
                  >
                    <span className={cn(
                      'absolute top-0.5 left-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-transform',
                      form[key] ? 'translate-x-4.5' : 'translate-x-0'
                    )} />
                  </button>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={cn('px-5 py-4 border-t flex gap-2', form.theme === 'light' ? 'border-slate-200' : 'border-slate-700/60')}>
          <button
            onClick={onClose}
            className={cn('flex-1 py-2 rounded-xl text-sm font-medium cursor-pointer transition-colors',
              form.theme === 'light' ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-slate-800 text-slate-300 hover:bg-slate-700')}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
