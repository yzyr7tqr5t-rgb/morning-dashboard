import { useState } from 'react'
import { Plus, Trash2, GripVertical, X, Check } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
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

// ─── Single sortable habit row ────────────────────────────────────────────────
function SortableHabitRow({ habit, editingId, editLabel, onEditLabel, onStartEdit, onSaveEdit, onRemove, isLight, isLast }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: habit.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 10 : undefined,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 px-4 py-3.5 select-none',
        !isLast && (isLight ? 'border-b border-slate-100' : 'border-b border-white/5'),
        isDragging && 'bg-blue-500/5'
      )}
    >
      <button
        className={cn('cursor-grab active:cursor-grabbing touch-none shrink-0', isLight ? 'text-slate-300' : 'text-white/20')}
        style={{ WebkitUserSelect: 'none', userSelect: 'none', WebkitTouchCallout: 'none' }}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4" />
      </button>

      <span className="text-base shrink-0">{getEmoji(habit.icon)}</span>

      {editingId === habit.id ? (
        <input
          autoFocus
          value={editLabel}
          onChange={e => onEditLabel(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onSaveEdit(habit.id)}
          className={cn('flex-1 text-sm px-2 py-1 rounded-lg outline-none border border-blue-400',
            isLight ? 'bg-slate-50 text-slate-900' : 'bg-white/10 text-white')}
        />
      ) : (
        <span
          className={cn('flex-1 text-[17px] font-medium cursor-pointer', isLight ? 'text-slate-800' : 'text-white/90')}
          onClick={() => onStartEdit(habit)}
        >
          {habit.label}
        </span>
      )}

      {editingId === habit.id ? (
        <button onClick={() => onSaveEdit(habit.id)} className="text-blue-500 cursor-pointer shrink-0">
          <Check className="w-4 h-4" />
        </button>
      ) : (
        <button
          onClick={() => onRemove(habit.id)}
          className={cn('cursor-pointer shrink-0 transition-opacity', isLight ? 'text-slate-300 hover:text-red-400' : 'text-white/20 hover:text-red-400')}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

// ─── Manager modal ────────────────────────────────────────────────────────────
export default function HabitsManager({ habits, userId, onClose, isLight }) {
  const [newLabel, setNewLabel] = useState('')
  const [newIcon, setNewIcon] = useState('coffee')
  const [editingId, setEditingId] = useState(null)
  const [editLabel, setEditLabel] = useState('')
  const [loading, setLoading] = useState(false)
  const [localHabits, setLocalHabits] = useState(habits)

  const merged = [
    ...localHabits,
    ...habits.filter(h => !localHabits.some(l => l.id === h.id)),
  ]

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 8 } })
  )

  const handleDragEnd = async ({ active, over }) => {
    if (!over || active.id === over.id) return
    const oldIndex = merged.findIndex(h => h.id === active.id)
    const newIndex = merged.findIndex(h => h.id === over.id)
    const reordered = arrayMove(merged, oldIndex, newIndex)
    setLocalHabits(reordered)
    await Promise.all(reordered.map((h, i) => supabase.from('habits').update({ position: i }).eq('id', h.id)))
  }

  const add = async (e) => {
    e.preventDefault()
    if (!newLabel.trim()) return
    setLoading(true)
    await supabase.from('habits').insert({ user_id: userId, label: newLabel.trim(), icon: newIcon, position: merged.length })
    setNewLabel('')
    setLoading(false)
  }

  const remove = async (id) => {
    setLocalHabits(prev => prev.filter(h => h.id !== id))
    await supabase.from('habits').delete().eq('id', id)
  }

  const startEdit = (habit) => { setEditingId(habit.id); setEditLabel(habit.label) }
  const saveEdit = async (id) => {
    if (editLabel.trim()) {
      setLocalHabits(prev => prev.map(h => h.id === id ? { ...h, label: editLabel.trim() } : h))
      await supabase.from('habits').update({ label: editLabel.trim() }).eq('id', id)
    }
    setEditingId(null)
  }

  const divider = isLight ? 'border-t border-slate-100' : 'border-t border-white/6'

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
      style={{ display: 'flex', alignItems: window.innerWidth >= 768 ? 'center' : 'flex-end', justifyContent: 'center', padding: window.innerWidth >= 768 ? '1rem' : '0' }}
    >
      <div className={cn(
        'w-full shadow-2xl overflow-hidden',
        window.innerWidth >= 768 ? 'rounded-3xl max-w-md' : 'rounded-t-3xl',
        isLight ? 'bg-white' : 'bg-[#1c1c1e]'
      )}>
        {/* Handle — only shown on mobile */}
        {window.innerWidth < 768 && (
          <div className="flex justify-center pt-3 pb-1">
            <div className={cn('w-9 h-1 rounded-full', isLight ? 'bg-slate-200' : 'bg-white/20')} />
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className={cn('font-semibold text-base', isLight ? 'text-slate-900' : 'text-white')}>Habits</h2>
          <button onClick={onClose} className={cn('w-7 h-7 rounded-full flex items-center justify-center cursor-pointer', isLight ? 'bg-slate-100 text-slate-500' : 'bg-white/10 text-white/60')}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Sortable list — grouped iOS style */}
        <div className={cn('mx-5 rounded-2xl overflow-hidden max-h-64 overflow-y-auto', isLight ? 'bg-slate-50' : 'bg-white/6')}>
          {merged.length === 0 && (
            <p className={cn('text-sm text-center py-6', isLight ? 'text-slate-400' : 'text-white/30')}>No habits yet.</p>
          )}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={merged.map(h => h.id)} strategy={verticalListSortingStrategy}>
              {merged.map((habit, i) => (
                <SortableHabitRow
                  key={habit.id}
                  habit={habit}
                  editingId={editingId}
                  editLabel={editLabel}
                  onEditLabel={setEditLabel}
                  onStartEdit={startEdit}
                  onSaveEdit={saveEdit}
                  onRemove={remove}
                  isLight={isLight}
                  isLast={i === merged.length - 1}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>

        {/* Add form */}
        <div className={cn('px-5 py-4 mt-2', divider)}>
          {/* Icon picker */}
          <div className="flex flex-wrap gap-2 mb-3">
            {ICON_OPTIONS.map(o => (
              <button
                key={o.value}
                type="button"
                onClick={() => setNewIcon(o.value)}
                className={cn(
                  'w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all cursor-pointer',
                  newIcon === o.value
                    ? 'bg-blue-500/20 ring-1 ring-blue-500/50 scale-110'
                    : isLight ? 'bg-slate-100 hover:bg-slate-200' : 'bg-white/8 hover:bg-white/12'
                )}
              >
                {o.emoji}
              </button>
            ))}
          </div>

          <form onSubmit={add} className="flex gap-2">
            <input
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              placeholder="New habit name…"
              className={cn(
                'flex-1 px-4 py-3 rounded-2xl text-[17px] focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all',
                isLight ? 'bg-slate-100 text-slate-900 placeholder-slate-400' : 'bg-white/8 text-white placeholder-white/30'
              )}
            />
            <button
              type="submit"
              disabled={loading || !newLabel.trim()}
              className="w-10 h-10 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white flex items-center justify-center cursor-pointer transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>
        </div>

        {window.innerWidth < 768 && <div className="h-4" />}
      </div>
    </div>
  )
}
