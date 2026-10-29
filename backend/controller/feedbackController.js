import Exchange from '../models/Exchange.js'
import Feedback from '../models/Feedback.js'
import { recordActivity } from '../utils/activity.js'
import { feedbackSchema } from '../utils/schemas.js'
import { validate } from '../utils/validation.js'

export async function listFeedback(req, res, next) {
  try {
    const filter = req.user.role === 'admin'
      ? {}
      : { $or: [{ from: req.user.id }, { to: req.user.id }] }
    const feedback = await Feedback.find(filter)
      .populate('from to', 'fullName role')
      .populate('exchange', 'skillToLearn status')
      .sort({ createdAt: -1 })
      .limit(200)
    return res.json({ feedback })
  } catch (error) {
    return next(error)
  }
}

export async function createFeedback(req, res, next) {
  try {
    const data = validate(feedbackSchema, req.body)
    const exchange = await Exchange.findById(data.exchange)
    if (!exchange || exchange.status !== 'completed') {
      return res.status(400).json({ message: 'Feedback is available after an exchange is completed.' })
    }

    const isSeeker = exchange.seeker.equals(req.user.id)
    const isProvider = exchange.provider.equals(req.user.id)
    const otherParticipant = isSeeker ? exchange.provider : exchange.seeker
    if ((!isSeeker && !isProvider) || !otherParticipant.equals(data.to)) {
      return res.status(403).json({ message: 'Feedback must be for the other participant in your exchange.' })
    }

    const feedback = await Feedback.create({ ...data, from: req.user.id })
    await recordActivity(req.user.id, 'feedback.created', `Rated an exchange ${feedback.rating} out of 5`)
    await feedback.populate('from to', 'fullName role')
    return res.status(201).json({ feedback })
  } catch (error) {
    return next(error)
  }
}
