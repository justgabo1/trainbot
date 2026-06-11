import bcrypt from 'bcryptjs'

export const users = [
  {
    id: 'u1',
    email: 'gabriella.bata@trainbot.com',
    password: bcrypt.hashSync('password123', 10),
    role: 'trainee' as const,
    name: 'Gabriella Bata',
    cohort: '2026',
  },
  {
    id: 'u2',
    email: 'trainer@trainbot.com',
    password: bcrypt.hashSync('password123', 10),
    role: 'trainer' as const,
    name: 'Sam Trainer',
    cohort: '',
  },
]

export function findUserByEmail(email: string) {
  return users.find(u => u.email === email) ?? null
}