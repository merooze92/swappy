import 'dotenv/config'
import bcrypt from 'bcryptjs'
import cors from 'cors'
import express from 'express'
import mongoose from 'mongoose'
import connectDB from './connection.js'
import User from './models/User.js'
import adminRoutes from './routes/adminRoutes.js'
import authRoutes from './routes/authRoutes.js'
import exchangeRoutes from './routes/exchangeRoutes.js'
import feedbackRoutes from './routes/feedbackRoutes.js'
import skillRoutes from './routes/skillRoutes.js'

const app = express()
const port = Number(process.env.PORT || 5000)
const allowedOrigins = [
  process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  'http://localhost:5174',
]

app.disable('x-powered-by')
app.use(cors({
  origin: (origin, callback) => callback(null, !origin || allowedOrigins.includes(origin)),
}))
app.use(express.json({ limit: '100kb' }))

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' })
})
app.use('/api/auth', authRoutes)
app.use('/api/skills', skillRoutes)
app.use('/api/exchanges', exchangeRoutes)
app.use('/api/feedback', feedbackRoutes)
app.use('/api/admin', adminRoutes)

app.use((req, res) => res.status(404).json({ message: 'API route not found.' }))
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error)
  if (error.code === 11000) return res.status(409).json({ message: 'A record with that value already exists.' })
  if (error.name === 'ValidationError') return res.status(400).json({ message: error.message })
  if (error.name === 'CastError') return res.status(400).json({ message: 'Invalid record identifier.' })
  const status = Number.isInteger(error.status) ? error.status : 500
  if (status >= 500) console.error(error)
  return res.status(status).json({ message: status === 500 ? 'A server error occurred. Please try again.' : error.message })
})

async function ensureAdminAccount() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const password = process.env.ADMIN_PASSWORD
  if (!email || !password || password.length < 12) {
    throw new Error('Set ADMIN_EMAIL and an ADMIN_PASSWORD of at least 12 characters in backend/.env.')
  }
  const passwordHash = await bcrypt.hash(password, 12)
  const existingAdmin = await User.findOne({ email }).select('+passwordHash')
  if (existingAdmin && existingAdmin.role !== 'admin') {
    throw new Error('ADMIN_EMAIL is already used by a non-administrator account.')
  }
  if (existingAdmin) {
    existingAdmin.fullName = 'SWAPPY Administrator'
    existingAdmin.passwordHash = passwordHash
    existingAdmin.active = true
    await existingAdmin.save()
    return
  }
  await User.create({
    fullName: 'SWAPPY Administrator',
    email,
    passwordHash,
    role: 'admin',
    bio: 'Platform administrator',
  })
}

async function start() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('Set JWT_SECRET to a random secret of at least 32 characters in backend/.env.')
  }
  await connectDB()
  await ensureAdminAccount()
  app.listen(port, '0.0.0.0', () => console.log(`SWAPPY API listening on http://localhost:${port}`))
}

start().catch((error) => {
  const message = String(error.message).replace(/mongodb(?:\+srv)?:\/\/\S+/gi, '[MongoDB connection string]')
  console.error('SWAPPY API startup failed:', error.name, message)
  mongoose.disconnect().catch((disconnectError) => {
    console.error('MongoDB disconnect failed:', disconnectError.message)
  })
  process.exitCode = 1
})
