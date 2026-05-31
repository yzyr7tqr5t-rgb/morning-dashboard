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
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-indigo-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm bg-white border-slate-200 shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
              <Sun className="w-6 h-6 text-indigo-500" />
            </div>
          </div>
          <p className="text-slate-900 font-semibold text-xl">Morning Dashboard</p>
          <p className="text-slate-500 text-sm mt-1">
            {mode === 'magic' ? 'Sign in with a magic link' : mode === 'signup' ? 'Create your account' : 'Welcome back'}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handle} className="space-y-3">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
            />
            {mode !== 'magic' && (
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              />
            )}
            {error && <p className="text-red-500 text-xs">{error}</p>}
            {message && <p className="text-green-600 text-xs">{message}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium transition-colors cursor-pointer"
            >
              {loading ? 'Loading…' : mode === 'magic' ? 'Send magic link' : mode === 'signup' ? 'Create account' : 'Sign in'}
            </button>
          </form>

          <div className="flex flex-col gap-2 pt-1">
            {mode !== 'magic' && (
              <button onClick={() => setMode('magic')} className="text-xs text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                Sign in with magic link instead
              </button>
            )}
            {mode === 'login' && (
              <button onClick={() => setMode('signup')} className="text-xs text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                Don't have an account? Sign up
              </button>
            )}
            {(mode === 'signup' || mode === 'magic') && (
              <button onClick={() => setMode('login')} className="text-xs text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                Already have an account? Sign in
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
