'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { login } from '@/lib/api'
import { saveAuth } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('gabriella.bata@trainbot.com')
  const [password, setPassword] = useState('password123')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(asTrainer = false) {
    setError('')
    setLoading(true)
    const emailToUse = asTrainer ? 'trainer@trainbot.com' : email
    try {
      const res = await login(emailToUse, password)
      const { token, role, name } = res.data
      saveAuth(token, role, name)
      router.push(role === 'trainer' ? '/trainer' : '/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed - check the backend is running on port 4000.')
    } finally {
      setLoading(false)
    }
  }





  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-secondary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '20px',
      padding: '2rem',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: 'var(--purple)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 12px',
        }}>
          <i className="ti ti-headset" style={{ color: '#fff', fontSize: 24 }} />
        </div>
        <div style={{ fontSize: 18, fontWeight: 500 }}>Welcome to TrainBot</div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
          AI-powered customer simulation for support agent training
        </div>
      </div>






      <div className="card" style={{ width: 300, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 5 }}>Email</div>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@trainbot.com"
          />
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 5 }}>Password</div>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>





        {error && (
          <div style={{ fontSize: 12, color: 'var(--coral)', background: 'var(--coral-light)', padding: '7px 10px', borderRadius: 6 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
          <button
            className="btn btn-primary"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => handleLogin(false)}
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Sign in as trainee'}
          </button>
          <button
            className="btn"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => handleLogin(true)}
            disabled={loading}
          >
            Sign in as trainer
          </button>
        </div>








        <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-tertiary)' }}>
          Practise realistic customer conversations before going live
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        <span className="badge badge-purple">
          <i className="ti ti-users" style={{ fontSize: 11 }} /> Trainee &amp; trainer roles
        </span>
        <span className="badge badge-easy">
          <i className="ti ti-message-circle" style={{ fontSize: 11 }} /> Live AI chat sessions
        </span>
        <span className="badge badge-medium">
          <i className="ti ti-chart-bar" style={{ fontSize: 11 }} /> Automated scoring
        </span>
      </div>






      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'center', maxWidth: 280 }}>
        Demo credentials are pre-filled. Password is <code>password123</code>.
      </div>
    </div>
  )
}