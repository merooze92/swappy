import mongoose from 'mongoose'

const skillSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    category: { type: String, required: true, trim: true, maxlength: 100 },
    level: { type: String, required: true, enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'] },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    experience: { type: String, trim: true, maxlength: 1000, default: '' },
    availability: { type: String, required: true, trim: true, maxlength: 300 },
    mode: { type: String, required: true, enum: ['In person', 'Online', 'Either'] },
    status: { type: String, enum: ['active', 'inactive', 'flagged'], default: 'active' },
  },
  { timestamps: true },
)

export default mongoose.model('Skill', skillSchema)
