import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import HabitsManager, { getEmoji } from './HabitsManager'

// ── Supabase mock ─────────────────────────────────────────────────────────────
// vi.mock is hoisted to the top of the file, so mock variables must also be
// hoisted with vi.hoisted to avoid a temporal dead zone error.

const mocks = vi.hoisted(() => {
  const mockEq = vi.fn().mockResolvedValue({ error: null })
  const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null })
  const mockDelete = vi.fn(() => ({ eq: mockEq }))
  const mockUpdate = vi.fn(() => ({ eq: mockEq }))
  const mockFrom = vi.fn(() => ({ insert: mockInsert, delete: mockDelete, update: mockUpdate }))
  return { mockEq, mockInsert, mockDelete, mockUpdate, mockFrom }
})

vi.mock('@/lib/supabase', () => ({
  supabase: { from: mocks.mockFrom },
}))

// ── Fixtures ──────────────────────────────────────────────────────────────────

const HABITS = [
  { id: '1', label: 'Morning coffee', icon: 'coffee', position: 0 },
  { id: '2', label: 'Exercise', icon: 'dumbbell', position: 1 },
]

function renderManager(habits = HABITS, props = {}) {
  return render(
    <HabitsManager habits={habits} userId="user-1" onClose={vi.fn()} isLight={false} {...props} />,
  )
}

// ── getEmoji unit tests ───────────────────────────────────────────────────────

describe('getEmoji', () => {
  it.each([
    ['coffee', '☕'],
    ['book', '📖'],
    ['dumbbell', '💪'],
    ['apple', '🍎'],
    ['smile', '😊'],
    ['sun', '🌅'],
    ['moon', '🌙'],
    ['water', '💧'],
    ['walk', '🚶'],
    ['meditate', '🧘'],
    ['music', '🎵'],
    ['write', '✍️'],
  ])('returns correct emoji for "%s"', (icon, expected) => {
    expect(getEmoji(icon)).toBe(expected)
  })

  it('returns ✅ for an unknown icon key', () => {
    expect(getEmoji('unknown-icon')).toBe('✅')
  })

  it('returns ✅ for undefined', () => {
    expect(getEmoji(undefined)).toBe('✅')
  })

  it('returns ✅ for an empty string', () => {
    expect(getEmoji('')).toBe('✅')
  })
})

// ── HabitsManager component tests ─────────────────────────────────────────────

describe('HabitsManager', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders all existing habits', () => {
    renderManager()
    expect(screen.getByText('Morning coffee')).toBeInTheDocument()
    expect(screen.getByText('Exercise')).toBeInTheDocument()
  })

  it('shows empty-state message when habits list is empty', () => {
    renderManager([])
    expect(screen.getByText('No habits yet.')).toBeInTheDocument()
  })

  it('calls onClose when the X button is clicked', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    renderManager(HABITS, { onClose })
    // The X button has no accessible name; identify it by its rounded-full class
    const closeButton = screen.getAllByRole('button').find(b =>
      b.className.includes('rounded-full'),
    )
    await user.click(closeButton)
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('disables the add button when the input is empty', () => {
    renderManager([])
    const buttons = screen.getAllByRole('button')
    const addButton = buttons.find(b => b.disabled)
    expect(addButton).toBeDefined()
  })

  it('enables the add button once text is typed', async () => {
    const user = userEvent.setup()
    renderManager([])
    const input = screen.getByPlaceholderText('New habit name…')
    await user.type(input, 'Drink water')
    const buttons = screen.getAllByRole('button')
    const allDisabled = buttons.filter(b => b.disabled)
    expect(allDisabled).toHaveLength(0)
  })

  it('calls supabase insert with correct payload on form submit', async () => {
    const user = userEvent.setup()
    renderManager([])
    const input = screen.getByPlaceholderText('New habit name…')
    await user.type(input, 'Drink water')
    await user.keyboard('{Enter}')
    await waitFor(() => {
      expect(mocks.mockFrom).toHaveBeenCalledWith('habits')
      expect(mocks.mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: 'user-1', label: 'Drink water' }),
      )
    })
  })

  it('clears the input field after a habit is added', async () => {
    const user = userEvent.setup()
    renderManager([])
    const input = screen.getByPlaceholderText('New habit name…')
    await user.type(input, 'Drink water')
    await user.keyboard('{Enter}')
    await waitFor(() => expect(input).toHaveValue(''))
  })

  it('does not call insert when the label is only whitespace', async () => {
    const user = userEvent.setup()
    renderManager([])
    const input = screen.getByPlaceholderText('New habit name…')
    await user.type(input, '   ')
    await user.keyboard('{Enter}')
    expect(mocks.mockInsert).not.toHaveBeenCalled()
  })

  it('calls supabase delete when a habit is removed', async () => {
    const user = userEvent.setup()
    renderManager()
    // Trash buttons carry the 'transition-colors' class; grip buttons carry dnd
    // aria attributes (aria-roledescription="sortable") so they are distinguishable.
    const trashButton = screen.getAllByRole('button').find(b =>
      b.className.includes('transition-colors') && !b.getAttribute('aria-roledescription'),
    )
    await user.click(trashButton)
    await waitFor(() => {
      expect(mocks.mockFrom).toHaveBeenCalledWith('habits')
      expect(mocks.mockDelete).toHaveBeenCalled()
    })
  })

  it('enters edit mode when a habit label is clicked', async () => {
    const user = userEvent.setup()
    renderManager()
    await user.click(screen.getByText('Morning coffee'))
    // An input should now appear pre-filled with the habit label
    const editInput = screen.getByDisplayValue('Morning coffee')
    expect(editInput).toBeInTheDocument()
  })

  it('calls supabase update when an edit is saved', async () => {
    const user = userEvent.setup()
    renderManager()
    await user.click(screen.getByText('Morning coffee'))
    const editInput = screen.getByDisplayValue('Morning coffee')
    await user.clear(editInput)
    await user.type(editInput, 'Espresso')
    await user.click(screen.getByRole('button', { name: 'Done' }))
    await waitFor(() => {
      expect(mocks.mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ label: 'Espresso' }),
      )
    })
  })
})
