import mongoose from 'mongoose';

const WorkPeriodSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['open', 'closed'],
    default: 'open'
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  endedAt: {
    type: Date
  },
  // Legacy fields: cash counting is no longer used, kept so old records still load
  openingCash: {
    type: Number,
    default: 0
  },
  closingCash: {
    type: Number
  },
  notes: {
    type: String,
    default: ''
  },
  // Summary saved when the work period is ended
  summary: {
    totalOrders: Number,
    totalSales: Number,
    cashSales: Number,
    cardSales: Number,
    otherSales: Number,
    cancelledOrders: Number
  }
}, {
  timestamps: true
});

WorkPeriodSchema.index({ startedAt: -1 });

// Only ONE open work period can exist at a time (database-level guarantee).
// If two devices press Start together, the second one is rejected.
WorkPeriodSchema.index(
  { status: 1 },
  { unique: true, partialFilterExpression: { status: 'open' } }
);

export default mongoose.models.WorkPeriod || mongoose.model('WorkPeriod', WorkPeriodSchema);
