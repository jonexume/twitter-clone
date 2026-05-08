"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Bird } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false) }
    else router.push("/")
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3">
          <Bird className="h-12 w-12 text-sky-500" />
          <h1 className="text-3xl font-bold tracking-tight">Sign in to Chirp</h1>
        </div>

        <button
          onClick={handleGoogle}
          className="w-full flex items-center justify-center gap-3 rounded-2xl border border-border py-3 text-sm font-semibold hover:bg-muted transition-all duration-200 active:scale-[0.98] shadow-sm"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
          <div className="relative flex justify-center text-xs text-muted-foreground"><span className="bg-background px-2">or</span></div>
        </div>

        <form onSubmit={handleLogin} className="space-y-3">
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="Email" required
            className="w-full rounded-2xl border border-border bg-muted px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all duration-200"
          />
          <input
            type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Password" required
            className="w-full rounded-2xl border border-border bg-muted px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all duration-200"
          />
          {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
          <button
            type="submit" disabled={loading}
            className="w-full rounded-2xl bg-sky-500 hover:bg-sky-400 active:scale-[0.98] py-3 text-sm font-semibold text-white disabled:opacity-50 transition-all duration-200 shadow-lg shadow-sky-500/25"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          No account?{" "}
          <Link href="/auth/signup" className="text-sky-500 font-semibold hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  )
}
