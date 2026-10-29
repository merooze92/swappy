import mongoose from 'mongoose'

const exchangeSchema = new mongoose.Schema(
  {
    seeker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    skill: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true },
    skillToLearn: { type: String, required: true, trim: true, maxlength: 120 },
    skillOffered: { type: String, required: true, trim: true, maxlength: 120 },
    preferredDateTime: { type: Date, required: true },
    message: { type: String, required: true, trim: true, maxlength: 1500 },
    providerResponse: { type: String, trim: true, maxlength: 1500, default: '' },
    status: {
      type: String,
      enum: ['requested', 'accepted', 'rejected', 'active', 'completed', 'cancelled'],
      default: 'requested',
    },
  },
  { timestamps: true },
)

export default mongoose.model('Exchange', exchangeSchema)
