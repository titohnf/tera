'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
type Mode = 'password' | 'magic'

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (mode === 'password') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
      } else {
        window.location.href = '/'
      }
    } else {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
      if (error) {
        setError(error.message)
      } else {
        setSent(true)
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50/30">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-gray-200/80 p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Tera Bimbel</h1>
          <p className="text-sm text-gray-500 mt-1">Masuk ke akun kamu</p>
        </div>

        {/* Mode toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
          <button
            type="button"
            onClick={() => { setMode('password'); setError(''); setSent(false) }}
            className={`flex-1 text-sm py-1.5 rounded-md font-medium transition-colors ${mode === 'password' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
          >
            Email & Password
          </button>
          <button
            type="button"
            onClick={() => { setMode('magic'); setError(''); setSent(false) }}
            className={`flex-1 text-sm py-1.5 rounded-md font-medium transition-colors ${mode === 'magic' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
          >
            Magic Link
          </button>
        </div>

        {sent ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-gray-700 font-medium">Cek email kamu!</p>
            <p className="text-sm text-gray-500 mt-1">Link masuk sudah dikirim ke <strong>{email}</strong></p>
            <button onClick={() => setSent(false)} className="text-xs text-blue-600 mt-3 hover:underline">
              Kirim ulang / ganti email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="email@kamu.com"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50/50 focus:bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {mode === 'password' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50/50 focus:bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Memproses...' : mode === 'password' ? 'Masuk' : 'Kirim Magic Link'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
