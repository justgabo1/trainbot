import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { Role } from '../types'

export interface AuthRequest extends Request {
  user?: { userId: string; role: Role; name: string }
}

export function verifyJWT(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    return res.status(401).json({ error: 'No token provided at all' })
  }

  try {
    const secret = process.env.JWT_SECRET!
    const payload = jwt.verify(token, secret) as any
    req.user = { userId: payload.userId, role: payload.role, name: payload.name }
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

export function requireRole(role: Role) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user?.role !== role) {
      return res.status(403).json({ error: 'Access denied - wrong role' })
    }
    next()
  }
}
