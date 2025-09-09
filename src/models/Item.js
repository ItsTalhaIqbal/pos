import mongoose from 'mongoose';

const ItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: false
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  preparationTime: {
    type: Number, // in minutes
    default: 15
  },
  image: {
    type: String,
    required: false
  },
  ingredients: [{
    type: String
  }],
  allergens: [{
    type: String
  }],
  nutritionInfo: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number
  },
  tags: [{
    type: String // vegetarian, vegan, spicy, etc.
  }],
  popularity: {
    type: Number,
    default: 0
  },
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
ItemSchema.index({ name: 'text', description: 'text' });
ItemSchema.index({ categoryId: 1 });
ItemSchema.index({ isAvailable: 1 });
ItemSchema.index({ popularity: -1 });

export default mongoose.models.Item || mongoose.model('Item', ItemSchema);
