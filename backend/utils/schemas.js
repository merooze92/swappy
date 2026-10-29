import { z } from 'zod'

const levels = ['Beginner', 'Intermediate', 'Advanced', 'Expert']
export const skillStatusSchema = z.enum(['active', 'inactive', 'flagged'])

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2).max(120),
    email: z.email().max(254),
    password: z.string().min(8).max(128),
    confirmPassword: z.string(),
    contactNumber: z.string().trim().max(30).optional().default(''),
    bio: z.string().trim().max(1000).optional().default(''),
    skillsInterestedIn: z.array(z.string().trim().max(100)).max(30).optional().default([]),
    location: z.string().trim().max(160).optional().default(''),
    experience: z.string().trim().max(1000).optional().default(''),
    role: z.enum(['seeker', 'provider']),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match.',
  })

export const loginSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(128),
})

export const skillSchema = z.object({
  name: z.string().trim().min(2).max(120),
  category: z.string().trim().min(2).max(100),
  level: z.enum(levels),
  description: z.string().trim().min(10).max(2000),
  experience: z.string().trim().max(1000).optional().default(''),
  availability: z.string().trim().min(2).max(300),
  mode: z.enum(['In person', 'Online', 'Either']),
})

export const adminSkillSchema = skillSchema.extend({
  provider: z.string().regex(/^[a-f\d]{24}$/i, 'Choose a valid skill provider.'),
})

export const skillRequestSchema = z.object({
  skillRequired: z.string().trim().min(2).max(120),
  category: z.string().trim().min(2).max(100),
  preferredLevel: z.enum(levels),
  description: z.string().trim().min(10).max(2000),
  preferredSchedule: z.string().trim().min(2).max(300),
  additionalRequirements: z.string().trim().max(1000).optional().default(''),
})

export const skillRequestUpdateSchema = skillRequestSchema.partial().extend({
  status: z.enum(['open', 'closed']).optional(),
})

export const exchangeSchema = z.object({
  skill: z.string().regex(/^[a-f\d]{24}$/i, 'Choose a valid listed skill.'),
  skillToLearn: z.string().trim().min(2).max(120),
  skillOffered: z.string().trim().min(2).max(120),
  preferredDateTime: z.coerce.date().refine((value) => value > new Date(), 'Choose a future date and time.'),
  message: z.string().trim().min(10).max(1500),
})

export const exchangeResponseSchema = z.object({
  status: z.enum(['accepted', 'rejected', 'active', 'completed', 'cancelled']),
  providerResponse: z.string().trim().max(1500).optional().default(''),
})

export const feedbackSchema = z.object({
  exchange: z.string().regex(/^[a-f\d]{24}$/i, 'Choose a valid exchange.'),
  to: z.string().regex(/^[a-f\d]{24}$/i, 'Choose a valid exchange participant.'),
  rating: z.coerce.number().int().min(1).max(5),
  review: z.string().trim().min(5).max(2000),
})

export const categorySchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(500).optional().default(''),
})

export const userUpdateSchema = z.object({
  fullName: z.string().trim().min(2).max(120).optional(),
  email: z.email().max(254).optional(),
  contactNumber: z.string().trim().max(30).optional(),
  bio: z.string().trim().max(1000).optional(),
  location: z.string().trim().max(160).optional(),
  active: z.boolean().optional(),
})
