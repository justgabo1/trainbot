export type Difficulty = 'easy' | 'medium' | 'hard'

export interface Persona {
  id: string
  name: string
  icon: string
  tone: string
  intent: string
  difficulty: Difficulty
  scenario: string
  openingMessage: string
}

export interface ChatMessage {
  role: 'customer' | 'agent'
  content: string
  timestamp?: number
}

export interface EvalResult {
  empathyScore: number
  resolved: boolean
  avgResponseTime: number
  feedback: { type: 'positive' | 'improvement'; text: string }[]
}

export interface SessionResult {
  transcript: { role: 'user' | 'assistant'; content: string }[]
  personaId: string
  personaName: string
  durationSeconds: number
  turnCount: number
}
