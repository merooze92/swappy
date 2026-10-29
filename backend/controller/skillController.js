import { z } from 'zod'
import Skill from '../models/Skill.js'
import SkillRequest from '../models/SkillRequest.js'
import Category from '../models/Category.js'
import User from '../models/User.js'
import { recordActivity } from '../utils/activity.js'
import { adminSkillSchema, categorySchema, skillRequestSchema, skillRequestUpdateSchema, skillSchema, skillStatusSchema } from '../utils/schemas.js'
import { notFound, validate } from '../utils/validation.js'

export async function listSkills(req, res, next) {
  try {
    const filter = req.user.role === 'admin'
      ? {}
      : req.user.role === 'provider'
        ? { owner: req.user.id }
        : { status: 'active' }
    const search = String(req.query.search || '').trim().slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const category = String(req.query.category || '').trim()
    if (search) filter.$or = [{ name: { $regex: search, $options: 'i' } }, { description: { $regex: search, $options: 'i' } }]
    if (category) filter.category = category
    const ownerPopulation = {
      path: 'owner',
      select: 'fullName location bio',
      ...(req.user.role === 'seeker' ? { match: { active: true } } : {}),
    }
    const results = await Skill.find(filter).populate(ownerPopulation).sort({ createdAt: -1 }).limit(200)
    const skills = req.user.role === 'seeker' ? results.filter((skill) => skill.owner) : results
    return res.json({ skills })
  } catch (error) {
    return next(error)
  }
}

export async function createSkill(req, res, next) {
  try {
    const data = validate(skillSchema, req.body)
    const skill = await Skill.create({ ...data, owner: req.user.id })
    await recordActivity(req.user.id, 'skill.created', `Offered ${skill.name}`)
    return res.status(201).json({ skill })
  } catch (error) {
    return next(error)
  }
}

export async function createAdminSkill(req, res, next) {
  try {
    const data = validate(adminSkillSchema, req.body)
    const owner = await User.findOne({ _id: data.provider, role: 'provider', active: true })
    if (!owner) return res.status(404).json({ message: 'Choose an active skill provider.' })
    const { provider, ...skillData } = data
    const skill = await Skill.create({ ...skillData, owner: provider })
    await recordActivity(req.user.id, 'skill.created', `Added ${skill.name} for ${owner.fullName}`)
    await skill.populate('owner', 'fullName email')
    return res.status(201).json({ skill })
  } catch (error) {
    return next(error)
  }
}

export async function updateOwnSkill(req, res, next) {
  try {
    const data = validate(skillSchema.partial().extend({ status: skillStatusSchema.optional() }), req.body)
    if (data.status === 'flagged') return res.status(400).json({ message: 'Only administrators can flag skills.' })
    const skill = await Skill.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id },
      data,
      { new: true, runValidators: true },
    )
    if (!skill) return notFound(res, 'Skill not found.')
    await recordActivity(req.user.id, 'skill.updated', `Updated ${skill.name}`)
    return res.json({ skill })
  } catch (error) {
    return next(error)
  }
}

export async function createSkillRequest(req, res, next) {
  try {
    const data = validate(skillRequestSchema, req.body)
    const request = await SkillRequest.create({ ...data, seeker: req.user.id })
    await recordActivity(req.user.id, 'request.created', `Requested help with ${request.skillRequired}`)
    return res.status(201).json({ request })
  } catch (error) {
    return next(error)
  }
}

export async function listSkillRequests(req, res, next) {
  try {
    const filter = req.user.role === 'admin' ? {} : { seeker: req.user.id }
    const requests = await SkillRequest.find(filter).populate('seeker', 'fullName email').sort({ createdAt: -1 }).limit(200)
    return res.json({ requests })
  } catch (error) {
    return next(error)
  }
}

export async function updateOwnSkillRequest(req, res, next) {
  try {
    const data = validate(skillRequestUpdateSchema, req.body)
    const request = await SkillRequest.findOneAndUpdate(
      { _id: req.params.id, seeker: req.user.id },
      data,
      { new: true, runValidators: true },
    )
    if (!request) return notFound(res, 'Skill request not found.')
    await recordActivity(req.user.id, 'request.updated', `Updated request for ${request.skillRequired}`)
    return res.json({ request })
  } catch (error) {
    return next(error)
  }
}

export async function listCategories(req, res, next) {
  try {
    const categories = await Category.find(req.user.role === 'admin' ? {} : { active: true }).sort({ name: 1 })
    return res.json({ categories })
  } catch (error) {
    return next(error)
  }
}

export async function createCategory(req, res, next) {
  try {
    const data = validate(categorySchema, req.body)
    const category = await Category.create(data)
    await recordActivity(req.user.id, 'category.created', `Created category ${category.name}`)
    return res.status(201).json({ category })
  } catch (error) {
    return next(error)
  }
}

export async function updateCategory(req, res, next) {
  try {
    const data = validate(categorySchema.partial().extend({ active: z.boolean().optional() }), req.body)
    const category = await Category.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true })
    if (!category) return notFound(res, 'Category not found.')
    await recordActivity(req.user.id, 'category.updated', `Updated category ${category.name}`)
    return res.json({ category })
  } catch (error) {
    return next(error)
  }
}

export async function updateAdminSkill(req, res, next) {
  try {
    const data = validate(skillSchema.partial().extend({ status: skillStatusSchema.optional() }), req.body)
    const skill = await Skill.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true })
      .populate('owner', 'fullName email')
    if (!skill) return notFound(res, 'Skill not found.')
    await recordActivity(req.user.id, 'skill.moderated', `${skill.status}: ${skill.name}`)
    return res.json({ skill })
  } catch (error) {
    return next(error)
  }
}

export async function deleteAdminSkill(req, res, next) {
  try {
    const skill = await Skill.findByIdAndUpdate(req.params.id, { status: 'inactive' }, { new: true })
    if (!skill) return notFound(res, 'Skill not found.')
    await recordActivity(req.user.id, 'skill.archived', `Archived ${skill.name}`)
    return res.json({ message: 'Skill archived.' })
  } catch (error) {
    return next(error)
  }
}
