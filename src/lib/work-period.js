import mongoose from 'mongoose';
import Order from '@/models/Order';

/**
 * Kisi work period ke orders ka live summary.
 * Cancelled orders sales me count nahi hote.
 */
export async function getPeriodStats(periodId) {
  const rows = await Order.aggregate([
    { $match: { workPeriod: new mongoose.Types.ObjectId(String(periodId)) } },
    {
      $group: {
        _id: { status: '$status', method: '$paymentMethod' },
        count: { $sum: 1 },
        total: { $sum: '$total' }
      }
    }
  ]);

  const stats = {
    totalOrders: 0,
    totalSales: 0,
    cashSales: 0,
    cardSales: 0,
    otherSales: 0,
    cancelledOrders: 0,
    openOrders: 0 // pending / preparing / ready
  };

  for (const row of rows) {
    const { status, method } = row._id;

    if (status === 'cancelled') {
      stats.cancelledOrders += row.count;
      continue;
    }

    stats.totalOrders += row.count;
    stats.totalSales += row.total;

    if (method === 'cash') stats.cashSales += row.total;
    else if (method === 'card') stats.cardSales += row.total;
    else stats.otherSales += row.total;

    if (['pending', 'preparing', 'ready'].includes(status)) {
      stats.openOrders += row.count;
    }
  }

  return stats;
}
