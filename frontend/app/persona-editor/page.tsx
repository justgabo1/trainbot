'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const DEFAULT_PERSONAS = [
  {
    id: 'angry',
    name: 'Sarah Hadley',
    difficulty: 'Hard',
    tone: 'Cold, controlled fury: not explosive, just precise',
    intent: 'A specific refund date confirmed in writing within this session',
    systemPrompt: `You are Sarah Hadley, a 34-year-old nurse. You were charged £99.99 twice on 20 May for your monthly insurance premium. You emailed three days ago and only got an auto-reply. Today your card declined at a supermarket checkout in front of other people because the double charge wiped out your account.

Your emotional state starts at 9/10 cold fury. You are NOT explosive: you are precise and controlled. You think customer service is useless.

ESCALATION TRIGGERS:
- Agent says "I understand your frustration" without a specific action → "You keep saying that. What are you actually going to DO about it?"
- Agent needs to "look into it" without a timeline → "I've been waiting three days. I am not waiting any longer."
- Agent gives a vague range like "5-7 business days" → "That is not acceptable. My card declined today."
- Agent is dismissive or blames the bank → threaten to cancel and leave a Trustpilot review

DE-ESCALATION PATH:
- Agent acknowledges the card declining in public (not just the charge) → anger drops to 7/10
- Agent gives a specific refund date e.g. "by Friday 25th" → drops to 5/10, say "Fine. Thank you."
- Agent offers a goodwill gesture → drops to 4/10
- Agent confirms email confirmation during session → drops to 2/10, become briefly professional

RESOLUTION CRITERIA (all three required):
1. A specific refund date, not a range
2. Email confirmation sent
3. Acknowledgment of the embarrassment of the card declining in public`,
    openingMessage: `Hi. I need to report an error on your end. You charged me twice last week and my card declined at a supermarket today because of it. I sent an email three days ago. I haven't heard anything: do something about this.`,
  },








  {
    id: 'confused',
    name: 'Gerald Williams',
    difficulty: 'Medium',
    tone: 'Gentle, polite, mildly anxious: apologetic by nature',
    intent: 'Understand why his direct debit increased £20 in plain English',
    systemPrompt: `You are Gerald Williams, 67, retired teacher. You noticed your direct debit this month was £20 more than usual — up from £43 to £63. You are not angry, just worried something has gone wrong. Your wife told you to call. You are not tech-savvy and will apologise for asking questions.

BEHAVIOUR RULES:
- Agent is patient and uses plain language → relax progressively, become friendly and chatty
- Agent uses jargon (endorsements, underwriting, actuarial) → get more anxious: "I'm sorry, I'm not sure I follow"
- Agent explains clearly → "Oh I see, that makes sense actually"
- Agent is genuinely helpful → say you'll tell your wife how nice they were

RETENTION SIGNAL: Mention your wife suggested switching provider early in the conversation. If the agent catches it and addresses it, become very warm.

RESOLUTION: You are satisfied when you understand the reason in plain English and know whether you need to do anything.`,
    openingMessage: `Oh, hello. Sorry to bother you. I was just looking at my bank statement and my direct debit this month is a bit higher than usual? It's probably nothing but my wife said I should ring up and check. Is that alright?`,
  },










  {
    id: 'cancellation',
    name: 'Dominic Smith',
    difficulty: 'Hard',
    tone: 'Loud, accusatory: irrational but not completely unreasonable',
    intent: 'Find out why his policy lapsed and get it reinstated immediately',
    systemPrompt: `You are Dominic Smith, 41, self-employed builder. Your monthly payment failed because your card expired. You received two reminder emails and a text but did not read them. Your policy lapsed two days ago. You discovered this today when you had a minor bump in a car park. You are blaming the company entirely and are too angry to acknowledge your own role yet.

KEY NUANCE: You DID receive the reminders. You did not read them. The agent must guide you to this realisation yourself, but never be told directly.

ESCALATION TRIGGERS:
- Agent tries to explain it was your responsibility → "I pay you every month, the least you can do is make sure I'm covered"
- Agent mentions the reminder emails directly → "I get 100 emails a day, you expect me to read every single one?"
- Agent says the bump might not be covered → panic: "What do you mean not covered? I need this sorted TODAY"

DE-ESCALATION:
- Agent acknowledges how frightening it was to discover the lapse when you needed it most → soften slightly
- Agent focuses on solutions not blame → become more cooperative
- Breakthrough moment: if agent is consistently gentle and solution-focused, say quietly: "...I suppose I might have missed a text or something." This is the turning point.`,
    openingMessage: `Right, I need someone to explain to me why I just found out I have NO insurance. I've been paying you for THREE years. I had an incident today — someone hit my car — and I tried to report it and you're telling me I'm not covered?! What is going on? Explain NOW.`,
  },







  
  {
    id: 'impatient',
    name: 'Elizabeth Murphy',
    difficulty: 'Medium',
    tone: 'Surprised, questioning, mildly suspicious: sharp and direct',
    intent: 'Understand the 31% price increase, or leave',
    systemPrompt: `You are Elizabeth Murphy, 31, marketing manager. Your renewal quote is £94 per month, up from £72 last year. Nothing has changed: same car, same address, same job, no claims. You've read about insurance loyalty penalties and suspect this is what's happening.

QUESTIONS YOU WILL ASK IN ORDER:
1. "Why has my premium gone up 31% when nothing has changed?"
2. "Can you tell me what's specifically driving that increase?"
3. "What would a new customer pay for the same policy?"
4. "Is there anything I can do to bring it down?"

WHAT WILL NOT WORK:
- "Premiums are set by our underwriters" without specifics → "That's not an answer"
- Telling you the new customer price without offering to match it → "So you're literally charging me more for being loyal"
- Transfer attempt → "I don't want to be passed around"

RESOLUTION:
- You renew if price comes down to £78 or below
- OR if the explanation is so specific and fair you feel respected rather than exploited`,
    openingMessage: `Hi, I've just received my renewal notice and I have to say I'm quite taken aback. My premium has gone up significantly - I'm now quoted £94 a month when I paid £72 last year. Nothing has changed for me at all and no claims have been reported. Can you explain why that's happened?`,
  },
]

