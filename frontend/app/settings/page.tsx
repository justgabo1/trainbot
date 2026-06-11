'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { clearAuth, getName } from '@/lib/auth'
import TraineeSidebar from '@/components/TraineeSidebar'

export default function SettingsPage() {
  const router = useRouter()
  const [weeklyGoal, setWeeklyGoal] = useState(5)
  const [coachingTips, setCoachingTips] = useState(true)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setWeeklyGoal(parseInt(localStorage.getItem('trainbot_weekly_goal') || '5'))
    setCoachingTips(localStorage.getItem('trainbot_coaching_tips') !== 'false')
  }, [])

  function save() {
    localStorage.setItem('trainbot_weekly_goal', String(weeklyGoal))
    localStorage.setItem('trainbot_coaching_tips', String(coachingTips))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function clearHistory() {
    if (confirm('Clear all session history? This cannot be undone.')) {
      localStorage.removeItem('trainbot_sessions')
      localStorage.removeItem('trainbot_session_count')
      alert('Session history cleared.')
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <TraineeSidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '14px 20px', borderBottom: '0.5px solid var(--border)', fontSize: 14, fontWeight: 500, background: 'var(--bg)' }}>
          Settings
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 500 }}>

          <div className="card" style={{ padding: '16px' }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>Training preferences</div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6 }}>Weekly session goal</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[3, 5, 7, 10].map(n => (
                  <button key={n} onClick={() => setWeeklyGoal(n)} style={{
                    width: 44, height: 36, borderRadius: 8, cursor: 'pointer',
                    border: `0.5px solid ${n === weeklyGoal ? 'var(--purple)' : 'var(--border)'}`,
                    background: n === weeklyGoal ? 'var(--purple-light)' : 'var(--bg)',
                    color: n === weeklyGoal ? 'var(--purple)' : 'var(--text-secondary)',
                    fontSize: 13, fontWeight: n === weeklyGoal ? 500 : 400,
                  }}>{n}</button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500 }}>Coaching tips</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Show tips in the chat sidebar</div>
              </div>
              <button onClick={() => setCoachingTips(v => !v)} style={{
                width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
                background: coachingTips ? 'var(--purple)' : 'var(--border)',
                position: 'relative', transition: 'background 0.2s',
              }}>
                <div style={{
                  width: 16, height: 16, borderRadius: '50%', background: '#fff',
                  position: 'absolute', top: 3, left: coachingTips ? 20 : 3,
                  transition: 'left 0.2s',
                }} />
              </button>
            </div>
          </div>

          <div className="card" style={{ padding: '16px' }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>Account</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
              Signed in as <strong>{getName()}</strong>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" onClick={save}>
                {saved ? <><i className="ti ti-check" /> Saved</> : 'Save settings'}
              </button>
              <button className="btn" onClick={() => { clearAuth(); router.push('/login') }}>
                <i className="ti ti-logout" /> Sign out
              </button>
            </div>
          </div>

          <div className="card" style={{ padding: '16px' }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Data</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 12 }}>Session history is stored in your browser only.</div>
            <button className="btn" onClick={clearHistory} style={{ color: 'var(--coral)', borderColor: 'var(--coral)' }}>
              <i className="ti ti-trash" /> Clear session history
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}