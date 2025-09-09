import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Table from '@/models/Table';

export async function GET() {
  try {
    await connectDB();
    
    const tables = await Table.find({})
      .populate('currentOrderId', 'orderNumber customerName status')
      .sort({ number: 1 });
    
    return NextResponse.json({ tables });
  } catch (error) {
    console.error('Error fetching tables:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tables' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await connectDB();
    
    const { number, capacity, location, notes } = await request.json();
    
    const table = new Table({
      number,
      capacity,
      location,
      notes
    });
    
    await table.save();
    
    return NextResponse.json({ table });
  } catch (error) {
    console.error('Error creating table:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Table number already exists' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create table' },
      { status: 500 }
    );
  }
}
