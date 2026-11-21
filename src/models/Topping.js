import mongoose from 'mongoose';

// Toppings / add-ons that can be added to an item at the POS
// (e.g. Extra Beef Patty, Cheese Slice, Dip Sauce)
const ToppingSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

ToppingSchema.index({ sortOrder: 1, name: 1 });

export default mongoose.models.Topping || mongoose.model('Topping', ToppingSchema);
