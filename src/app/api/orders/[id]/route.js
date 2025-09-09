import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import Table from '@/models/Table';

export async function GET(request, { params }) {
  try {
    await connectDB();
    
    const order = await Order.findById(params.id)
      .populate('tableId', 'number location')
      .populate('tableId', 'number location');
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(order);

  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    await connectDB();
    
    const updateData = await request.json();
    
    // Find the current order to check table info before updating
    const currentOrder = await Order.findById(params.id).populate('tableId');
    
    if (!currentOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }
    
    // Update the order
    const order = await Order.findByIdAndUpdate(
      params.id,
      { 
        ...updateData,
        updatedAt: new Date()
      },
      { new: true }
    ).populate('tableId', 'number location');
    
    // If the order status is being updated to completed or cancelled,
    // and the order has a table, make the table available
    if (updateData.status && ['completed', 'cancelled'].includes(updateData.status)) {
      if (currentOrder.tableId && currentOrder.orderType === 'dine-in') {
        await Table.findByIdAndUpdate(
          currentOrder.tableId._id,
          { 
            status: 'available',
            currentOrderId: null,
            updatedAt: new Date()
          }
        );
      }
    }

    return NextResponse.json(order);

  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    
    const order = await Order.findByIdAndDelete(params.id);
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Order deleted successfully' });

  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json(
      { error: 'Failed to delete order' },
      { status: 500 }
    );
  }
}
