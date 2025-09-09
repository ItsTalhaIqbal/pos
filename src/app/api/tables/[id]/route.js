import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Table from '@/models/Table';

export async function GET(request, { params }) {
  try {
    await connectDB();
    
    const table = await Table.findById(params.id)
      .populate('currentOrderId', 'orderNumber customerName status');
    
    if (!table) {
      return NextResponse.json(
        { error: 'Table not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ table });
  } catch (error) {
    console.error('Error fetching table:', error);
    return NextResponse.json(
      { error: 'Failed to fetch table' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    await connectDB();
    
    const updates = await request.json();
    console.log('Updating table with ID:', params.id);
    console.log('Updates:', updates);
    
    // Validate the status if it's being updated
    if (updates.status && !['available', 'occupied', 'reserved', 'cleaning'].includes(updates.status)) {
      return NextResponse.json(
        { error: `Invalid status: ${updates.status}` },
        { status: 400 }
      );
    }
    
    const table = await Table.findByIdAndUpdate(
      params.id,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('currentOrderId', 'orderNumber customerName status');
    
    if (!table) {
      return NextResponse.json(
        { error: 'Table not found' },
        { status: 404 }
      );
    }
    
    console.log('Table updated successfully:', table);
    return NextResponse.json({ table });
  } catch (error) {
    console.error('Error updating table:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { error: 'Failed to update table', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    
    const table = await Table.findById(params.id);
    
    if (!table) {
      return NextResponse.json(
        { error: 'Table not found' },
        { status: 404 }
      );
    }
    
    if (table.status === 'occupied') {
      return NextResponse.json(
        { error: 'Cannot delete occupied table' },
        { status: 400 }
      );
    }
    
    await Table.findByIdAndDelete(params.id);
    
    return NextResponse.json({ message: 'Table deleted successfully' });
  } catch (error) {
    console.error('Error deleting table:', error);
    return NextResponse.json(
      { error: 'Failed to delete table' },
      { status: 500 }
    );
  }
}
