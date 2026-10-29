import mongoose from 'mongoose'

const skillRequestSchema = new mongoose.Schema(
  {
    seeker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    skillRequired: { type: String, required: true, trim: true, maxlength: 120 },
    category: { type: String, required: true, trim: true, maxlength: 100 },
    preferredLevel: { type: String, required: true, enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'] },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    preferredSchedule: { type: String, required: true, trim: true, maxlength: 300 },
    additionalRequirements: { type: String, trim: true, maxlength: 1000, default: '' },
    status: { type: String, enum: ['open', 'closed'], default: 'open' },
  },
  { timestamps: true },
)

export default mongoose.model('SkillRequest', skillRequestSchema)
