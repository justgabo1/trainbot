import { Router, Response } from 'express'
import { verifyJWT, AuthRequest } from '../middleware/verifyJWT'
import { personas } from '../data/personas'
import { createSession, getSession, deleteSession } from '../data/sessions'
import { getChatResponse } from '../services/openai'
import { Session } from '../types'

const router = Router()
router.use(verifyJWT)

// POST /api/chat/start  { personaId: string }
router.post('/start', (req: AuthRequest, res: Response) => {
  const { personaId } = req.body
  const persona = personas.find(p => p.id === personaId)

  if (!persona) {
    return res.status(404).json({ error: 'Persona not found' })
  }

  const sessionId = `${req.user!.userId}-${Date.now()}`
  const session: Session = {
    id: sessionId,
    userId: req.user!.userId,
    persona,
    history: [],
    startedAt: Date.now(),
  }

  createSession(session)

  res.json({
    sessionId,
    openingMessage: persona.openingMessage,
    persona: {
      id: persona.id,
      name: persona.name,
      icon: persona.icon,
      tone: persona.tone,
      intent: persona.intent,
      difficulty: persona.difficulty,
      scenario: persona.scenario,
    },
  })
})

// POST /api/chat/message  { sessionId: string, message: string }
router.post('/message', async (req: AuthRequest, res: Response) => {
  const { sessionId, message } = req.body

  const session = getSession(sessionId)
  if (!session) {
    return res.status(404).json({ error: 'Session not found or expired' })
  }

  // add agent message
  session.history.push({
    role: 'user',
    content: message,
    timestamp: Date.now(),
  })

  try {
    const reply = await getChatResponse(session.persona, session.history)

    // add AI customer reply
    session.history.push({
      role: 'assistant',
      content: reply,
      timestamp: Date.now(),
    })

    res.json({
      reply,
      turnCount: Math.floor(session.history.length / 2),
    })
  } catch (err: any) {
    console.error('OpenAI error:', err.message)
    res.status(500).json({ error: 'Failed to get AI response. Check your the API key.' })
  }
})

// POST /api/chat/end  { sessionId: string }
router.post('/end', (req: AuthRequest, res: Response) => {
  const { sessionId } = req.body
  const session = deleteSession(sessionId)

  if (!session) {
    return res.status(404).json({ error: 'Session not found - please try again' })
  }

  const durationSeconds = Math.floor((Date.now() - session.startedAt) / 1000)

  res.json({
    transcript: session.history,
    personaId: session.persona.id,
    personaName: session.persona.name,
    durationSeconds,
    turnCount: Math.floor(session.history.length / 2),
  })
})

export default router
