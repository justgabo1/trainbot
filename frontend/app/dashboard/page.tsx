'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import TraineeSidebar from '@/components/TraineeSidebar'

interface PersonaCard {
  id: string
  name: string
  icon: string
  difficulty: string
  tone: string
  scenario: string
}

interface StoredSession {
  personaId: string
  personaName: string
  turnCount: number
  durationSeconds: number
  empathyScore: number
  resolved: boolean
  completedAt: number
}

const DEFAULT_PERSONAS: PersonaCard[] = [
  { id: 'angry',        name: 'Sarah Hadley',     icon: 'ti-mood-angry',   difficulty: 'Hard',   tone: 'Cold controlled fury',   scenario: 'Double charge: card declined in public' },
  { id: 'confused',     name: 'Gerald Williams',  icon: 'ti-help-circle',  difficulty: 'Medium', tone: 'Gentle, mildly anxious', scenario: 'Direct debit increase query' },
  { id: 'cancellation', name: 'Dominic Smith',    icon: 'ti-alert-circle', difficulty: 'Hard',   tone: 'Loud, accusatory',       scenario: 'Accidental policy lapse' },
  { id: 'impatient',    name: 'Elizabeth Murphy', icon: 'ti-clock',        difficulty: 'Medium', tone: 'Sharp and direct',       scenario: 'Renewal price rise 31% without any change' },
]

const personaStyle: Record<string, { bg: string; color: string }> = {
  angry:        { bg: 'var(--coral-light)',  color: 'var(--coral)'      },
  confused:     { bg: 'var(--amber-light)',  color: 'var(--amber)'      },
  cancellation: { bg: 'var(--purple-light)', color: 'var(--purple)'     },
  impatient:    { bg: 'var(--teal-light)',   color: 'var(--teal-dark)'  },
}

function DifficultyBadge({ d }: { d: string }) {
  const lower = d.toLowerCase()
  return <span className={`badge badge-${lower}`}>{d}</span>
}

export default function DashboardPage() {
  const router = useRouter()
  const [personas, setPersonas] = useState<PersonaCard[]>(DEFAULT_PERSONAS)
  const [sessions, setSessions] = useState<StoredSession[]>([])
  const [weeklyGoal, setWeeklyGoal] = useState(5)

  useEffect(() => {
    // load sessions from localStorage
    const raw = localStorage.getItem('trainbot_sessions')
    if (raw) setSessions(JSON.parse(raw))

    // load weekly goal
    const goal = localStorage.getItem('trainbot_weekly_goal')
    if (goal) setWeeklyGoal(parseInt(goal))

    // load custom personas
    const stored = localStorage.getItem('trainbot_custom_personas')
    if (stored) {
      const custom = JSON.parse(stored)
      setPersonas([
        ...DEFAULT_PERSONAS,
        ...custom.map((p: any) => ({
          id: p.id,
          name: p.name,
          icon: 'ti-user',
          difficulty: p.difficulty,
          tone: p.tone || '',
          scenario: p.intent || 'Custom scenario',
        }))
      ])
    }
  }, [])

  // compute real stats
  const totalSessions = sessions.length
  const empScores = sessions.map(s => s.empathyScore).filter(v => v > 0)
  const avgEmpathy = empScores.length
    ? (empScores.reduce((a, b) => a + b, 0) / empScores.length).toFixed(1)
    : '—'
  const resolvedCount = sessions.filter(s => s.resolved).length
  const resolutionRate = totalSessions > 0 ? `${Math.round((resolvedCount / totalSessions) * 100)}%` : '—'

  // weekly sessions (last 7 days)
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const weeklySessions = sessions.filter(s => s.completedAt > oneWeekAgo).length

  // recent sessions -> last 5
  const recentSessions = [...sessions].reverse().slice(0, 5)

  function startSession(personaId: string) {
    sessionStorage.setItem('selectedPersona', personaId)
    router.push('/chat')
  }

  const formatDuration = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`
  const formatDate = (ts: number) => {
    const diff = Date.now() - ts
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    if (mins < 60) return `${mins}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <TraineeSidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{
          padding: '14px 16px',
          borderBottom: '0.5px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--bg)',
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>Good morning, Gabriella</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              {weeklySessions} of {weeklyGoal} sessions done this week
              {weeklySessions >= weeklyGoal ? ' · 🎉 goal reached!' : ' · keep going!'}
            </div>
          </div>
        </div>




        {/* Content */}
        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto', flex: 1 }}>




          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {[
              { label: 'Sessions done',   val: totalSessions || 0,  suffix: '',   color: 'var(--text-primary)' },
              { label: 'Avg empathy',     val: avgEmpathy,           suffix: avgEmpathy !== '—' ? '/5' : '', color: 'var(--purple)' },
              { label: 'Resolution rate', val: resolutionRate,       suffix: '',   color: 'var(--teal)'   },
              { label: 'Weekly goal',     val: `${weeklySessions}/${weeklyGoal}`, suffix: '', color: weeklySessions >= weeklyGoal ? 'var(--teal)' : 'var(--amber)' },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{s.label}</div>
                <div style={{ fontSize: 20, fontWeight: 500, color: s.color, marginTop: 2 }}>
                  {s.val}
                  {s.suffix && <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{s.suffix}</span>}
                </div>
              </div>
            ))}
          </div>




          {/* weekly goal progress bar */}
          <div className="card" style={{ padding: '10px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 6 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Weekly goal progress</span>
              <span style={{ fontWeight: 500, color: 'var(--purple)' }}>{weeklySessions} of {weeklyGoal} sessions</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${Math.min((weeklySessions / weeklyGoal) * 100, 100)}%` }}
              />
            </div>
          </div>






          {/* personas */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>Choose a persona</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {personas.map(p => {
                const style = personaStyle[p.id] ?? { bg: 'var(--bg-secondary)', color: 'var(--text-secondary)' }
                return (
                  <div
                    key={p.id}
                    className="card"
                    onClick={() => startSession(p.id)}
                    style={{
                      padding: '10px 12px',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      cursor: 'pointer', transition: 'background 0.12s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg)')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: 8,
                        background: style.bg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <i className={`ti ${p.icon}`} style={{ color: style.color, fontSize: 18 }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{p.scenario}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <DifficultyBadge d={p.difficulty} />
                      <i className="ti ti-chevron-right" style={{ color: 'var(--text-tertiary)', fontSize: 14 }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>







          {/* Recent sessions */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Recent sessions</div>
            {recentSessions.length === 0 ? (
              <div className="card" style={{ padding: '16px 14px', fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center' }}>
                No sessions done yet - pick a persona above and get started
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {recentSessions.map((s, i) => (
                  <div key={i} className="card" style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 6,
                        background: personaStyle[s.personaId]?.bg ?? 'var(--bg-secondary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <i className={`ti ${personas.find(p => p.id === s.personaId)?.icon ?? 'ti-user'}`}
                          style={{ color: personaStyle[s.personaId]?.color ?? 'var(--text-secondary)', fontSize: 14 }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 500 }}>{s.personaName}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                          {formatDate(s.completedAt)} · {s.turnCount} turns · {formatDuration(s.durationSeconds)}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, color: s.resolved ? 'var(--teal)' : 'var(--coral)', fontWeight: 500 }}>
                        {s.resolved ? 'Resolved' : 'Unresolved'}
                      </span>
                      {s.empathyScore > 0 && (
                        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--purple)' }}>
                          {s.empathyScore}/5
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}