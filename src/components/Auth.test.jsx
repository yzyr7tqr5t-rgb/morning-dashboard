import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Auth from './Auth'
import { supabase } from '@/lib/supabase'

// ── Supabase auth mock ────────────────────────────────────────────────────────

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithOtp: vi.fn(),
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
    },
  },
}))

describe('Auth', () => {
  beforeEach(() => vi.clearAllMocks())

  // ── Initial render ──────────────────────────────────────────────────────────

  it('renders the login form by default', () => {
    render(<Auth />)
    expect(screen.getByText('Welcome back')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument()
  })

  it('shows the app title', () => {
    render(<Auth />)
    expect(screen.getByText('Morning Dashboard')).toBeInTheDocument()
  })

  // ── Mode switching ──────────────────────────────────────────────────────────

  it('switches to magic link mode and hides the password field', async () => {
    const user = userEvent.setup()
    render(<Auth />)
    await user.click(screen.getByRole('button', { name: 'Use magic link instead' }))
    expect(screen.getByText('Sign in with a magic link')).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Password')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send magic link' })).toBeInTheDocument()
  })

  it('switches to signup mode', async () => {
    const user = userEvent.setup()
    render(<Auth />)
    await user.click(screen.getByRole('button', { name: "Don't have an account? Sign up" }))
    expect(screen.getByText('Create your account')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create account' })).toBeInTheDocument()
  })

  it('switches back to login from magic link mode', async () => {
    const user = userEvent.setup()
    render(<Auth />)
    await user.click(screen.getByRole('button', { name: 'Use magic link instead' }))
    await user.click(screen.getByRole('button', { name: 'Already have an account? Sign in' }))
    expect(screen.getByText('Welcome back')).toBeInTheDocument()
  })

  it('switches back to login from signup mode', async () => {
    const user = userEvent.setup()
    render(<Auth />)
    await user.click(screen.getByRole('button', { name: "Don't have an account? Sign up" }))
    await user.click(screen.getByRole('button', { name: 'Already have an account? Sign in' }))
    expect(screen.getByText('Welcome back')).toBeInTheDocument()
  })

  // ── Magic link flow ─────────────────────────────────────────────────────────

  it('shows success message after sending a magic link', async () => {
    supabase.auth.signInWithOtp.mockResolvedValue({ error: null })
    const user = userEvent.setup()
    render(<Auth />)
    await user.click(screen.getByRole('button', { name: 'Use magic link instead' }))
    await user.type(screen.getByPlaceholderText('Email'), 'hello@example.com')
    await user.click(screen.getByRole('button', { name: 'Send magic link' }))
    await waitFor(() =>
      expect(screen.getByText('Check your email for a magic link!')).toBeInTheDocument(),
    )
  })

  it('shows error message when magic link request fails', async () => {
    supabase.auth.signInWithOtp.mockResolvedValue({ error: { message: 'Rate limit exceeded' } })
    const user = userEvent.setup()
    render(<Auth />)
    await user.click(screen.getByRole('button', { name: 'Use magic link instead' }))
    await user.type(screen.getByPlaceholderText('Email'), 'hello@example.com')
    await user.click(screen.getByRole('button', { name: 'Send magic link' }))
    await waitFor(() =>
      expect(screen.getByText('Rate limit exceeded')).toBeInTheDocument(),
    )
  })

  // ── Signup flow ─────────────────────────────────────────────────────────────

  it('shows success message after successful signup', async () => {
    supabase.auth.signUp.mockResolvedValue({ error: null })
    const user = userEvent.setup()
    render(<Auth />)
    await user.click(screen.getByRole('button', { name: "Don't have an account? Sign up" }))
    await user.type(screen.getByPlaceholderText('Email'), 'new@example.com')
    await user.type(screen.getByPlaceholderText('Password'), 'secret123')
    await user.click(screen.getByRole('button', { name: 'Create account' }))
    await waitFor(() =>
      expect(screen.getByText('Account created! Check your email to confirm.')).toBeInTheDocument(),
    )
  })

  it('shows error message when signup fails', async () => {
    supabase.auth.signUp.mockResolvedValue({ error: { message: 'Email already registered' } })
    const user = userEvent.setup()
    render(<Auth />)
    await user.click(screen.getByRole('button', { name: "Don't have an account? Sign up" }))
    await user.type(screen.getByPlaceholderText('Email'), 'existing@example.com')
    await user.type(screen.getByPlaceholderText('Password'), 'secret123')
    await user.click(screen.getByRole('button', { name: 'Create account' }))
    await waitFor(() =>
      expect(screen.getByText('Email already registered')).toBeInTheDocument(),
    )
  })

  // ── Login flow ──────────────────────────────────────────────────────────────

  it('shows error message when login fails', async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({ error: { message: 'Invalid login credentials' } })
    const user = userEvent.setup()
    render(<Auth />)
    await user.type(screen.getByPlaceholderText('Email'), 'user@example.com')
    await user.type(screen.getByPlaceholderText('Password'), 'wrongpassword')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    await waitFor(() =>
      expect(screen.getByText('Invalid login credentials')).toBeInTheDocument(),
    )
  })

  it('calls signInWithPassword with the entered credentials', async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({ error: null })
    const user = userEvent.setup()
    render(<Auth />)
    await user.type(screen.getByPlaceholderText('Email'), 'user@example.com')
    await user.type(screen.getByPlaceholderText('Password'), 'mypassword')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    await waitFor(() =>
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'mypassword',
      }),
    )
  })

  // ── Loading state ───────────────────────────────────────────────────────────

  it('shows loading text on the button while a request is in flight', async () => {
    let resolve
    supabase.auth.signInWithPassword.mockReturnValue(new Promise(r => { resolve = r }))
    const user = userEvent.setup()
    render(<Auth />)
    await user.type(screen.getByPlaceholderText('Email'), 'user@example.com')
    await user.type(screen.getByPlaceholderText('Password'), 'pass')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(await screen.findByRole('button', { name: 'Loading…' })).toBeDisabled()
    resolve({ error: null })
  })
})
