import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import WorkPeriod from '@/models/WorkPeriod';
import { getPeriodStats } from '@/lib/work-period';

export const dynamic = 'force-dynamic';

// POST /api/work-period/end  -> END the open work period
// body: { force?: boolean, notes?: string }
export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json().catch(() => ({}));

    const workPeriod = await WorkPeriod.findOne({ status: 'open' });
    if (!workPeriod) {
      return NextResponse.json(
        { error: 'There is no open work period' },
        { status: 404 }
      );
    }

    const stats = await getPeriodStats(workPeriod._id);

    // Pending / preparing / ready orders block ending unless force is set
    if (stats.openOrders > 0 && !body.force) {
      return NextResponse.json(
        {
          error: `${stats.openOrders} order(s) are not completed yet`,
          openOrders: stats.openOrders,
          requiresForce: true
        },
        { status: 409 }
      );
    }

    // The status:'open' condition prevents closing the same period twice
    const closed = await WorkPeriod.findOneAndUpdate(
      { _id: workPeriod._id, status: 'open' },
      {
        $set: {
          status: 'closed',
          endedAt: new Date(),
          notes: body.notes ?? workPeriod.notes,
          summary: {
            totalOrders: stats.totalOrders,
            totalSales: stats.totalSales,
            cashSales: stats.cashSales,
            cardSales: stats.cardSales,
            otherSales: stats.otherSales,
            cancelledOrders: stats.cancelledOrders
          }
        }
      },
      { new: true }
    ).lean();

    if (!closed) {
      return NextResponse.json(
        { error: 'This work period has already been ended' },
        { status: 409 }
      );
    }

    return NextResponse.json({ workPeriod: closed });
  } catch (error) {
    console.error('Error ending work period:', error);
    return NextResponse.json(
      { error: 'Failed to end work period' },
      { status: 500 }
    );
  }
}
