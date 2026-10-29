import mongoose from 'mongoose'

const feedbackSchema = new mongoose.Schema(
  {
    exchange: { type: mongoose.Schema.Types.ObjectId, ref: 'Exchange', required: true },
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    review: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { timestamps: true },
)

feedbackSchema.index({ exchange: 1, from: 1 }, { unique: true })

export default mongoose.model('Feedback', feedbackSchema)
