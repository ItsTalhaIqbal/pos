import mongoose from 'mongoose';

const TableSchema = new mongoose.Schema({
  number: {
    type: Number,
    required: true,
    unique: true
  },
  capacity: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'reserved', 'cleaning'],
    default: 'available'
  },
  currentOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: false
  },
  location: {
    type: String,
    required: false // e.g., "Window Side", "Corner", "Center"
  },
  notes: {
    type: String,
    default: ''
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
TableSchema.index({ status: 1 });

export default mongoose.models.Table || mongoose.model('Table', TableSchema);
