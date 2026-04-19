'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { setViewerSession, setAdminSession } from '@/lib/admin-auth'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError || !data.session) {
      setError('Invalid credentials. Please try again.')
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.session.user.id)
      .single()

    if (!profile || !['viewer', 'admin'].includes(profile.role)) {
      await supabase.auth.signOut()
      setError('Access denied.')
      setLoading(false)
      return
    }

    if (profile.role === 'admin') {
      setAdminSession()
    } else {
      setViewerSession()
    }
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-8">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Image src="/Pengassan Logo.png" alt="PENGASSAN" width={40} height={40} style={{ width: 'auto', height: '40px' }} className="object-contain" />
            <Image src="/NMDPRA Logo.png" alt="NMDPRA" width={40} height={40} style={{ width: 'auto', height: '40px' }} className="object-contain" />
          </div>
          <h1 className="text-xl font-bold text-gray-800">Member Login</h1>
          <p className="text-sm text-gray-500 mt-1">PENGASSAN NMDPRA</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
              required
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-700 text-white py-2 rounded-lg font-medium text-sm hover:bg-green-800 transition-colors disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
