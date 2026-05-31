import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Sun } from 'lucide-react'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('login')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  const redirectTo = `${window.location.origin}${window.location.pathname}`

  const handle = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    if (mode === 'magic') {
      const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } })
      if (error) setError(error.message)
      else setMessage('Check your email for a magic link!')
    } else if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo } })
      if (error) setError(error.message)
      else setMessage('Account created! Check your email to confirm.')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-indigo-50/60 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* App icon */}
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200">
            <Sun className="w-10 h-10 text-white" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 text-center mb-1">Morning Dashboard</h1>
        <p className="text-slate-400 text-sm text-center mb-8">
          {mode === 'magic' ? 'Sign in with a magic link' : mode === 'signup' ? 'Create your account' : 'Welcome back'}
        </p>

        <form onSubmit={handle} className="space-y-3">
          {/* Grouped input iOS style */}
          <div className="rounded-2xl overflow-hidden bg-white shadow-sm border border-slate-100">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3.5 text-slate-900 text-sm placeholder-slate-400 bg-transparent focus:outline-none border-b border-slate-100"
            />
            {mode !== 'magic' && (
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3.5 text-slate-900 text-sm placeholder-slate-400 bg-transparent focus:outline-none"
              />
            )}
          </div>

          {error && <p className="text-red-500 text-xs px-1">{error}</p>}
          {message && <p className="text-green-600 text-xs px-1">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors cursor-pointer shadow-sm shadow-indigo-200"
          >
            {loading ? 'Loading…' : mode === 'magic' ? 'Send magic link' : mode === 'signup' ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <div className="flex flex-col gap-3 mt-6 items-center">
          {mode !== 'magic' && (
            <button onClick={() => setMode('magic')} className="text-sm text-indigo-500 hover:text-indigo-700 font-medium cursor-pointer">
              Use magic link instead
            </button>
          )}
          {mode === 'login' && (
            <button onClick={() => setMode('signup')} className="text-sm text-slate-400 hover:text-slate-600 cursor-pointer">
              Don't have an account? <span className="text-indigo-500 font-medium">Sign up</span>
            </button>
          )}
          {(mode === 'signup' || mode === 'magic') && (
            <button onClick={() => setMode('login')} className="text-sm text-slate-400 hover:text-slate-600 cursor-pointer">
              Already have an account? <span className="text-indigo-500 font-medium">Sign in</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
