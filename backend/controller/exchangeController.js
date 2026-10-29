import Exchange from '../models/Exchange.js'
import Skill from '../models/Skill.js'
import { recordActivity } from '../utils/activity.js'
import { exchangeResponseSchema, exchangeSchema } from '../utils/schemas.js'
import { notFound, validate } from '../utils/validation.js'

const exchangePopulation = [
  { path: 'seeker', select: 'fullName email' },
  { path: 'provider', select: 'fullName email' },
  { path: 'skill', select: 'name category level' },
]

export async function listExchanges(req, res, next) {
  try {
    const filter = req.user.role === 'admin'
      ? {}
      : { $or: [{ seeker: req.user.id }, { provider: req.user.id }] }
    const exchanges = await Exchange.find(filter).populate(exchangePopulation).sort({ createdAt: -1 }).limit(300)
    return res.json({ exchanges })
  } catch (error) {
    return next(error)
  }
}

export async function createExchange(req, res, next) {
  try {
    const data = validate(exchangeSchema, req.body)
    const skill = await Skill.findOne({ _id: data.skill, status: 'active' }).populate('owner', 'active fullName')
    if (!skill || !skill.owner?.active) return res.status(404).json({ message: 'That skill is no longer available.' })
    if (skill.owner.id === req.user.id) return res.status(400).json({ message: 'You cannot request an exchange with yourself.' })

    const exchange = await Exchange.create({
      ...data,
      seeker: req.user.id,
      provider: skill.owner.id,
      preferredDateTime: data.preferredDateTime,
    })
    await recordActivity(req.user.id, 'exchange.requested', `Requested ${data.skillToLearn} from ${skill.owner.fullName}`)
    await exchange.populate(exchangePopulation)
    return res.status(201).json({ exchange })
  } catch (error) {
    return next(error)
  }
}

export async function updateExchange(req, res, next) {
  try {
    const data = validate(exchangeResponseSchema, req.body)
    const exchange = await Exchange.findById(req.params.id)
    if (!exchange) return notFound(res, 'Exchange not found.')
    const isAdmin = req.user.role === 'admin'
    const isProvider = exchange.provider.equals(req.user.id)
    const isSeeker = exchange.seeker.equals(req.user.id)
    const allowed = isAdmin
      || (isProvider && (
        (exchange.status === 'requested' && ['accepted', 'rejected'].includes(data.status))
        || (exchange.status === 'accepted' && data.status === 'active')
        || (exchange.status === 'active' && data.status === 'completed')
      ))
      || (isSeeker && ['requested', 'accepted', 'active'].includes(exchange.status) && data.status === 'cancelled')
    if (!allowed) return res.status(403).json({ message: 'This exchange cannot be changed to that status by your account.' })

    exchange.status = data.status
    if (isProvider || isAdmin) exchange.providerResponse = data.providerResponse
    await exchange.save()
    await recordActivity(req.user.id, `exchange.${data.status}`, `Exchange ${exchange.id} is ${data.status}`)
    await exchange.populate(exchangePopulation)
    return res.json({ exchange })
  } catch (error) {
    return next(error)
  }
}
