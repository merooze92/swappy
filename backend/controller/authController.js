import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { loginSchema, registerSchema } from '../utils/schemas.js'
import { validate } from '../utils/validation.js'

function createToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '12h' })
}

function publicUser(user) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    bio: user.bio,
    contactNumber: user.contactNumber,
    location: user.location,
    experience: user.experience,
    skillsInterestedIn: user.skillsInterestedIn,
    active: user.active,
  }
}

export async function register(req, res, next) {
  try {
    const data = validate(registerSchema, req.body)
    const email = data.email.toLowerCase()
    if (await User.exists({ email })) return res.status(409).json({ message: 'An account with this email already exists.' })

    const passwordHash = await bcrypt.hash(data.password, 12)
    const user = await User.create({
      fullName: data.fullName,
      email,
      passwordHash,
      role: data.role,
      contactNumber: data.contactNumber,
      bio: data.bio,
      skillsInterestedIn: data.skillsInterestedIn,
      location: data.location,
      experience: data.experience,
    })

    return res.status(201).json({ token: createToken(user), user: publicUser(user) })
  } catch (error) {
    return next(error)
  }
}

export async function login(req, res, next) {
  try {
    const data = validate(loginSchema, req.body)
    const user = await User.findOne({ email: data.email.toLowerCase() }).select('+passwordHash')
    if (!user || !user.active || !(await bcrypt.compare(data.password, user.passwordHash))) {
      return res.status(401).json({ message: 'Email or password is incorrect.' })
    }

    return res.json({ token: createToken(user), user: publicUser(user) })
  } catch (error) {
    return next(error)
  }
}

export function currentUser(req, res) {
  return res.json({ user: publicUser(req.user) })
}
