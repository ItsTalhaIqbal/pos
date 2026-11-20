import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import WorkPeriod from '@/models/WorkPeriod';
import { getPeriodStats } from '@/lib/work-period';

export const dynamic = 'force-dynamic';

// GET /api/work-period            -> abhi jo open hai (+ live stats)
// GET /api/work-period?list=1     -> recent work periods ki list
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);

    if (searchParams.get('list')) {
      const limit = Math.min(parseInt(searchParams.get('limit')) || 30, 100);
      const workPeriods = await WorkPeriod.find()
        .sort({ startedAt: -1 })
        .limit(limit)
        .lean();
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

// POST /api/work-period  -> naya work period START
export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json().catch(() => ({}));
    const openingCash = Number(body.openingCash ?? 0);

    if (Number.isNaN(openingCash) || openingCash < 0) {
      return NextResponse.json(
        { error: 'Opening cash sahi likho' },
        { status: 400 }
      );
    }

    const alreadyOpen = await WorkPeriod.findOne({ status: 'open' }).lean();
    if (alreadyOpen) {
      return NextResponse.json(
        { error: 'Work period pehle se open hai' },
        { status: 409 }
      );
    }

    try {
      const workPeriod = await WorkPeriod.create({
        openingCash,
        notes: body.notes || ''
      });
      return NextResponse.json({ workPeriod }, { status: 201 });
    } catch (err) {
      // unique index: kisi aur device ne usi waqt start kar diya
      if (err?.code === 11000) {
        return NextResponse.json(
          { error: 'Work period pehle se open hai' },
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
