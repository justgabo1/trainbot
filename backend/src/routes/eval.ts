import { Router } from 'express'
import { verifyJWT } from '../middleware/verifyJWT'
import { scoreTranscript } from '../services/openai'

const router = Router()

router.post('/score', verifyJWT, async (req, res) => {
  const { transcript, personaName } = req.body
  if (!transcript || !personaName) {
    return res.status(400).json({ error: 'transcript and personaName required' })
  }
  try {
    const result = await scoreTranscript(transcript, personaName)
    res.json(result)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router