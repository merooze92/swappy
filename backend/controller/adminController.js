import Activity from '../models/Activity.js'
import Exchange from '../models/Exchange.js'
import User from '../models/User.js'
import { recordActivity } from '../utils/activity.js'
import { userUpdateSchema } from '../utils/schemas.js'
import { notFound, validate } from '../utils/validation.js'

export async function listUsers(req, res, next) {
  try {
    const search = String(req.query.search || '').trim().slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const role = ['seeker', 'provider', 'admin'].includes(req.query.role) ? req.query.role : undefined
    const filter = {
      ...(role ? { role } : {}),
      ...(search ? { $or: [{ fullName: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }] } : {}),
    }
    const users = await User.find(filter).select('-passwordHash').sort({ createdAt: -1 }).limit(300)
    return res.json({ users })
  } catch (error) {
    return next(error)
  }
}

export async function updateUser(req, res, next) {
  try {
    const data = validate(userUpdateSchema, req.body)
    if (req.params.id === req.user.id && data.active === false) {
      return res.status(400).json({ message: 'You cannot deactivate your own administrator account.' })
    }
    if (data.email) data.email = data.email.toLowerCase()
    const user = await User.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true }).select('-passwordHash')
    if (!user) return notFound(res, 'User not found.')
    await recordActivity(req.user.id, 'user.updated', `Updated account ${user.email}`)
    return res.json({ user })
  } catch (error) {
    return next(error)
  }
}

export async function listAllExchanges(req, res, next) {
  try {
    const exchanges = await Exchange.find()
      .populate('seeker provider', 'fullName email active')
      .populate('skill', 'name category')
      .sort({ createdAt: -1 })
      .limit(500)
    return res.json({ exchanges })
  } catch (error) {
    return next(error)
  }
}

export async function listActivity(req, res, next) {
  try {
    const activity = await Activity.find()
      .populate('actor', 'fullName email role')
      .sort({ createdAt: -1 })
      .limit(100)
    return res.json({ activity })
  } catch (error) {
    return next(error)
  }
}
