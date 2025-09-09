import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Category from '@/models/Category';
import Item from '@/models/Item';
import Table from '@/models/Table';

export async function POST() {
  try {
    await connectDB();

    // Clear existing data
    await Category.deleteMany({});
    await Item.deleteMany({});
    await Table.deleteMany({});

    // Create Categories
    const categories = await Category.create([
      {
        name: 'Appetizers',
        description: 'Start your meal with these delicious appetizers',
        color: '#FF6B6B',
        sortOrder: 1
      },
      {
        name: 'Main Course',
        description: 'Hearty main dishes to satisfy your hunger',
        color: '#4ECDC4',
        sortOrder: 2
      },
      {
        name: 'Desserts',
        description: 'Sweet treats to end your meal',
        color: '#45B7D1',
        sortOrder: 3
      },
      {
        name: 'Beverages',
        description: 'Refreshing drinks and hot beverages',
        color: '#FFA07A',
        sortOrder: 4
      }
    ]);

    // Create Items
    const items = await Item.create([
      // Appetizers
      {
        name: 'Caesar Salad',
        description: 'Fresh romaine lettuce with parmesan cheese and croutons',
        price: 299,
        categoryId: categories[0]._id,
        preparationTime: 10,
        tags: ['vegetarian']
      },
      {
        name: 'Chicken Wings',
        description: 'Spicy buffalo wings served with ranch dipping sauce',
        price: 399,
        categoryId: categories[0]._id,
        preparationTime: 15,
        tags: ['spicy']
      },

      // Main Course
      {
        name: 'Grilled Chicken Breast',
        description: 'Tender grilled chicken with vegetables and mashed potatoes',
        price: 599,
        categoryId: categories[1]._id,
        preparationTime: 25,
        tags: ['protein-rich']
      },
      {
        name: 'Vegetable Pasta',
        description: 'Penne pasta with seasonal vegetables in tomato sauce',
        price: 449,
        categoryId: categories[1]._id,
        preparationTime: 20,
        tags: ['vegetarian']
      },

      // Desserts
      {
        name: 'Chocolate Cake',
        description: 'Rich chocolate cake with vanilla ice cream',
        price: 299,
        categoryId: categories[2]._id,
        preparationTime: 5,
        tags: ['sweet']
      },
      {
        name: 'Cheesecake',
        description: 'New York style cheesecake with berry compote',
        price: 349,
        categoryId: categories[2]._id,
        preparationTime: 5,
        tags: ['sweet']
      },

      // Beverages
      {
        name: 'Fresh Orange Juice',
        description: 'Freshly squeezed orange juice',
        price: 149,
        categoryId: categories[3]._id,
        preparationTime: 2,
        tags: ['fresh', 'healthy']
      },
      {
        name: 'Coffee',
        description: 'Freshly brewed coffee',
        price: 99,
        categoryId: categories[3]._id,
        preparationTime: 3
      }
    ]);

    // Create Tables
    const tables = await Table.create([
      { number: 1, capacity: 2, location: 'Window Side' },
      { number: 2, capacity: 4, location: 'Center' },
      { number: 3, capacity: 2, location: 'Corner' },
      { number: 4, capacity: 6, location: 'Private Section' },
      { number: 5, capacity: 4, location: 'Window Side' },
    ]);

    return NextResponse.json({
      message: 'Database seeded successfully!',
      data: {
        categories: categories.length,
        items: items.length,
        tables: tables.length
      }
    });

  } catch (error) {
    console.error('Error seeding database:', error);
    return NextResponse.json(
      { error: 'Failed to seed database', details: error.message },
      { status: 500 }
    );
  }
}
