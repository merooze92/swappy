import mongoose from 'mongoose'

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 500, default: '' },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
)

export default mongoose.model('Category', categorySchema)
