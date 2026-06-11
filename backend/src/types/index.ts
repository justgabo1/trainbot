export type Role = 'trainee' | 'trainer'

export interface Persona {
  id: string
  name: string
  icon: string
  difficulty: string
  tone: string
  intent: string
  scenario: string
  systemPrompt: string
  openingMessage: string
}

export interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp?: number
}

export interface Session {
  id: string
  userId: string
  persona: Persona
  history: Message[]
  startedAt: number
}

export interface EvalResult {
  empathyScore: number
  resolved: boolean
  deEscalation: 'effective' | 'partial' | 'none' | 'inappropriate'
  responseQualityScore: number
  avgResponseTime: number
  feedback: { type: 'positive' | 'improvement'; metric: string; text: string }[]
}

export interface StoredSession {
  personaId: string
  personaName: string
  turnCount: number
  durationSeconds: number
  empathyScore: number
  resolved: boolean
  completedAt: number
}