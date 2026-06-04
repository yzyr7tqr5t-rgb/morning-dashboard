import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('cn', () => {
  it('joins multiple class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('drops falsy values', () => {
    expect(cn('foo', false && 'bar', null, undefined, 'baz')).toBe('foo baz')
  })

  it('resolves tailwind conflicts (last one wins)', () => {
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
    expect(cn('p-4', 'p-2')).toBe('p-2')
  })

  it('handles conditional object syntax from clsx', () => {
    expect(cn({ 'font-bold': true, 'italic': false })).toBe('font-bold')
  })

  it('returns empty string for no arguments', () => {
    expect(cn()).toBe('')
  })

  it('handles array inputs from clsx', () => {
    expect(cn(['foo', 'bar'], 'baz')).toBe('foo bar baz')
  })
})
