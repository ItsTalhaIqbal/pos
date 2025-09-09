import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Category from '@/models/Category';
import Item from '@/models/Item';

export async function GET(request, { params }) {
  try {
    await connectDB();

    const category = await Category.findById(params.id);

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ category });

  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    await connectDB();

    const categoryData = await request.json();
    
    const category = await Category.findByIdAndUpdate(
      params.id,
      { ...categoryData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ category });

  } catch (error) {
    console.error('Error updating category:', error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Category name already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();

    // Check if there are items using this category
    const itemsCount = await Item.countDocuments({ categoryId: params.id });
    
    if (itemsCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete category. It has ${itemsCount} items associated with it. Please reassign or delete those items first.` },
        { status: 409 }
      );
    }

    const category = await Category.findByIdAndDelete(params.id);

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      message: 'Category deleted successfully',
      category 
    });

  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}
