import { Router, Response } from 'express'
import { verifyJWT, AuthRequest } from '../middleware/verifyJWT'
import { personas } from '../data/personas'

const router = Router()
router.use(verifyJWT)

// GET /api/personas
router.get('/', (_req: AuthRequest, res: Response) => {
  // return personas without the full system prompt for security
  const safe = personas.map(p => ({
    id: p.id,
    name: p.name,
    icon: p.icon,
    tone: p.tone,
    intent: p.intent,
    difficulty: p.difficulty,
    scenario: p.scenario,
    openingMessage: p.openingMessage,
  }))
  res.json(safe)
})

// GET /api/personas/:id
router.get('/:id', (req: AuthRequest, res: Response) => {
  const persona = personas.find(p => p.id === req.params.id)
  if (!persona) return res.status(404).json({ error: 'Persona not found' })

  // traoiners can see the system prompt --> trainees cannot
  const payload = req.user?.role === 'trainer'
    ? persona
    : { ...persona, systemPrompt: '[hidden]' }

  res.json(payload)
})

export default router
