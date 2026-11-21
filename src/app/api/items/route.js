import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Item from '@/models/Item';

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('search');

    // Menu management passes includeUnavailable=true so hidden items stay visible there.
    // The POS does not, so unavailable items never show up at the counter.
    const includeUnavailable = searchParams.get('includeUnavailable') === 'true';

    let query = includeUnavailable ? {} : { isAvailable: true };

    if (categoryId) {
      query.categoryId = categoryId;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const items = await Item.find(query)
      .populate('categoryId', 'name color')
      .sort({ popularity: -1, name: 1 });

    return NextResponse.json({ items });

  } catch (error) {
    console.error('Error fetching items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch items' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await connectDB();

    const itemData = await request.json();
    const item = new Item(itemData);
    await item.save();

    const populatedItem = await Item.findById(item._id)
      .populate('categoryId', 'name color');

    return NextResponse.json(populatedItem, { status: 201 });

  } catch (error) {
    console.error('Error creating item:', error);
    return NextResponse.json(
      { error: 'Failed to create item' },
      { status: 500 }
    );
  }
}
