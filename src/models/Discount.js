import mongoose from 'mongoose';

const DiscountSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: false,
    unique: true,
    sparse: true, // Allows multiple null values
    uppercase: true
  },
  type: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true
  },
  value: {
    type: Number,
    required: true,
    min: 0
  },
  minOrderAmount: {
    type: Number,
    default: 0
  },
  maxDiscountAmount: {
    type: Number,
    required: false // Only for percentage discounts
  },
  isActive: {
    type: Boolean,
    default: true
  },
  validFrom: {
    type: Date,
    default: Date.now
  },
  validUntil: {
    type: Date,
    required: false
  },
  usageLimit: {
    type: Number,
    required: false // null means unlimited
  },
  usageCount: {
    type: Number,
    default: 0
  },
  applicableCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  applicableItems: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
DiscountSchema.index({ code: 1 });
DiscountSchema.index({ isActive: 1 });
DiscountSchema.index({ validFrom: 1, validUntil: 1 });

export default mongoose.models.Discount || mongoose.model('Discount', DiscountSchema);
