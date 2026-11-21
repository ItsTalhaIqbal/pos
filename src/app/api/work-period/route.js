import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import WorkPeriod from '@/models/WorkPeriod';
import { getPeriodStats } from '@/lib/work-period';

export const dynamic = 'force-dynamic';

// GET /api/work-period                         -> the currently open work period (+ live stats)
// GET /api/work-period?list=1                  -> recent work periods (each with its sales summary)
//     optional: &limit=30  &from=<ISO date>  &to=<ISO date>  (filters on start time)
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);

    if (searchParams.get('list')) {
      const limit = Math.min(parseInt(searchParams.get('limit')) || 30, 200);

      const query = {};
      const from = searchParams.get('from');
      const to = searchParams.get('to');
      if (from || to) {
        query.startedAt = {};
        if (from && !Number.isNaN(new Date(from).getTime())) query.startedAt.$gte = new Date(from);
        if (to && !Number.isNaN(new Date(to).getTime())) query.startedAt.$lte = new Date(to);
        if (Object.keys(query.startedAt).length === 0) delete query.startedAt;
      }

      const workPeriods = await WorkPeriod.find(query)
        .sort({ startedAt: -1 })
        .limit(limit)
        .lean();

      // A closed period has its summary saved. An open one is calculated live.
      for (const period of workPeriods) {
        if (period.status === 'open') {
          period.summary = await getPeriodStats(period._id);
        }
      }

      return NextResponse.json({ workPeriods });
    }

    const workPeriod = await WorkPeriod.findOne({ status: 'open' }).lean();
    const stats = workPeriod ? await getPeriodStats(workPeriod._id) : null;

    return NextResponse.json({ workPeriod, stats });
  } catch (error) {
    console.error('Error fetching work period:', error);
    return NextResponse.json(
      { error: 'Failed to fetch work period' },
      { status: 500 }
    );
  }
}

// POST /api/work-period  -> START a new work period
export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json().catch(() => ({}));

    const alreadyOpen = await WorkPeriod.findOne({ status: 'open' }).lean();
    if (alreadyOpen) {
      return NextResponse.json(
        { error: 'A work period is already open' },
        { status: 409 }
      );
    }

    try {
      const workPeriod = await WorkPeriod.create({
        notes: body.notes || ''
      });
      return NextResponse.json({ workPeriod }, { status: 201 });
    } catch (err) {
      // unique index: another device started one at the same moment
      if (err?.code === 11000) {
        return NextResponse.json(
          { error: 'A work period is already open' },
          { status: 409 }
        );
      }
      throw err;
    }
  } catch (error) {
    console.error('Error starting work period:', error);
    return NextResponse.json(
      { error: 'Failed to start work period' },
      { status: 500 }
    );
  }
}
