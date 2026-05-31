import { useState } from 'react'
import { motion } from 'framer-motion'
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
      style={{ display: 'flex', alignItems: window.innerWidth >= 768 ? 'center' : 'flex-end', justifyContent: 'center', padding: window.innerWidth >= 768 ? '1rem' : '0' }}
    >
      <motion.div
        initial={window.innerWidth >= 768 ? { opacity: 0, scale: 0.95 } : { y: '100%' }}
        animate={window.innerWidth >= 768 ? { opacity: 1, scale: 1 } : { y: 0 }}
        exit={window.innerWidth >= 768 ? { opacity: 0, scale: 0.95 } : { y: '100%' }}
        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
        className={cn(
        'w-full shadow-2xl',
        window.innerWidth >= 768 ? 'max-w-sm rounded-2xl border' : 'rounded-t-3xl',
        form.theme === 'light'
          ? 'bg-white border-slate-200'
          : 'bg-slate-900 border-slate-700'
      )}>
        {/* Handle — mobile only */}
        {window.innerWidth < 768 && (
          <div className="flex justify-center pt-3 pb-1">
            <div className={cn('w-9 h-1 rounded-full', form.theme === 'light' ? 'bg-slate-200' : 'bg-white/20')} />
          </div>
        )}

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
                'w-full rounded-lg px-3 py-2 text-sm border outline-none focus:ring-2 focus:ring-blue-500/50',
                form.theme === 'light'
                  ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
                  : 'bg-slate-800 border-slate-600 text-white placeholder:text-slate-500'
              )}
            />
          </div>

          {/* Theme */}
          <div className="flex items-center justify-between">
            <label className={cn('flex items-center gap-2 text-sm font-medium cursor-pointer',
              form.theme === 'light' ? 'text-slate-700' : 'text-slate-300')}
              onClick={() => setForm(f => ({ ...f, theme: f.theme === 'light' ? 'dark' : 'light' }))}>
              <span>{form.theme === 'light' ? '☀️' : '🌙'}</span>
              {form.theme === 'light' ? 'Light mode' : 'Dark mode'}
            </label>
            <button
              role="switch"
              aria-checked={form.theme === 'light'}
              onClick={() => setForm(f => ({ ...f, theme: f.theme === 'light' ? 'dark' : 'light' }))}
              className={cn(
                'relative w-12 h-7 rounded-full transition-colors duration-200 cursor-pointer shrink-0',
                form.theme === 'light' ? 'bg-blue-500' : 'bg-slate-600'
              )}
            >
              <motion.span
                layout
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className={cn(
                  'absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm',
                  form.theme === 'light' ? 'left-6' : 'left-1'
                )}
              />
            </button>
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
                      form[key] ? 'bg-blue-600' : form.theme === 'light' ? 'bg-slate-200' : 'bg-slate-700'
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
            className="flex-1 py-2 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white cursor-pointer transition-colors"
          >
            Save
          </button>
        </div>
        {window.innerWidth < 768 && <div className="h-4" />}
      </motion.div>
    </motion.div>
  )
}
