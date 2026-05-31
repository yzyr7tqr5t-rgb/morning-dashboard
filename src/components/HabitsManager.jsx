import { useState } from 'react'
import { Plus, Trash2, GripVertical, X, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

const ICON_OPTIONS = [
  { value: 'coffee', emoji: '☕' },
  { value: 'book', emoji: '📖' },
  { value: 'dumbbell', emoji: '💪' },
  { value: 'apple', emoji: '🍎' },
  { value: 'smile', emoji: '😊' },
  { value: 'sun', emoji: '🌅' },
  { value: 'moon', emoji: '🌙' },
  { value: 'water', emoji: '💧' },
  { value: 'walk', emoji: '🚶' },
  { value: 'meditate', emoji: '🧘' },
  { value: 'music', emoji: '🎵' },
  { value: 'write', emoji: '✍️' },
]

export function getEmoji(icon) {
  return ICON_OPTIONS.find(o => o.value === icon)?.emoji ?? '✅'
}

export default function HabitsManager({ habits, userId, onClose }) {
  const [newLabel, setNewLabel] = useState('')
  const [newIcon, setNewIcon] = useState('coffee')
  const [editingId, setEditingId] = useState(null)
  const [editLabel, setEditLabel] = useState('')
  const [loading, setLoading] = useState(false)

  const add = async (e) => {
    e.preventDefault()
    if (!newLabel.trim()) return
    setLoading(true)
    await supabase.from('habits').insert({
      user_id: userId,
      label: newLabel.trim(),
      icon: newIcon,
      position: habits.length,
    })
    setNewLabel('')
    setLoading(false)
  }

  const remove = async (id) => {
    await supabase.from('habits').delete().eq('id', id)
  }

  const startEdit = (habit) => {
    setEditingId(habit.id)
    setEditLabel(habit.label)
  }

  const saveEdit = async (id) => {
    if (editLabel.trim()) {
      await supabase.from('habits').update({ label: editLabel.trim() }).eq('id', id)
    }
    setEditingId(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
          <h2 className="text-white font-semibold text-lg">Manage Habits</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Habit list */}
        <div className="px-6 py-3 space-y-2 max-h-72 overflow-y-auto">
          {habits.length === 0 && (
            <p className="text-slate-500 text-sm text-center py-4">No habits yet. Add one below.</p>
          )}
          {habits.map(habit => (
            <div key={habit.id} className="flex items-center gap-3 px-3 py-2.5 bg-slate-800/50 rounded-xl border border-slate-700/50 group">
              <GripVertical className="w-4 h-4 text-slate-600 shrink-0" />
              <span className="text-base shrink-0">{getEmoji(habit.icon)}</span>

              {editingId === habit.id ? (
                <input
                  autoFocus
                  value={editLabel}
                  onChange={e => setEditLabel(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && saveEdit(habit.id)}
                  className="flex-1 bg-slate-700 text-white text-sm px-2 py-1 rounded-lg outline-none border border-indigo-500"
                />
              ) : (
                <span
                  className="flex-1 text-sm text-slate-200 cursor-pointer hover:text-white"
                  onClick={() => startEdit(habit)}
                >
                  {habit.label}
                </span>
              )}

              {editingId === habit.id ? (
                <button onClick={() => saveEdit(habit.id)} className="text-indigo-400 hover:text-indigo-300 cursor-pointer">
                  <Check className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => remove(habit.id)}
                  className="text-slate-600 hover:text-red-400 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add form */}
        <div className="px-6 py-4 border-t border-slate-700/50">
          <form onSubmit={add} className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {ICON_OPTIONS.map(o => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setNewIcon(o.value)}
                  className={cn(
                    'w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all cursor-pointer',
                    newIcon === o.value
                      ? 'bg-indigo-500/30 border border-indigo-500/60 scale-110'
                      : 'bg-slate-800 border border-slate-700 hover:bg-slate-700'
                  )}
                >
                  {o.emoji}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                placeholder="New habit name…"
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <button
                type="submit"
                disabled={loading || !newLabel.trim()}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
