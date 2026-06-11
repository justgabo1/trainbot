'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import TraineeSidebar from '@/components/TraineeSidebar'
import { startSession, sendMessage, endSession } from '@/lib/api'

type Message = { role: 'user' | 'assistant'; content: string }

interface Survey {
  realism: number
  confidence_q1: number
  confidence_q2: number
  confidence_q3: number
  confidence_q4: number
  confidence_q5: number
}

const PERSONAS: Record<string, { name: string; icon: string; tone: string; intent: string; difficulty: string; color: string }> = {
  angry:        { name: 'Sarah Hadley',     icon: 'ti-mood-angry',   tone: 'Cold controlled fury',      intent: 'Specific refund date in writing',         difficulty: 'Hard',   color: 'var(--coral)' },
  confused:     { name: 'Gerald Williams',  icon: 'ti-help-circle',  tone: 'Gentle, mildly anxious',    intent: 'Understand direct debit in plain English', difficulty: 'Medium', color: 'var(--amber)' },
  cancellation: { name: 'Dominic Smith',    icon: 'ti-alert-circle', tone: 'Loud, accusatory',          intent: 'Reinstate lapsed policy immediately',      difficulty: 'Hard',   color: 'var(--coral)' },
  impatient:    { name: 'Elizabeth Murphy', icon: 'ti-clock',        tone: 'Sharp, direct, suspicious', intent: 'Understand 31% price rise or leave',       difficulty: 'Medium', color: 'var(--amber)' },
}

const COACHING_TIPS: Record<string, string[]> = {
  angry:        ['Acknowledge the card decline specifically - not just the charge', 'Give a named refund date, not a range', 'Offer email confirmation proactively'],
  confused:     ["Use plain English - no jargon", "Match his pace - don't rush", 'Check he actually understood before moving on'],
  cancellation: ['Acknowledge the fear first, process second', "Don't say \"you should have\" - let him arrive there himself", 'Be concrete about what can and cannot be done about the claim'],
  impatient:    ['Give specific reasons, not "underwriters set it"', "Don't mention new customer price without offering to match", 'A retention offer with a named price is the only path to renewal'],
}

const QUICK_REPLIES: Record<string, string[]> = {
  angry:        ["I'm so sorry - let me pull up your account right now", "I can see the duplicate charge. I'm raising an urgent refund.", "Your refund will be back by [date]. I'll email confirmation now."],
  confused:     ['Of course, no problem at all - happy to help', 'In simple terms, what happened is...', "Does that make sense? I'm happy to explain it another way."],
  cancellation: ["I can hear how stressful this is - let's focus on getting this sorted", 'Let me check exactly what happened with the payment', "Here's the reinstatement process - it's straightforward:"],
  impatient:    ["That's a fair question - let me give you a proper answer", 'The specific factors driving that increase are...', 'I can offer you a retention discount - your revised price would be £78/month'],
}

const CONFIDENCE_QUESTIONS = [
  'I feel confident handling this type of scenario in a live environment',
  'I understand what I did well in this session',
  'I understand what I need to improve before my next session',
  'The feedback I received was specific and useful',
  'I would feel comfortable attempting this scenario without supervision',
]

