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
  openingCash: {
    type: Number,
    default: 0
  },
  closingCash: {
    type: Number // counter me jitna cash gina gaya
  },
  notes: {
    type: String,
    default: ''
  },
  // Work period end hone par yahan summary save hoti hai
  summary: {
    totalOrders: Number,
    totalSales: Number,
    cashSales: Number,
    cardSales: Number,
    otherSales: Number,
    cancelledOrders: Number,
    expectedCash: Number,
    cashDifference: Number
  }
}, {
  timestamps: true
});

WorkPeriodSchema.index({ startedAt: -1 });

// Ek waqt me sirf EK open work period ho sakta hai (database level guarantee).
// Do devices se ek saath start dabane par bhi dusra reject ho jayega.
WorkPeriodSchema.index(
  { status: 1 },
  { unique: true, partialFilterExpression: { status: 'open' } }
);

export default mongoose.models.WorkPeriod || mongoose.model('WorkPeriod', WorkPeriodSchema);
