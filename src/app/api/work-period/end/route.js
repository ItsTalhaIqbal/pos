import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import WorkPeriod from '@/models/WorkPeriod';
import { getPeriodStats } from '@/lib/work-period';

export const dynamic = 'force-dynamic';

// POST /api/work-period/end  -> open work period END
// body: { closingCash: number, force?: boolean, notes?: string }
export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json().catch(() => ({}));
    const closingCash = Number(body.closingCash);

    if (body.closingCash === '' || body.closingCash == null || Number.isNaN(closingCash) || closingCash < 0) {
      return NextResponse.json(
        { error: 'Closing cash (counter me jitna cash hai) likho' },
        { status: 400 }
      );
    }

    const workPeriod = await WorkPeriod.findOne({ status: 'open' });
    if (!workPeriod) {
      return NextResponse.json(
        { error: 'Koi open work period nahi hai' },
        { status: 404 }
      );
    }

    const stats = await getPeriodStats(workPeriod._id);

    // Pending / preparing / ready orders hon to bina force end nahi hoga
    if (stats.openOrders > 0 && !body.force) {
      return NextResponse.json(
        {
          error: `${stats.openOrders} order(s) abhi complete nahi hue`,
          openOrders: stats.openOrders,
          requiresForce: true
        },
        { status: 409 }
      );
    }

    const expectedCash = (workPeriod.openingCash || 0) + stats.cashSales;

    // status:'open' condition ki wajah se double-close nahi ho sakta
    const closed = await WorkPeriod.findOneAndUpdate(
      { _id: workPeriod._id, status: 'open' },
      {
        $set: {
          status: 'closed',
          endedAt: new Date(),
          closingCash,
          notes: body.notes ?? workPeriod.notes,
          summary: {
            totalOrders: stats.totalOrders,
            totalSales: stats.totalSales,
            cashSales: stats.cashSales,
            cardSales: stats.cardSales,
            otherSales: stats.otherSales,
            cancelledOrders: stats.cancelledOrders,
            expectedCash,
            cashDifference: closingCash - expectedCash
          }
        }
      },
      { new: true }
    ).lean();

    if (!closed) {
      return NextResponse.json(
        { error: 'Work period pehle hi end ho chuka hai' },
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
