'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { clearAuth } from '@/lib/auth'

interface TraineeRow {
  name: string
  sessions: number
  avgEmpathy: string
  resolution: string
  lastSeen: string
}

interface PersonaStat {
  id: string
  name: string
  icon: string
  color: string
  uses: number
  resolution: string
}

const PERSONA_LIST = [
  { id: 'angry',        name: 'Sarah - Double charge',  icon: 'ti-mood-angry',   color: 'var(--coral)' },
  { id: 'confused',     name: 'Gerald - Direct debit',  icon: 'ti-help-circle',  color: 'var(--amber)' },
  { id: 'cancellation', name: 'Dominic - Policy lapse', icon: 'ti-alert-circle', color: 'var(--coral)' },
  { id: 'impatient',    name: 'Elizabeth - Renewal',    icon: 'ti-clock',        color: 'var(--teal)'  },
]

export default function TrainerPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'dashboard' | 'personas'>('dashboard')
  const [trainees, setTrainees] = useState<TraineeRow[]>([])
  const [personaStats, setPersonaStats] = useState<PersonaStat[]>(
    PERSONA_LIST.map(p => ({ ...p, uses: 0, resolution: '—' }))
  )

  useEffect(() => {
    const raw = localStorage.getItem('trainbot_sessions')
    const sessions = raw ? JSON.parse(raw) : []

    const empScores = sessions.map((s: any) => s.empathyScore).filter((v: any) => v > 0)
    const resolved = sessions.filter((s: any) => s.resolved).length

    setTrainees([{
      name: 'Gabriella Bata',
      sessions: sessions.length,
      avgEmpathy: empScores.length
        ? (empScores.reduce((a: number, b: number) => a + b, 0) / empScores.length).toFixed(1)
        : '—',
      resolution: sessions.length
        ? `${Math.round((resolved / sessions.length) * 100)}%`
        : '—',
      lastSeen: sessions.length ? 'Active' : 'No sessions yet',
    }])

    setPersonaStats(PERSONA_LIST.map(p => {
      const pSessions = sessions.filter((s: any) => s.personaId === p.id)
      const pResolved = pSessions.filter((s: any) => s.resolved).length
      return {
        ...p,
        uses: pSessions.length,
        resolution: pSessions.length
          ? `${Math.round((pResolved / pSessions.length) * 100)}%`
          : '—',
      }
    }))
  }, [])

  const totalSessions = trainees.reduce((a, t) => a + t.sessions, 0)
  const empathyScores = trainees.map(t => parseFloat(t.avgEmpathy)).filter(v => !isNaN(v))
  const avgEmpathy = empathyScores.length
    ? (empathyScores.reduce((a, b) => a + b, 0) / empathyScores.length).toFixed(1)
    : '—'

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      {/* Sidebar */}
      <div className="sidebar" style={{ width: 200 }}>
        <div className="sidebar-top">
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'var(--purple)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 10,
          }}>
            <i className="ti ti-user-check" style={{ color: '#fff', fontSize: 18 }} />
          </div>
          <div style={{ fontSize: 13, fontWeight: 500 }}>Sam Trainer</div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>Trainer account</div>
        </div>

        <div style={{ padding: '8px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[
            { key: 'dashboard', label: 'Team dashboard', icon: 'ti-layout-dashboard' },
            { key: 'personas',  label: 'Persona editor',  icon: 'ti-edit' },
          ].map(item => (
            <div
              key={item.key}
              onClick={() => {
                if (item.key === 'personas') {
                  router.push('/persona-editor')
                } else {
                  setActiveTab(item.key as any)
                }
              }}
              style={{
                padding: '9px 12px',
                display: 'flex', alignItems: 'center', gap: 9,
                fontSize: 12, cursor: 'pointer', borderRadius: 8,
                background: activeTab === item.key ? 'var(--purple-light)' : 'transparent',
                color: activeTab === item.key ? 'var(--purple)' : 'var(--text-secondary)',
                fontWeight: activeTab === item.key ? 500 : 400,
              }}
            >
              <i className={`ti ${item.icon}`} style={{ fontSize: 15 }} />
              {item.label}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 'auto', padding: '12px 8px' }}>
          <button
            className="btn"
            style={{ width: '100%', justifyContent: 'center', fontSize: 11 }}
            onClick={() => { clearAuth(); router.push('/login') }}
          >
            <i className="ti ti-logout" /> Sign out
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{
          padding: '14px 20px',
          borderBottom: '0.5px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--bg)', flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 500 }}>Team dashboard</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
              Live data from completed training sessions
            </div>
          </div>
          <button className="btn btn-sm" onClick={() => router.push('/persona-editor')}>
            <i className="ti ti-edit" /> Edit personas
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {[
              { label: 'Trainees',       val: trainees.length,      icon: 'ti-users',        color: 'var(--purple)' },
              { label: 'Total sessions', val: totalSessions,        icon: 'ti-messages',     color: 'var(--teal)'   },
              { label: 'Avg empathy',    val: avgEmpathy,           icon: 'ti-heart',        color: 'var(--coral)'  },
              { label: 'Personas',       val: PERSONA_LIST.length,  icon: 'ti-user-circle',  color: 'var(--amber)'  },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                  <i className={`ti ${s.icon}`} style={{ fontSize: 12 }} /> {s.label}
                </div>
                <div style={{ fontSize: 22, fontWeight: 500, color: s.color, marginTop: 4 }}>{s.val}</div>
              </div>
            ))}
          </div>

          {/* Trainees table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{
              padding: '12px 16px',
              borderBottom: '0.5px solid var(--border)',
              fontSize: 13, fontWeight: 500,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span>Trainee progress</span>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 400 }}>
                {totalSessions} session{totalSessions !== 1 ? 's' : ''} completed
              </span>
            </div>
            {trainees.length === 0 || totalSessions === 0 ? (
              <div style={{ padding: '28px 16px', fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center' }}>
                No sessions completed yet. Data will appear here after Gabriella completes a session.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-secondary)' }}>
                    {['Agent', 'Sessions', 'Avg empathy', 'Resolution rate', 'Status'].map(h => (
                      <th key={h} style={{
                        padding: '9px 16px', textAlign: 'left',
                        fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {trainees.map(t => (
                    <tr key={t.name} style={{ borderTop: '0.5px solid var(--border)' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: '50%',
                            background: 'var(--purple-light)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 10, fontWeight: 500, color: 'var(--purple)',
                          }}>
                            GB
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 500 }}>{t.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12 }}>{t.sessions}</td>
                      <td style={{ padding: '12px 16px', fontSize: 12 }}>
                        <span style={{
                          fontWeight: 500,
                          color: parseFloat(t.avgEmpathy) >= 4 ? 'var(--teal)'
                            : parseFloat(t.avgEmpathy) >= 3 ? 'var(--amber)'
                            : isNaN(parseFloat(t.avgEmpathy)) ? 'var(--text-secondary)'
                            : 'var(--coral)',
                        }}>
                          {t.avgEmpathy}{!isNaN(parseFloat(t.avgEmpathy)) ? '/5' : ''}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12 }}>{t.resolution}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          fontSize: 11, padding: '3px 8px', borderRadius: 6,
                          background: 'var(--teal-light)', color: 'var(--teal-dark)',
                          fontWeight: 500,
                        }}>
                          {t.lastSeen}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Persona usage */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{
              padding: '12px 16px',
              borderBottom: '0.5px solid var(--border)',
              fontSize: 13, fontWeight: 500,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span>Persona usage</span>
              <button className="btn btn-sm" onClick={() => router.push('/persona-editor')}>
                <i className="ti ti-edit" /> Edit all personas
              </button>
            </div>
            <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {personaStats.map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: 'var(--bg-secondary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <i className={`ti ${p.icon}`} style={{ color: p.color, fontSize: 16 }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 4 }}>{p.name}</div>
                    <div className="progress-bar" style={{ height: 5 }}>
                      <div
                        className="progress-fill"
                        style={{
                          width: p.resolution === '—' ? '0%' : p.resolution,
                          background: p.color,
                        }}
                      />
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', width: 48, textAlign: 'right' }}>
                    {p.uses} use{p.uses !== 1 ? 's' : ''}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: p.color, width: 40, textAlign: 'right' }}>
                    {p.resolution}
                  </div>
                  <button
                    className="btn btn-sm"
                    onClick={() => router.push('/persona-editor')}
                    style={{ fontSize: 10, padding: '3px 10px', flexShrink: 0 }}
                  >
                    Edit
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}