export default function ChatPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [personaId, setPersonaId] = useState('angry')
  const [persona, setPersona] = useState(PERSONAS.angry)
  const [startTime, setStartTime] = useState<number>(Date.now())
  const [elapsed, setElapsed] = useState(0)
  const [showSurvey, setShowSurvey] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [survey, setSurvey] = useState<Survey>({
    realism: 0,
    confidence_q1: 0, confidence_q2: 0, confidence_q3: 0,
    confidence_q4: 0, confidence_q5: 0,
  })
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const id = sessionStorage.getItem('selectedPersona') || 'angry'
    setPersonaId(id)
    setPersona(PERSONAS[id] || PERSONAS.angry)
    init(id)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000)
    return () => clearInterval(interval)
  }, [startTime])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function init(id: string) {
    try {
      const res = await startSession(id)
      setSessionId(res.data.sessionId)
      setStartTime(Date.now())
      setMessages([{ role: 'assistant', content: res.data.openingMessage }])
    } catch {
      setMessages([{ role: 'assistant', content: 'Session could not start: check the backend is running on port 4000.' }])
    }
  }

  async function send(text?: string) {
    const content = text ?? input.trim()
    if (!content || !sessionId || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content }])
    setLoading(true)
    try {
      const res = await sendMessage(sessionId, content)
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '(No response — check your OpenAI key)' }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }





  // step 1 - clicking End session shows the survey overlay
  function handleEndSession() {
    setShowSurvey(true)
  }

  // step 2 - submitting the survey ends the session and goes to results
  async function submitSurveyAndEnd() {
    if (survey.realism === 0 || !allConfidenceAnswered) return
    setSubmitting(true)

    const confidenceAvg = (
      (survey.confidence_q1 + survey.confidence_q2 + survey.confidence_q3 +
       survey.confidence_q4 + survey.confidence_q5) / 5
    ).toFixed(1)

    try {
      let result
      if (sessionId) {
        const res = await endSession(sessionId)
        result = {
          sessionId,
          personaId,
          personaName: persona.name,
          transcript: res.data.transcript,
          durationSeconds: res.data.durationSeconds,
          turnCount: res.data.turnCount,
          survey: { ...survey, confidenceAvg },
        }
      } else {
        result = {
          sessionId: 'local',
          personaId,
          personaName: persona.name,
          transcript: messages,
          durationSeconds: elapsed,
          turnCount: messages.filter(m => m.role === 'user').length,
          survey: { ...survey, confidenceAvg },
        }
      }
      sessionStorage.setItem('sessionResult', JSON.stringify(result))
    } catch {
      const result = {
        sessionId: 'local',
        personaId,
        personaName: persona.name,
        transcript: messages,
        durationSeconds: elapsed,
        turnCount: messages.filter(m => m.role === 'user').length,
        survey: { ...survey, confidenceAvg },
      }
      sessionStorage.setItem('sessionResult', JSON.stringify(result))
    } finally {
      router.push('/results')
    }
  }

  const allConfidenceAnswered =
    survey.confidence_q1 > 0 && survey.confidence_q2 > 0 &&
    survey.confidence_q3 > 0 && survey.confidence_q4 > 0 &&
    survey.confidence_q5 > 0

  const confidenceAvg = allConfidenceAnswered
    ? ((survey.confidence_q1 + survey.confidence_q2 + survey.confidence_q3 +
        survey.confidence_q4 + survey.confidence_q5) / 5).toFixed(1)
    : null

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`
  const tipIndex = Math.min(Math.floor(messages.length / 3), (COACHING_TIPS[personaId]?.length ?? 1) - 1)
  const currentTip = COACHING_TIPS[personaId]?.[tipIndex] ?? ''

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <TraineeSidebar />
      <div style={{ flex: 1, display: 'flex', position: 'relative' }}>







        {/* Survey overlay, shown when End session is clicked */}
        {showSurvey && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 50,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px',
          }}>
            <div style={{
              background: 'var(--bg)',
              borderRadius: 12,
              padding: '24px',
              width: '100%',
              maxWidth: 520,
              maxHeight: '90vh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 4 }}>
                  Post-session survey
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  Complete both sections then click Submit to see your results.
                </div>
              </div>






              {/* persona realism */}
              <div className="card" style={{ padding: '14px' }}>
                <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 4 }}>
                  Persona realism rating
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 10 }}>
                  How realistic did the AI customer feel? (1 = not at all, 5 = fully realistic)
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      onClick={() => setSurvey(s => ({ ...s, realism: n }))}
                      style={{
                        width: 40, height: 40, borderRadius: 8, cursor: 'pointer',
                        border: `0.5px solid ${n === survey.realism ? 'var(--purple)' : 'var(--border)'}`,
                        background: n === survey.realism ? 'var(--purple-light)' : 'var(--bg-secondary)',
                        color: n === survey.realism ? 'var(--purple-dark)' : 'var(--text-secondary)',
                        fontSize: 14, fontWeight: n === survey.realism ? 500 : 400,
                      }}
                    >{n}</button>
                  ))}
                </div>
              </div>







              {/* trainee confidence — 5 items */}
              <div className="card" style={{ padding: '14px' }}>
                <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 4 }}>
                  Trainee confidence score
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 12 }}>
                  Rate each statement 1–5 (1 = strongly disagree, 5 = strongly agree)
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {CONFIDENCE_QUESTIONS.map((q, i) => {
                    const key = `confidence_q${i + 1}` as keyof Survey
                    return (
                      <div key={key}>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 7, lineHeight: 1.5 }}>
                          {i + 1}. {q}
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {[1, 2, 3, 4, 5].map(n => (
                            <button
                              key={n}
                              onClick={() => setSurvey(s => ({ ...s, [key]: n }))}
                              style={{
                                width: 36, height: 36, borderRadius: 6, cursor: 'pointer',
                                border: `0.5px solid ${n === survey[key] ? 'var(--purple)' : 'var(--border)'}`,
                                background: n === survey[key] ? 'var(--purple-light)' : 'var(--bg-secondary)',
                                color: n === survey[key] ? 'var(--purple-dark)' : 'var(--text-secondary)',
                                fontSize: 13, fontWeight: n === survey[key] ? 500 : 400,
                              }}
                            >{n}</button>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
                {confidenceAvg && (
                  <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-secondary)' }}>
                    Confidence average: <strong style={{ color: 'var(--purple)' }}>{confidenceAvg}/5</strong>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={submitSurveyAndEnd}
                  disabled={survey.realism === 0 || !allConfidenceAnswered || submitting}
                >
                  {submitting
                    ? 'Saving…'
                    : <><i className="ti ti-send" /> Submit &amp; see results</>
                  }
                </button>
                <button
                  className="btn"
                  style={{ justifyContent: 'center' }}
                  onClick={() => setShowSurvey(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
              </div>

              {(survey.realism === 0 || !allConfidenceAnswered) && (
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', textAlign: 'center' }}>
                  Please answer all questions to continue
                </div>
              )}
            </div>
          </div>
        )}
















        {/* left persona sidebar */}
        <div className="sidebar" style={{ width: 200 }}>
          <div className="sidebar-top">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'var(--coral-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <i className={`ti ${persona.icon}`} style={{ color: persona.color, fontSize: 16 }} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500 }}>{persona.name}</div>
                <span className={`badge badge-${persona.difficulty.toLowerCase()}`} style={{ fontSize: 9, padding: '1px 5px' }}>
                  {persona.difficulty}
                </span>
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              <div><strong>Tone:</strong> {persona.tone}</div>
              <div style={{ marginTop: 3 }}><strong>Intent:</strong> {persona.intent}</div>
            </div>
          </div>

          <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              <i className="ti ti-messages" /> Turns: <strong>{messages.filter(m => m.role === 'user').length}</strong>
              &nbsp;&nbsp;<i className="ti ti-clock" /> {formatTime(elapsed)}
            </div>

            {currentTip && (
              <div style={{ background: 'var(--purple-light)', borderRadius: 6, padding: '8px 10px' }}>
                <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--purple)', marginBottom: 3 }}>
                  <i className="ti ti-bulb" /> Coaching tip
                </div>
                <div style={{ fontSize: 11, color: 'var(--purple-dark)', lineHeight: 1.4 }}>{currentTip}</div>
              </div>
            )}

            <button
              className="btn"
              style={{ width: '100%', justifyContent: 'center', borderColor: 'var(--coral)', color: 'var(--coral)' }}
              onClick={handleEndSession}
            >
              End session
            </button>
          </div>
        </div>




















        {/* chat area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{
            padding: '12px 16px',
            borderBottom: '0.5px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'var(--bg)', flexShrink: 0,
          }}>
            <i className={`ti ${persona.icon}`} style={{ color: persona.color, fontSize: 18 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{persona.name} · Customer</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{persona.tone}</div>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginBottom: 3, paddingLeft: 2, paddingRight: 2 }}>
                  {m.role === 'user' ? 'You (Agent)' : persona.name}
                </div>
                <div style={{
                  maxWidth: '75%', padding: '10px 13px', borderRadius: 10,
                  background: m.role === 'user' ? 'var(--purple-light)' : 'var(--bg-secondary)',
                  border: m.role === 'user' ? '0.5px solid var(--purple)' : '0.5px solid var(--border)',
                  fontSize: 13, lineHeight: 1.55,
                  color: m.role === 'user' ? 'var(--purple-dark)' : 'var(--text-primary)',
                }}>
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <div style={{
                  padding: '10px 14px', borderRadius: 10,
                  background: 'var(--bg-secondary)', border: '0.5px solid var(--border)',
                  fontSize: 13, color: 'var(--text-secondary)',
                }}>
                  <i className="ti ti-dots" /> Typing…
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

















          {/* quick replies */}
          <div style={{
            padding: '8px 16px',
            borderTop: '0.5px solid var(--border)',
            display: 'flex', gap: 6, flexWrap: 'wrap',
            background: 'var(--bg)',
          }}>
            {(QUICK_REPLIES[personaId] ?? []).map((qr, i) => (
              <button
                key={i}
                onClick={() => send(qr)}
                style={{
                  fontSize: 11, padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
                  border: '0.5px solid var(--border)', background: 'var(--bg-secondary)',
                  color: 'var(--text-secondary)', whiteSpace: 'nowrap',
                }}
              >
                {qr.length > 40 ? qr.slice(0, 38) + '…' : qr}
              </button>
            ))}
          </div>
















          {/* input */}
          <div style={{
            padding: '10px 16px',
            borderTop: '0.5px solid var(--border)',
            display: 'flex', gap: 8,
            background: 'var(--bg)', flexShrink: 0,
          }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  send()
                }
              }}
              placeholder="Type your response… (Enter to send, Shift+Enter for new line)"
              style={{
                flex: 1, resize: 'none', height: 60,
                padding: '8px 10px', fontSize: 13, borderRadius: 8,
                border: '0.5px solid var(--border)',
                background: 'var(--bg-secondary)', color: 'var(--text-primary)',
                outline: 'none', fontFamily: 'inherit',
              }}
            />
            <button
              className="btn btn-primary"
              style={{ alignSelf: 'flex-end', padding: '8px 16px' }}
              onClick={() => send()}
              disabled={loading || !input.trim()}
            >
              <i className="ti ti-send" /> Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}