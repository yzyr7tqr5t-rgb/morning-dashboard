import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Sun } from 'lucide-react'

const GitHubIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
  </svg>
)

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('login')
  const [loading, setLoading] = useState(false)
  const [githubLoading, setGithubLoading] = useState(false)
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

  const signInWithGitHub = async () => {
    setGithubLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo },
    })
    if (error) { setError(error.message); setGithubLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm bg-slate-900/60 border-slate-700/50 backdrop-blur-sm">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center">
              <Sun className="w-6 h-6 text-indigo-300" />
            </div>
          </div>
          <p className="text-white font-semibold text-xl">Morning Dashboard</p>
          <p className="text-slate-400 text-sm mt-1">
            {mode === 'magic' ? 'Sign in with a magic link' : mode === 'signup' ? 'Create your account' : 'Welcome back'}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* GitHub OAuth */}
          <button
            onClick={signInWithGitHub}
            disabled={githubLoading}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
          >
            <GitHubIcon />
            {githubLoading ? 'Redirecting…' : 'Continue with GitHub'}
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-700" />
            <span className="text-slate-500 text-xs">or</span>
            <div className="flex-1 h-px bg-slate-700" />
          </div>

          {/* Email form */}
          <form onSubmit={handle} className="space-y-3">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
            />
            {mode !== 'magic' && (
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              />
            )}
            {error && <p className="text-red-400 text-xs">{error}</p>}
            {message && <p className="text-green-400 text-xs">{message}</p>}
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
              <button onClick={() => setMode('magic')} className="text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer">
                Sign in with magic link instead
              </button>
            )}
            {mode === 'login' && (
              <button onClick={() => setMode('signup')} className="text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer">
                Don't have an account? Sign up
              </button>
            )}
            {(mode === 'signup' || mode === 'magic') && (
              <button onClick={() => setMode('login')} className="text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer">
                Already have an account? Sign in
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
