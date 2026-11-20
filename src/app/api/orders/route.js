import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import Table from '@/models/Table';
import WorkPeriod from '@/models/WorkPeriod';

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const status = searchParams.get('status');
    const workPeriodParam = searchParams.get('workPeriod');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 50;

    // Build query
    const query = {};

    if (workPeriodParam) {
      // ?workPeriod=<id>  ya  ?workPeriod=current
      if (workPeriodParam === 'current') {
        const current = await WorkPeriod.findOne({ status: 'open' }).select('_id').lean();
        if (!current) {
          return NextResponse.json({
            orders: [],
            pagination: { page, limit, total: 0, pages: 0 }
          });
        }
        query.workPeriod = current._id;
      } else {
        query.workPeriod = workPeriodParam;
      }
    } else if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);

      query.createdAt = {
        $gte: startDate,
        $lt: endDate
      };
    } else {
      // Default to today's orders
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      query.createdAt = {
        $gte: today,
        $lt: tomorrow
      };
    }

    if (status) {
      query.status = status;
    }

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('tableId', 'number location')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit)
        .lean(),
      Order.countDocuments(query)
    ]);

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await connectDB();

    // Work period open na ho to order punch nahi hoga
    const workPeriod = await WorkPeriod.findOne({ status: 'open' }).select('_id').lean();
    if (!workPeriod) {
      return NextResponse.json(
        {
          error: 'Work period start nahi hai. Pehle work period start karo.',
          code: 'NO_WORK_PERIOD'
        },
        { status: 403 }
      );
    }

    const orderData = await request.json();

    // Generate order number
    const orderCount = await Order.countDocuments();
    const orderNumber = `ORD${String(orderCount + 1).padStart(4, '0')}`;

    const order = new Order({
      ...orderData,
      orderNumber,
      workPeriod: workPeriod._id // client se aaya hua workPeriod hamesha override
    });

    await order.save();

    const populatedOrder = await Order.findById(order._id)
      .populate('tableId', 'number location');

    return NextResponse.json(populatedOrder, { status: 201 });

  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