const EMPTY_PERSONA = {
  id: '',
  name: '',
  difficulty: 'Medium',
  tone: '',
  intent: '',
  systemPrompt: '',
  openingMessage: '',
}






export default function PersonaEditorPage() {
  const router = useRouter()
  const [personas, setPersonas] = useState(DEFAULT_PERSONAS)
  const [selected, setSelected] = useState(0)
  const [saved, setSaved] = useState(false)
  const [isNew, setIsNew] = useState(false)

  useEffect(() => {
    // Load any custom personas saved previously
    const stored = localStorage.getItem('trainbot_custom_personas')
    if (stored) {
      const custom = JSON.parse(stored)
      setPersonas([...DEFAULT_PERSONAS, ...custom])
    }
  }, [])

  function getCustomPersonas(all: typeof personas) {
    return all.filter(p => !DEFAULT_PERSONAS.find(d => d.id === p.id))
  }

  function updateField(field: string, value: string) {
    setPersonas(prev => {
      const next = [...prev]
      next[selected] = { ...next[selected], [field]: value }
      return next
    })
    setSaved(false)
  }

  function save() {
    const p = personas[selected]

    // validate required fields
    if (!p.name.trim() || !p.systemPrompt.trim() || !p.openingMessage.trim()) {
      alert('Please fill in the name, system prompt, and opening message before saving.')
      return
    }

    // auto-generate ID for new personas
    if (!p.id) {
      const newId = p.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') + '_' + Date.now()
      setPersonas(prev => {
        const next = [...prev]
        next[selected] = { ...next[selected], id: newId }
        return next
      })
    }

    // save custom personas to localStorage
    const updated = [...personas]
    if (!updated[selected].id) {
      updated[selected].id = p.name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now()
    }
    const custom = getCustomPersonas(updated)
    localStorage.setItem('trainbot_custom_personas', JSON.stringify(custom))

    setSaved(true)
    setIsNew(false)
    setTimeout(() => setSaved(false), 2000)
  }

  function addNewPersona() {
    const newPersona = { ...EMPTY_PERSONA }
    const newPersonas = [...personas, newPersona]
    setPersonas(newPersonas)
    setSelected(newPersonas.length - 1)
    setIsNew(true)
    setSaved(false)
  }

  function deletePersona(index: number) {
    const p = personas[index]
    if (DEFAULT_PERSONAS.find(d => d.id === p.id)) {
      alert('Default personas cannot be deleted.')
      return
    }
    if (!confirm(`Delete "${p.name || 'this persona'}"? This cannot be undone.`)) return

    const next = personas.filter((_, i) => i !== index)
    setPersonas(next)
    setSelected(Math.min(index, next.length - 1))

    const custom = getCustomPersonas(next)
    localStorage.setItem('trainbot_custom_personas', JSON.stringify(custom))
  }

  const p = personas[selected]
  const isDefault = DEFAULT_PERSONAS.find(d => d.id === p?.id)

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      {/* Sidebar */}
      <div className="sidebar" style={{ width: 220 }}>
        <div className="sidebar-top">
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>Persona editor</div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
            {personas.length} persona{personas.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div style={{ padding: '8px 6px', flex: 1, overflowY: 'auto' }}>
          {/* Default personas */}
          <div style={{ fontSize: 10, color: 'var(--text-tertiary)', padding: '4px 8px 6px', fontWeight: 500, letterSpacing: '0.05em' }}>
            DEFAULT
          </div>
          {personas.map((pe, i) => {
            if (!DEFAULT_PERSONAS.find(d => d.id === pe.id) && pe.id) return null
            if (!DEFAULT_PERSONAS.find(d => d.id === pe.id) && !pe.id && i !== selected) return null
            return (
              <div
                key={i}
                onClick={() => { setSelected(i); setIsNew(false) }}
                style={{
                  padding: '8px 10px', borderRadius: 6, cursor: 'pointer', marginBottom: 2,
                  background: i === selected ? 'var(--purple-light)' : 'transparent',
                  color: i === selected ? 'var(--purple)' : 'var(--text-secondary)',
                  fontSize: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontWeight: i === selected ? 500 : 400 }}>
                    {pe.name || 'New persona'}
                  </div>
                  <span className={`badge badge-${pe.difficulty.toLowerCase()}`} style={{ fontSize: 9, marginTop: 2 }}>
                    {pe.difficulty}
                  </span>
                </div>
              </div>
            )
          })}




















          {/* Custom personas */}
          {getCustomPersonas(personas).length > 0 && (
            <>
              <div style={{ fontSize: 10, color: 'var(--text-tertiary)', padding: '10px 8px 6px', fontWeight: 500, letterSpacing: '0.05em' }}>
                CUSTOM
              </div>
              {personas.map((pe, i) => {
                if (DEFAULT_PERSONAS.find(d => d.id === pe.id)) return null
                if (!pe.id) return null
                return (
                  <div
                    key={i}
                    onClick={() => { setSelected(i); setIsNew(false) }}
                    style={{
                      padding: '8px 10px', borderRadius: 6, cursor: 'pointer', marginBottom: 2,
                      background: i === selected ? 'var(--purple-light)' : 'transparent',
                      color: i === selected ? 'var(--purple)' : 'var(--text-secondary)',
                      fontSize: 12,
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: i === selected ? 500 : 400 }}>{pe.name}</div>
                      <span className={`badge badge-${pe.difficulty.toLowerCase()}`} style={{ fontSize: 9, marginTop: 2 }}>
                        {pe.difficulty}
                      </span>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); deletePersona(i) }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--coral)', padding: 2 }}
                    >
                      <i className="ti ti-trash" style={{ fontSize: 13 }} />
                    </button>
                  </div>
                )
              })}
            </>
          )}
















          {/* Unsaved new persona in sidebar */}
          {isNew && !personas[selected]?.id && (
            <div style={{ padding: '8px 10px', borderRadius: 6, background: 'var(--purple-light)', fontSize: 12, color: 'var(--purple)' }}>
              <div style={{ fontWeight: 500 }}>New persona</div>
              <div style={{ fontSize: 10, color: 'var(--purple)', opacity: 0.7 }}>Unsaved</div>
            </div>
          )}
        </div>

        <div style={{ padding: '12px 8px', borderTop: '0.5px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={addNewPersona}
          >
            <i className="ti ti-plus" /> New persona
          </button>
          <button
            className="btn btn-sm"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => router.push('/trainer')}
          >
            <i className="ti ti-arrow-left" /> Back to dashboard
          </button>
        </div>
      </div>












      {/* Editor */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{
          padding: '14px 20px',
          borderBottom: '0.5px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--bg)', flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>
              {p?.name || 'New persona'}
              {isDefault && (
                <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 400, marginLeft: 8 }}>
                  Default persona
                </span>
              )}
            </div>
            {p?.id && (
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 1 }}>ID: {p.id}</div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {!isDefault && p?.id && (
              <button
                className="btn btn-sm"
                style={{ color: 'var(--coral)' }}
                onClick={() => deletePersona(selected)}
              >
                <i className="ti ti-trash" /> Delete
              </button>
            )}
            <button className="btn btn-primary" onClick={save}>
              {saved
                ? <><i className="ti ti-check" /> Saved!</>
                : <><i className="ti ti-device-floppy" /> Save changes</>
              }
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 5 }}>Display name *</div>
              <input
                value={p?.name || ''}
                onChange={e => updateField('name', e.target.value)}
                placeholder="e.g. James — First claim"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 5 }}>Difficulty</div>
              <select
                value={p?.difficulty || 'Medium'}
                onChange={e => updateField('difficulty', e.target.value)}
                style={{
                  width: '100%', padding: '8px 10px', borderRadius: 8,
                  border: '0.5px solid var(--border)',
                  background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 12,
                }}
              >
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
              </select>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 5 }}>Emotional tone</div>
              <input
                value={p?.tone || ''}
                onChange={e => updateField('tone', e.target.value)}
                placeholder="e.g. Anxious, polite, hopeful"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 5 }}>Core intent</div>
            <input
              value={p?.intent || ''}
              onChange={e => updateField('intent', e.target.value)}
              placeholder="What does this customer want to achieve?"
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 5 }}>Opening message *</div>
            <textarea
              value={p?.openingMessage || ''}
              onChange={e => updateField('openingMessage', e.target.value)}
              placeholder="The first message the customer sends when the session starts..."
              style={{
                width: '100%', height: 80, padding: '10px 12px', borderRadius: 8,
                border: '0.5px solid var(--border)',
                background: 'var(--bg-secondary)', color: 'var(--text-primary)',
                fontSize: 12, lineHeight: 1.5, fontFamily: 'inherit', resize: 'vertical',
              }}
            />
          </div>

          <div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 5 }}>System prompt *</div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 6 }}>
              Describe who this customer is, their emotional state, escalation triggers, de-escalation path, and resolution criteria.
            </div>
            <textarea
              value={p?.systemPrompt || ''}
              onChange={e => updateField('systemPrompt', e.target.value)}
              placeholder={`You are [Name], [age], [occupation].\n\nBackground: ...\n\nEMOTIONAL STATE: ...\n\nESCALATION TRIGGERS:\n- ...\n\nDE-ESCALATION PATH:\n- ...\n\nRESOLUTION CRITERIA:\n- ...`}
              style={{
                width: '100%', height: 320, padding: '10px 12px', borderRadius: 8,
                border: '0.5px solid var(--border)',
                background: 'var(--bg-secondary)', color: 'var(--text-primary)',
                fontSize: 12, lineHeight: 1.6, fontFamily: 'monospace', resize: 'vertical',
              }}
            />
          </div>

          {isNew && (
            <div style={{ padding: '10px 14px', background: 'var(--purple-light)', borderRadius: 8, fontSize: 11, color: 'var(--purple-dark)' }}>
              <i className="ti ti-info-circle" /> Once saved, this persona will appear on the trainee dashboard for Gabriella to select.
            </div>
          )}

          {isDefault && (
            <div style={{ padding: '10px 14px', background: 'var(--amber-light)', borderRadius: 8, fontSize: 11, color: 'var(--amber)' }}>
              <i className="ti ti-alert-triangle" /> This is a default persona. Changes are saved locally and will apply to future sessions.
            </div>
          )}

        </div>
      </div>
    </div>
  )
}