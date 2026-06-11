'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import TraineeSidebar from '@/components/TraineeSidebar'
import { scoreSession } from '@/lib/api'

interface FullEval {
  empathyScore: number
  resolved: boolean
  deEscalation: 'effective' | 'partial' | 'none' | 'inappropriate'
  responseQualityScore: number
  avgResponseTime: number
  feedback: { type: 'positive' | 'improvement'; metric?: string; text: string }[]
}

const deEscalationLabel: Record<string, { label: string; color: string; bg: string }> = {
  effective:     { label: 'Effective',     color: 'var(--teal-dark)', bg: 'var(--teal-light)'  },
  partial:       { label: 'Partial',       color: 'var(--amber)',     bg: 'var(--amber-light)' },
  none:          { label: 'Not achieved',  color: 'var(--coral)',     bg: 'var(--coral-light)' },
  inappropriate: { label: 'Inappropriate', color: 'var(--coral)',     bg: 'var(--coral-light)' },
}

const CONFIDENCE_QUESTIONS = [
  'I feel confident handling this type of scenario in a live environment',
  'I understand what I did well in this session',
  'I understand what I need to improve before my next session',
  'The feedback I received was specific and useful',
  'I would feel comfortable attempting this scenario without supervision',
]

export default function ResultsPage() {
  const router = useRouter()
  const scoringStarted = useRef(false)
  const [result, setResult] = useState<any | null>(null)
  const [eval_, setEval] = useState<FullEval | null>(null)
  const [scoring, setScoring] = useState(false)

  useEffect(() => {
    if (scoringStarted.current) return
    scoringStarted.current = true

    const raw = sessionStorage.getItem('sessionResult')
    if (raw) {
      const data = JSON.parse(raw)
      setResult(data)
      scoreIt(data)
    } else {
      setEval({
        empathyScore: 4, resolved: true,
        deEscalation: 'effective', responseQualityScore: 4,
        avgResponseTime: 38,
        feedback: [
          { type: 'positive',    metric: 'Empathy',         text: 'You acknowledged the card declining in public specifically, not just the charge.' },
          { type: 'positive',    metric: 'Issue Resolution', text: 'You gave a specific refund date rather than a vague range.' },
          { type: 'improvement', metric: 'De-escalation',    text: "Use the customer's first name earlier to personalise and speed up de-escalation." },
          { type: 'improvement', metric: 'Response Quality', text: 'Some responses were slightly long: aim for shorter, clearer messages.' },
        ],
      })
    }
  }, [])

  async function scoreIt(data: any) {
    setScoring(true)
    try {
      const res = await scoreSession(data.transcript, data.personaName)
      const d = res.data
      const evalData: FullEval = {
        empathyScore:         d.empathyScore ?? 3,
        resolved:             d.resolved ?? false,
        deEscalation:         d.deEscalation ?? 'partial',
        responseQualityScore: d.responseQualityScore ?? 3,
        avgResponseTime:      d.avgResponseTime ?? 38,
        feedback:             d.feedback ?? [],
      }
      setEval(evalData)
      saveToHistory(data, evalData)
    } catch {
      const evalData: FullEval = {
        empathyScore: 3, resolved: false,
        deEscalation: 'partial', responseQualityScore: 3,
        avgResponseTime: 38,
        feedback: [{ type: 'improvement', metric: 'General', text: 'Could not auto-score — check your OpenAI key and credits.' }],
      }
      setEval(evalData)
      saveToHistory(data, evalData)
    } finally {
      setScoring(false)
    }
  }

  function saveToHistory(data: any, evalData: FullEval) {
    const key = `saved_${data.sessionId}`
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')

    const session = {
      personaId:       data.personaId,
      personaName:     data.personaName,
      turnCount:       data.turnCount,
      durationSeconds: data.durationSeconds,
      empathyScore:    evalData.empathyScore,
      resolved:        evalData.resolved,
      completedAt:     Date.now(),
    }
    const raw = localStorage.getItem('trainbot_sessions')
    const sessions = raw ? JSON.parse(raw) : []
    sessions.push(session)
    localStorage.setItem('trainbot_sessions', JSON.stringify(sessions))
  }

  const formatDuration = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

  const transcript = result?.transcript ?? [
    { role: 'assistant', content: "I've been waiting THREE days. My card declined at the supermarket today. This is unacceptable." },
    { role: 'user',      content: "Sarah, I'm really sorry - having your card decline in public because of our error is awful. I'm pulling up your account now." },
    { role: 'assistant', content: "I want a confirmed refund date, not 'we'll look into it'." },
    { role: 'user',      content: "I can confirm the duplicate charge of £99.99 on 20 May. Your refund will be back by Friday 24th and I'm sending email confirmation now." },
  ]





  // survey data saved from the chat overlay
  const survey = result?.survey ?? null
  const confidenceAvg = survey?.confidenceAvg ?? null

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <TraineeSidebar />
      <div style={{ flex: 1, display: 'flex' }}>

        {/* Left scores sidebar */}
        <div className="sidebar" style={{ width: 200 }}>
          <div className="sidebar-top">
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Session summary</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              {result?.personaName ?? 'Demo session'}
            </div>
          </div>
          <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500, marginTop: 4 }}>
              Scores
            </div>
            {scoring ? (
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                <i className="ti ti-loader-2" style={{ fontSize: 14 }} /> Scoring…
              </div>
            ) : eval_ && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {[
                  { label: 'Empathy',         val: `${eval_.empathyScore}/5`,         pct: (eval_.empathyScore / 5) * 100,         color: 'var(--purple)' },
                  { label: 'Resolution',       val: eval_.resolved ? 'Yes' : 'No',     pct: eval_.resolved ? 100 : 0,               color: eval_.resolved ? 'var(--teal)' : 'var(--coral)' },
                  { label: 'Response quality', val: `${eval_.responseQualityScore}/5`, pct: (eval_.responseQualityScore / 5) * 100, color: 'var(--amber)' },
                ].map(s => (
                  <div key={s.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{s.label}</span>
                      <span style={{ fontWeight: 500, color: s.color }}>{s.val}</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${s.pct}%`, background: s.color }} />
                    </div>
                  </div>
                ))}
              </div>
            )}





            {/* Navigation buttons - always visible */}
            <div style={{ borderTop: '0.5px solid var(--border)', paddingTop: 10, marginTop: 4, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <button
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => {
                  sessionStorage.setItem('selectedPersona', result?.personaId ?? 'angry')
                  sessionStorage.removeItem('sessionResult')
                  router.push('/chat')
                }}
              >
                Retry scenario
              </button>
              <button
                className="btn"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => {
                  sessionStorage.removeItem('sessionResult')
                  router.push('/dashboard')
                }}
              >
                New persona
              </button>
            </div>
          </div>
        </div>






        {/* Main content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{
            padding: '14px 16px', borderBottom: '0.5px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'var(--bg)', flexShrink: 0,
          }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>Session results</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {result
                  ? `${result.turnCount} turns · ${formatDuration(result.durationSeconds)} total`
                  : 'Demo · 4 turns'}
              </div>
            </div>
          </div>

          <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto', flex: 1 }}>





            {/* Resolution banner */}
            {eval_ && (
              <div style={{
                background: eval_.resolved ? 'var(--teal-light)' : 'var(--coral-light)',
                borderRadius: 8, padding: '10px 14px',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <i
                  className={`ti ${eval_.resolved ? 'ti-circle-check' : 'ti-circle-x'}`}
                  style={{ color: eval_.resolved ? 'var(--teal-dark)' : 'var(--coral)', fontSize: 22 }}
                />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: eval_.resolved ? 'var(--teal-dark)' : 'var(--coral)' }}>
                    Issue resolved: <strong>{eval_.resolved ? 'Yes' : 'No'}</strong>
                  </div>
                  <div style={{ fontSize: 11, color: eval_.resolved ? 'var(--teal)' : 'var(--coral)', marginTop: 2 }}>
                    {eval_.resolved
                      ? "The customer's core issue was addressed and they left satisfied"
                      : "The customer's issue was not fully resolved — review the transcript below"}
                  </div>
                </div>
              </div>
            )}






            {/* Four metric cards */}
            {eval_ && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="stat-card">
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2 }}>
                    <i className="ti ti-heart" style={{ fontSize: 12 }} /> Empathy score
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--purple)' }}>
                    {eval_.empathyScore}<span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>/5</span>
                  </div>
                  <div className="progress-bar" style={{ marginTop: 6 }}>
                    <div className="progress-fill" style={{ width: `${(eval_.empathyScore / 5) * 100}%` }} />
                  </div>
                </div>

                <div className="stat-card">
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2 }}>
                    <i className="ti ti-circle-check" style={{ fontSize: 12 }} /> Issue resolution
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 500, color: eval_.resolved ? 'var(--teal)' : 'var(--coral)' }}>
                    {eval_.resolved ? 'Yes' : 'No'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
                    {result?.turnCount ? `In ${result.turnCount} turns` : 'End of session'}
                  </div>
                </div>

                <div className="stat-card">
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2 }}>
                    <i className="ti ti-trending-down" style={{ fontSize: 12 }} /> De-escalation
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <span style={{
                      fontSize: 12, fontWeight: 500, padding: '3px 8px', borderRadius: 6,
                      background: deEscalationLabel[eval_.deEscalation]?.bg,
                      color: deEscalationLabel[eval_.deEscalation]?.color,
                    }}>
                      {deEscalationLabel[eval_.deEscalation]?.label}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6 }}>
                    Emotional intensity trajectory
                  </div>
                </div>

                <div className="stat-card">
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2 }}>
                    <i className="ti ti-writing" style={{ fontSize: 12 }} /> Response quality
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--amber)' }}>
                    {eval_.responseQualityScore}<span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>/5</span>
                  </div>
                  <div className="progress-bar" style={{ marginTop: 6 }}>
                    <div className="progress-fill" style={{ width: `${(eval_.responseQualityScore / 5) * 100}%`, background: 'var(--amber)' }} />
                  </div>
                </div>
              </div>
            )}






            {/* Automated feedback */}
            {eval_ && eval_.feedback.length > 0 && (
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Automated feedback</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {eval_.feedback.map((f, i) => (
                    <div key={i} className="card" style={{ padding: '10px 12px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                        background: f.type === 'positive' ? 'var(--teal-light)' : 'var(--amber-light)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <i
                          className={`ti ${f.type === 'positive' ? 'ti-check' : 'ti-arrow-up'}`}
                          style={{ color: f.type === 'positive' ? 'var(--teal-dark)' : 'var(--amber)', fontSize: 11 }}
                        />
                      </div>
                      <div>
                        {f.metric && (
                          <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-tertiary)', marginBottom: 2 }}>
                            {f.metric}
                          </div>
                        )}
                        <div style={{ fontSize: 12, lineHeight: 1.5 }}>{f.text}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}








            {/* Post-session survey - read only, from chat overlay */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Post-session survey</div>
              {survey ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

                  {/* Persona realism - read only */}
                  <div className="card" style={{ padding: '12px 14px' }}>
                    <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 4 }}>
                      Persona realism rating
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8 }}>
                      How realistic did the AI customer feel?
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {[1, 2, 3, 4, 5].map(n => (
                        <div key={n} style={{
                          width: 36, height: 36, borderRadius: 8,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          border: `0.5px solid ${n === survey.realism ? 'var(--purple)' : 'var(--border)'}`,
                          background: n === survey.realism ? 'var(--purple-light)' : 'var(--bg-secondary)',
                          color: n === survey.realism ? 'var(--purple-dark)' : 'var(--text-tertiary)',
                          fontSize: 13, fontWeight: n === survey.realism ? 500 : 400,
                        }}>{n}</div>
                      ))}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8 }}>
                      Your answer: <strong style={{ color: 'var(--purple)' }}>{survey.realism}/5</strong>
                    </div>
                  </div>








                  {/* Confidence items - read only */}
                  <div className="card" style={{ padding: '12px 14px' }}>
                    <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 10 }}>
                      Trainee confidence score
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {CONFIDENCE_QUESTIONS.map((q, i) => {
                        const key = `confidence_q${i + 1}`
                        const val = survey[key] as number
                        return (
                          <div key={key}>
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6, lineHeight: 1.4 }}>
                              {i + 1}. {q}
                            </div>
                            <div style={{ display: 'flex', gap: 5 }}>
                              {[1, 2, 3, 4, 5].map(n => (
                                <div key={n} style={{
                                  width: 30, height: 30, borderRadius: 6,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  border: `0.5px solid ${n === val ? 'var(--purple)' : 'var(--border)'}`,
                                  background: n === val ? 'var(--purple-light)' : 'var(--bg-secondary)',
                                  color: n === val ? 'var(--purple-dark)' : 'var(--text-tertiary)',
                                  fontSize: 12, fontWeight: n === val ? 500 : 400,
                                }}>{n}</div>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <div style={{ marginTop: 12, padding: '8px 12px', background: 'var(--purple-light)', borderRadius: 8 }}>
                      <span style={{ fontSize: 12, color: 'var(--purple-dark)' }}>
                        Confidence average: <strong>{confidenceAvg}/5</strong>
                      </span>
                    </div>
                  </div>

                  <div style={{ background: 'var(--teal-light)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: 'var(--teal-dark)' }}>
                    <i className="ti ti-check" /> Survey submitted — your responses have been recorded
                  </div>
                </div>
              ) : (
                <div style={{ padding: '14px', background: 'var(--bg-secondary)', borderRadius: 8, fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center' }}>
                  No survey data — complete the survey when ending a session
                </div>
              )}
            </div>









            {/* Transcript */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Session transcript</div>
              <div className="card" style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column' }}>
                {transcript.map((m: any, i: number) => (
                  <div key={i} style={{
                    display: 'flex', gap: 8, alignItems: 'flex-start',
                    padding: '6px 0', borderTop: i > 0 ? '0.5px solid var(--border)' : 'none',
                  }}>
                    <div style={{ fontSize: 10, color: 'var(--text-tertiary)', minWidth: 36, marginTop: 2 }}>
                      T{i + 1}
                    </div>
                    <div style={{
                      width: 22, height: 22, borderRadius: m.role === 'assistant' ? 5 : '50%',
                      background: m.role === 'assistant' ? 'var(--coral-light)' : 'var(--purple-light)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      {m.role === 'assistant'
                        ? <i className="ti ti-mood-angry" style={{ color: 'var(--coral)', fontSize: 11 }} />
                        : <span style={{ fontSize: 8, fontWeight: 500, color: 'var(--purple-dark)' }}>GB</span>
                      }
                    </div>
                    <div style={{ fontSize: 12, lineHeight: 1.5, flex: 1 }}>{m.content}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}