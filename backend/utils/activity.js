import Activity from '../models/Activity.js'

export function recordActivity(actor, action, details) {
  return Activity.create({ actor, action, details })
}
