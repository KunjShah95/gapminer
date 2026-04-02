import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { Sparkles, Eye, EyeOff, ArrowRight, Github, Chrome, Shield } from 'lucide-react'
import type { User } from '@gapminer/types'

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { setUser, setToken } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const endpoint = mode === 'signup' ? '/api/v1/auth/register' : '/api/v1/auth/login'
      const body = mode === 'signup' 
        ? { email, name, password }
        : { email, password }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed')
      }

      // Map snake_case from API to camelCase for the store
      const userData = data.user
      const mappedUser: User = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        avatar: userData.avatar,
        plan: userData.plan,
        createdAt: userData.created_at,
        analysesUsed: userData.analyses_used,
        analysesLimit: userData.analyses_limit,
      }

      setUser(mappedUser)
      setToken(data.access_token)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-surface text-on-surface min-h-screen flex items-center justify-center p-8 relative overflow-hidden hero-mesh">
      {/* Background Blurs */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary/10 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
      
      {/* Navigation */}
      <Link to="/" className="absolute top-8 left-8 text-2xl font-bold tracking-tighter text-[#f9f5fd] flex items-center gap-2 group">
        <div className="w-10 h-10 rounded-2xl primary-gradient flex items-center justify-center text-on-primary-fixed shadow-lg group-hover:scale-110 transition-transform">
          <Sparkles size={20} />
        </div>
        Gapminer
      </Link>

      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        <div className="glass bg-surface-container-high p-8 lg:p-12 rounded-[2.5rem] border border-outline-variant/20 shadow-2xl relative overflow-hidden backdrop-blur-2xl">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold tracking-tight font-headline mb-3">
              {mode === 'signup' ? 'Create your account' : 'Welcome back'}
            </h1>
            <p className="text-on-surface-variant text-sm font-light leading-relaxed">
              {mode === 'signup'
                ? 'The first AI-pipeline that bridges your skills to market demand.'
                : 'Sign in to access your analysis dashboard and roadmaps.'}
            </p>
          </div>

          {/* OAuth Buttons */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <button
              type="button"
              className="glass border border-outline-variant/20 py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-surface-container-highest transition-colors text-sm font-semibold active:scale-[0.98]"
            >
              <Chrome size={18} />
              Google
            </button>
            <button
              type="button"
              className="glass border border-outline-variant/20 py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-surface-container-highest transition-colors text-sm font-semibold active:scale-[0.98]"
            >
              <Github size={18} />
              GitHub
            </button>
          </div>

          <div className="relative mb-8 text-center">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-outline-variant/10"></div>
            </div>
            <span className="relative px-4 text-xs font-bold uppercase tracking-widest text-outline bg-surface-container-high">or email</span>
          </div>

          {/* Auth Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'signup' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant px-1" htmlFor="auth-name">Full Name</label>
                <input
                  id="auth-name"
                  className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-2xl px-5 py-3.5 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none text-on-surface placeholder:text-outline/50"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant px-1" htmlFor="auth-email">Email Address</label>
              <input
                id="auth-email"
                className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-2xl px-5 py-3.5 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none text-on-surface placeholder:text-outline/50"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant" htmlFor="auth-password">Password</label>
                {mode === 'login' && (
                  <a href="#" className="text-xs text-primary hover:underline">Forgot?</a>
                )}
              </div>
              <div className="relative group/pass">
                <input
                  id="auth-password"
                  className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-2xl px-5 py-3.5 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none text-on-surface placeholder:text-outline/50 pr-12"
                  type={showPw ? 'text' : 'password'}
                  placeholder={mode === 'signup' ? '••••••••' : 'Enter password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors p-1"
                  onClick={() => setShowPw(!showPw)}
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-error/10 border border-error/50 p-4 rounded-2xl text-error text-sm font-medium animate-shake" role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full primary-gradient text-on-primary-fixed py-4 rounded-2xl font-bold shadow-xl hover:shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 group/btn"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-on-primary-fixed/30 border-t-on-primary-fixed rounded-full animate-spin"></div>
              ) : (
                <>
                  {mode === 'signup' ? 'Create Free Account' : 'Sign In'}
                  <ArrowRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Toggle */}
          <div className="mt-10 text-center text-sm text-on-surface-variant font-light">
            {mode === 'signup' ? (
              <>
                Already using Gapminer?{' '}
                <button onClick={() => setMode('login')} className="text-primary font-bold hover:underline ml-1 transition-colors">Sign In</button>
              </>
            ) : (
              <>
                New to the platform?{' '}
                <button onClick={() => setMode('signup')} className="text-primary font-bold hover:underline ml-1 transition-colors">Create Account</button>
              </>
            )}
          </div>
        </div>

        {/* Security / Terms */}
        <div className="mt-8 flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-300">
          <div className="flex items-center gap-6 text-xs text-outline font-bold uppercase tracking-widest">
            <a href="#" className="hover:text-primary">Conditions</a>
            <span className="w-1 h-1 rounded-full bg-outline/30"></span>
            <a href="#" className="hover:text-primary">Privacy</a>
            <span className="w-1 h-1 rounded-full bg-outline/30"></span>
            <a href="#" className="hover:text-primary">Security</a>
          </div>
          <p className="text-[10px] text-outline/50 flex items-center gap-1">
            <Shield size={10} />
            SSL Encrypted via Ollama Infrastructure
          </p>
        </div>
      </div>
    </div>
  )
}
