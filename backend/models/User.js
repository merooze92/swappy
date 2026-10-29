import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['seeker', 'provider', 'admin'], required: true },
    contactNumber: { type: String, trim: true, maxlength: 30, default: '' },
    bio: { type: String, trim: true, maxlength: 1000, default: '' },
    skillsInterestedIn: [{ type: String, trim: true }],
    location: { type: String, trim: true, maxlength: 160, default: '' },
    experience: { type: String, trim: true, maxlength: 1000, default: '' },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
)

export default mongoose.model('User', userSchema)
