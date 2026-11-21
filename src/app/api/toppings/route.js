import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Topping from '@/models/Topping';

export const dynamic = 'force-dynamic';

// GET /api/toppings                -> available toppings only (used by POS)
// GET /api/toppings?all=true       -> every topping (used by menu management)
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all') === 'true';

    const toppings = await Topping.find(all ? {} : { isAvailable: true })
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    return NextResponse.json({ toppings });
  } catch (error) {
    console.error('Error fetching toppings:', error);
    return NextResponse.json({ error: 'Failed to fetch toppings' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const name = String(body.name || '').trim();
    const price = Number(body.price);

    if (!name || Number.isNaN(price) || price < 0) {
      return NextResponse.json(
        { error: 'A name and a valid price are required' },
        { status: 400 }
      );
    }

    const topping = await Topping.create({
      name,
      price,
      isAvailable: body.isAvailable ?? true
    });

    return NextResponse.json(topping, { status: 201 });
  } catch (error) {
    if (error?.code === 11000) {
      return NextResponse.json(
        { error: 'A topping with this name already exists' },
        { status: 409 }
      );
    }
    console.error('Error creating topping:', error);
    return NextResponse.json({ error: 'Failed to create topping' }, { status: 500 });
  }
}
