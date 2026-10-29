import { z } from 'zod'

const level = z.enum(['Beginner', 'Intermediate', 'Advanced', 'Expert'])

export const seekerRegistrationSchema = z.object({
  role: z.literal('seeker'),
  fullName: z.string().trim().min(2, 'Enter your full name.').max(120),
  email: z.email('Enter a valid email address.'),
  password: z.string().min(8, 'Use at least 8 characters.').max(128),
  confirmPassword: z.string(),
  contactNumber: z.string().trim().max(30).optional().default(''),
  bio: z.string().trim().max(1000).optional().default(''),
  skillsInterestedIn: z.array(z.string().trim()).max(30).optional().default([]),
}).refine((value) => value.password === value.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Passwords do not match.',
})

export const providerRegistrationSchema = z.object({
  role: z.literal('provider'),
  fullName: z.string().trim().min(2, 'Enter your full name.').max(120),
  email: z.email('Enter a valid email address.'),
  password: z.string().min(8, 'Use at least 8 characters.').max(128),
  confirmPassword: z.string(),
  contactNumber: z.string().trim().max(30).optional().default(''),
  bio: z.string().trim().max(1000).optional().default(''),
  location: z.string().trim().min(2, 'Enter your location.').max(160),
  experience: z.string().trim().min(2, 'Describe your experience.').max(1000),
}).refine((value) => value.password === value.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Passwords do not match.',
})

export const skillRequestSchema = z.object({
  skillRequired: z.string().trim().min(2, 'Enter the skill you want to learn.').max(120),
  category: z.string().trim().min(2, 'Enter a category.').max(100),
  preferredLevel: level,
  description: z.string().trim().min(10, 'Add a little more detail.').max(2000),
  preferredSchedule: z.string().trim().min(2, 'Enter your preferred schedule.').max(300),
  additionalRequirements: z.string().trim().max(1000).optional().default(''),
})

export const exchangeRequestSchema = z.object({
  skill: z.string().min(1, 'Select a provider skill.'),
  skillToLearn: z.string().trim().min(2, 'Enter the skill you want to learn.').max(120),
  skillOffered: z.string().trim().min(2, 'Enter a skill you can offer in exchange.').max(120),
  preferredDateTime: z.string().min(1, 'Choose a preferred date and time.').refine(
    (value) => new Date(value) > new Date(),
    'Choose a future date and time.',
  ),
  message: z.string().trim().min(10, 'Add a short introduction.').max(1500),
})

export const feedbackSchema = z.object({
  exchange: z.string().min(1, 'Select a completed exchange.'),
  to: z.string().min(1, 'Choose the other exchange participant.'),
  rating: z.coerce.number().int().min(1).max(5),
  review: z.string().trim().min(5, 'Please add a short review.').max(2000),
})

export const adminLoginSchema = z.object({
  email: z.email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.').max(128),
})

export const skillSchema = z.object({
  name: z.string().trim().min(2, 'Enter a skill name.').max(120),
  category: z.string().trim().min(2, 'Choose a category.').max(100),
  level,
  description: z.string().trim().min(10, 'Add a short description.').max(2000),
  experience: z.string().trim().max(1000).optional().default(''),
  availability: z.string().trim().min(2, 'Enter your availability.').max(300),
  mode: z.enum(['In person', 'Online', 'Either']),
})

export const adminSkillCreateSchema = skillSchema.extend({
  provider: z.string().min(1, 'Select an active provider.'),
})

export const skillManagementSchema = skillSchema.extend({
  status: z.enum(['active', 'inactive']),
})

export const adminSkillManagementSchema = skillSchema.extend({
  status: z.enum(['active', 'inactive', 'flagged']),
})

export const requestManagementSchema = z.object({
  exchange: z.string().min(1, 'Select an incoming request.'),
  status: z.enum(['accepted', 'rejected', 'active', 'completed']),
  providerResponse: z.string().trim().max(1500).optional().default(''),
})

export const userManagementSchema = z.object({
  user: z.string().min(1, 'Select a user.'),
  fullName: z.string().trim().min(2, 'Enter a name.').max(120),
  email: z.email('Enter a valid email address.'),
  contactNumber: z.string().trim().max(30).optional().default(''),
  bio: z.string().trim().max(1000).optional().default(''),
  location: z.string().trim().max(160).optional().default(''),
  active: z.boolean(),
})

export const categorySchema = z.object({
  name: z.string().trim().min(2, 'Enter a category name.').max(100),
  description: z.string().trim().max(500).optional().default(''),
})

export const platformManagementSchema = z.object({
  exchange: z.string().min(1, 'Select an exchange.'),
  status: z.enum(['requested', 'accepted', 'rejected', 'active', 'completed', 'cancelled']),
  providerResponse: z.string().trim().max(1500).optional().default(''),
})
