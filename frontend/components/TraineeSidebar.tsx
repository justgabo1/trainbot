'use client'

import { useRouter, usePathname } from 'next/navigation'
import { clearAuth, getName } from '@/lib/auth'
import { useEffect, useState } from 'react'

export default function TraineeSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const [sessionCount, setSessionCount] = useState(0)
  const [weeklyGoal, setWeeklyGoal] = useState(5)
  const name = getName() || 'Gabriella Bata'

  useEffect(() => {
    // load the weekly sessions from last 7 days
    const raw = localStorage.getItem('trainbot_sessions')
    if (raw) {
      const sessions = JSON.parse(raw)
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
      const weekly = sessions.filter((s: any) => s.completedAt > oneWeekAgo).length
      setSessionCount(weekly)
    }

    // load the weekly goal
    const goal = localStorage.getItem('trainbot_weekly_goal')
    if (goal) setWeeklyGoal(parseInt(goal))
  }, [])

  const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
  const pct = Math.min((sessionCount / weeklyGoal) * 100, 100)

  const navItems = [
    { label: 'Dashboard',  icon: 'ti-layout-dashboard', path: '/dashboard'  },
    { label: 'My results', icon: 'ti-chart-bar',         path: '/results'    },
    { label: 'Settings',   icon: 'ti-settings',          path: '/settings'   },
  ]

  return (
    <div className="sidebar" style={{ width: 180 }}>
      <div className="sidebar-top">
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--purple)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 600, color: '#fff', flexShrink: 0,
          }}>
            {initials}
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 500 }}>{name}</div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Trainee</div>
          </div>
        </div>














        {/* Weekly goal */}
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: '8px 10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 5 }}>
            <span style={{ color: 'var(--text-secondary)' }}>Weekly goal</span>
            <span style={{ fontWeight: 500, color: 'var(--purple)' }}>{sessionCount}/{weeklyGoal}</span>
          </div>
          <div className="progress-bar" style={{ height: 5 }}>
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 4 }}>
            {sessionCount >= weeklyGoal
              ? '🎉 Goal reached!'
              : `${weeklyGoal - sessionCount} session${weeklyGoal - sessionCount !== 1 ? 's' : ''} to go`}
          </div>
        </div>
      </div>



















      {/* Nav */}
      <div style={{ padding: '8px 0', flex: 1 }}>
        {navItems.map(item => (
          <div
            key={item.path}
            onClick={() => router.push(item.path)}
            style={{
              padding: '8px 12px',
              display: 'flex', alignItems: 'center', gap: 8,
              fontSize: 12, cursor: 'pointer', borderRadius: 6, margin: '0 6px 2px',
              background: pathname === item.path ? 'var(--purple-light)' : 'transparent',
              color: pathname === item.path ? 'var(--purple)' : 'var(--text-secondary)',
              fontWeight: pathname === item.path ? 500 : 400,
            }}
          >
            <i className={`ti ${item.icon}`} style={{ fontSize: 15 }} />
            {item.label}
          </div>
        ))}
      </div>

      <div style={{ padding: '12px 8px' }}>
        <button
          className="btn"
          style={{ width: '100%', justifyContent: 'center', fontSize: 11 }}
          onClick={() => { clearAuth(); router.push('/login') }}
        >
          <i className="ti ti-logout" /> Sign out
        </button>
      </div>
    </div>
  )
}