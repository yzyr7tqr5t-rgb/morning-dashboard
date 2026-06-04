import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import WeeklyView from './WeeklyView'

vi.mock('./HabitsManager', () => ({
  getEmoji: (icon) => (icon === 'coffee' ? '☕' : '✅'),
}))

const HABITS = [
  { id: 'h1', label: 'Morning coffee', icon: 'coffee' },
  { id: 'h2', label: 'Exercise', icon: 'dumbbell' },
]

function today() {
  return new Date().toISOString().slice(0, 10)
}

describe('WeeklyView', () => {
  it('renders the section headings', () => {
    render(<WeeklyView habits={HABITS} log={[]} isLight={false} />)
    expect(screen.getByText('Last 7 days')).toBeInTheDocument()
    expect(screen.getByText('History')).toBeInTheDocument()
  })

  it('shows a "Today" label in the bar chart', () => {
    render(<WeeklyView habits={HABITS} log={[]} isLight={false} />)
    // "Today" appears once in the bar chart labels and once in the history list
    const todayLabels = screen.getAllByText('Today')
    expect(todayLabels.length).toBeGreaterThanOrEqual(1)
  })

  it('renders exactly 7 columns in the bar chart', () => {
    const { container } = render(<WeeklyView habits={HABITS} log={[]} isLight={false} />)
    // The bar chart uses a flex container with one child per day
    const barChart = container.querySelector('.flex.items-end')
    expect(barChart?.children).toHaveLength(7)
  })

  it('shows 0/2 counts for all days when log is empty', () => {
    render(<WeeklyView habits={HABITS} log={[]} isLight={false} />)
    const counts = screen.getAllByText('0/2')
    expect(counts).toHaveLength(7)
  })

  it('shows the correct completion count for today', () => {
    const log = [
      { habit_id: 'h1', date: today() },
      { habit_id: 'h2', date: today() },
    ]
    render(<WeeklyView habits={HABITS} log={log} isLight={false} />)
    expect(screen.getByText('2/2')).toBeInTheDocument()
  })

  it('shows partial completion count correctly', () => {
    const log = [{ habit_id: 'h1', date: today() }]
    render(<WeeklyView habits={HABITS} log={log} isLight={false} />)
    expect(screen.getByText('1/2')).toBeInTheDocument()
  })

  it('renders habit labels inside the history list', () => {
    render(<WeeklyView habits={HABITS} log={[]} isLight={false} />)
    // Each habit appears once per day in the history section (7 × 2 = 14 chips)
    const coffeeChips = screen.getAllByText(/Morning coffee/)
    expect(coffeeChips.length).toBe(7)
  })

  it('renders correctly with no habits', () => {
    render(<WeeklyView habits={[]} log={[]} isLight={false} />)
    expect(screen.getByText('Last 7 days')).toBeInTheDocument()
    // With 0 habits, all counts show 0/0
    const counts = screen.getAllByText('0/0')
    expect(counts).toHaveLength(7)
  })

  it('applies light-mode classes when isLight is true', () => {
    const { container } = render(<WeeklyView habits={HABITS} log={[]} isLight={true} />)
    // Check that at least one element has a light-mode class
    expect(container.innerHTML).toContain('text-slate-400')
  })
})
