import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { findUserByEmail } from '../data/users'

const router = Router()

router.post('/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' })
  }

  const user = findUserByEmail(email)
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }

  const match = await bcrypt.compare(password, user.password)
  if (!match) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }

  const token = jwt.sign(
    { id: user.id, role: user.role, name: user.name },
    process.env.JWT_SECRET || 'trainbot2025secretkey',
    { expiresIn: '8h' }
  )

  res.json({ token, role: user.role, name: user.name })
})

export default router