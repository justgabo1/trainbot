import { Session } from '../types'

const sessions = new Map<string, Session>()

export function createSession(session: Session): void {
  sessions.set(session.id, session)
}

export function getSession(id: string): Session | undefined {
  return sessions.get(id)
}

export function deleteSession(id: string): Session | undefined {
  const session = sessions.get(id)
  sessions.delete(id)
  return session
}
