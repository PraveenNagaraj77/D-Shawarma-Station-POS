import { useState } from 'react'
import { Eye, EyeOff, LockKeyhole, UserRound, UtensilsCrossed } from 'lucide-react'
import { login as loginApi } from '../../api/auth.api.js'
import { useAuth } from './AuthContext.jsx'

export default function LoginPage() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!username.trim() || !password) {
      setError('Enter your username and password.')
      return
    }

    setIsLoading(true)

    try {
      const response = await loginApi({
        username: username.trim(),
        password,
      })

      if (!response?.success || !response?.data?.token || !response?.data?.user) {
        throw new Error(response?.message || 'The server returned an invalid login response.')
      }

      login(response.data)
    } catch (err) {
      setError(err.message || 'Unable to log in. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#11100f] px-4 py-10 text-white">
      <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-orange-600/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />

      <section className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-[#191817] shadow-2xl md:grid-cols-2">
        <div className="flex flex-col justify-between gap-12 bg-gradient-to-br from-orange-600 via-orange-700 to-[#8e3218] p-8 sm:p-12">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
              <UtensilsCrossed size={25} />
            </div>
            <div>
              <p className="font-bold tracking-wide">D SHAWARMA</p>
              <p className="text-xs font-medium tracking-[0.24em] text-orange-100">STATION</p>
            </div>
          </div>

          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-orange-100">
              Point of Sale
            </p>
            <h1 className="max-w-sm text-4xl font-bold leading-tight sm:text-5xl">
              Good food.
              <br />
              Smooth service.
            </h1>
            <p className="mt-5 max-w-sm leading-7 text-orange-50/85">
              Manage orders, billing, menu items and sales from one simple workspace.
            </p>
          </div>

          <p className="text-xs text-orange-100/75">
            STAFF ACCESS · AUTHORIZED USERS ONLY
          </p>
        </div>

        <div className="flex items-center p-7 sm:p-12">
          <div className="w-full max-w-sm mx-auto">
            <div className="mb-8">
              <p className="mb-2 text-sm font-semibold text-orange-400">Welcome back</p>
              <h2 className="text-3xl font-bold tracking-tight">Sign in</h2>
              <p className="mt-2 text-sm leading-6 text-stone-400">
                Enter your staff credentials to access the POS.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="username" className="mb-2 block text-sm font-medium text-stone-200">
                  Username
                </label>
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#11100f] px-4 transition focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20">
                  <UserRound size={18} className="shrink-0 text-stone-500" />
                  <input
                    id="username"
                    name="username"
                    autoComplete="username"
                    autoFocus
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="Enter your username"
                    className="min-w-0 w-full bg-transparent py-3.5 text-sm text-white outline-none placeholder:text-stone-600"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-stone-200">
                  Password
                </label>
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#11100f] px-4 transition focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20">
                  <LockKeyhole size={18} className="shrink-0 text-stone-500" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    className="min-w-0 w-full bg-transparent py-3.5 text-sm text-white outline-none placeholder:text-stone-600"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="shrink-0 rounded-md p-1 text-stone-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <div role="alert" className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm leading-5 text-red-300">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-950/30 transition hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 focus:ring-offset-[#191817] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? 'Signing in…' : 'Sign in to POS'}
              </button>
            </form>

            <p className="mt-8 text-center text-xs text-stone-500">
              Secure access for D Shawarma Station staff
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
