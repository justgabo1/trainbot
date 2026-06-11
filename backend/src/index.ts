import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth'
import chatRoutes from './routes/chat'
import evalRoutes from './routes/eval'
import personaRoutes from './routes/personas'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://trainbot-three.vercel.app',
  ],
  credentials: true,
}))
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/eval', evalRoutes)
app.use('/api/personas', personaRoutes)

app.get('/api/health', (_, res) => res.json({ ok: true }))

app.listen(PORT, () => {
  console.log(`✅  TrainBot backend running on http://localhost:${PORT}`)
})