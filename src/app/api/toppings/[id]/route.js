import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Topping from '@/models/Topping';

export const dynamic = 'force-dynamic';

export async function PATCH(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();

    const update = {};
    if (body.name !== undefined) update.name = String(body.name).trim();
    if (body.price !== undefined) update.price = Number(body.price);
    if (body.isAvailable !== undefined) update.isAvailable = !!body.isAvailable;

    const topping = await Topping.findByIdAndUpdate(id, update, { new: true });
    if (!topping) {
      return NextResponse.json({ error: 'Topping not found' }, { status: 404 });
    }
    return NextResponse.json(topping);
  } catch (error) {
    if (error?.code === 11000) {
      return NextResponse.json(
        { error: 'A topping with this name already exists' },
        { status: 409 }
      );
    }
    console.error('Error updating topping:', error);
    return NextResponse.json({ error: 'Failed to update topping' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const topping = await Topping.findByIdAndDelete(id);
    if (!topping) {
      return NextResponse.json({ error: 'Topping not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Topping deleted successfully' });
  } catch (error) {
    console.error('Error deleting topping:', error);
    return NextResponse.json({ error: 'Failed to delete topping' }, { status: 500 });
  }
}
