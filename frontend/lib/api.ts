import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://trainbot2026.onrender.com/api'
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('trainbot_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const login = (email: string, password: string) =>
  api.post('/auth/login', { email, password })

export const getPersonas = () =>
  api.get('/personas')

export const startSession = (personaId: string) =>
  api.post('/chat/start', { personaId })

export const sendMessage = (sessionId: string, message: string) =>
  api.post('/chat/message', { sessionId, message })

export const endSession = (sessionId: string) =>
  api.post('/chat/end', { sessionId })

export const scoreSession = (transcript: any[], personaName: string) =>
  api.post('/eval/score', { transcript, personaName })

export const getTrainerStats = () =>
  api.get('/trainer/stats')

export default api