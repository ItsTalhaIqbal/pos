import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Category from '@/models/Category';
import Item from '@/models/Item';
import Table from '@/models/Table';
import Topping from '@/models/Topping';

// Food Gate Grillish Okara menu
// allowToppings: true  -> the POS asks which toppings / add-ons to add for these items
const MENU = [
  {
    name: 'Signature Burgers',
    color: '#F59E0B',
    allowToppings: true,
    items: [
      ['Son Of A Bun', 850],
      ['The Beef Syndicate', 850],
      ['The Beef Bomber', 850],
    ],
  },
  {
    name: 'Smash Beef Burgers',
    color: '#EF4444',
    allowToppings: true,
    items: [
      ['Rango Tango', 470],
      ['Value Beef', 470],
      ['Jalapeno Tangy', 470],
      ['Smash Beef Paratha', 750],
      ['Double Masti', 750],
      ['Molten Lava Smash Beef', 850],
    ],
  },
  {
    name: 'Grill Beef Burgers',
    color: '#B45309',
    allowToppings: true,
    items: [
      ['Classic Beef Burger', 470],
      ['Yumpum Beef Burger', 700],
      ['Jalapeno Beef Burger', 500],
      ['Mushroom Beef Burger', 750],
      ['Lava Cheese Beef Burger', 850],
    ],
  },
  {
    name: 'Grill Chicken Burgers',
    color: '#F97316',
    allowToppings: true,
    items: [
      ['Grill Burger', 470],
      ['Value Chicken Burger', 470],
      ['Jalapeno Chicken Burger', 500],
      ['Special Grill Burger', 600],
      ['Stuff Cheesy Burger', 650],
      ['Cocktail Chicken Burger', 750],
      ['Super Duper Burger', 750],
      ['Lava Cheese Chicken Burger', 850],
    ],
  },
  {
    name: 'Zinger Burgers',
    color: '#EAB308',
    allowToppings: true,
    items: [
      ['Zinger Burger', 400],
      ['Tower Zinger', 650],
    ],
  },
  {
    name: 'Steaks',
    color: '#7C2D12',
    allowToppings: true,
    items: [
      ['Grilled Steaks', 600],
      ['Grilled Cheese Steaks', 750],
      ['Mushroom Grilled Steaks', 800],
    ],
  },
  {
    name: 'Shawarma',
    color: '#16A34A',
    allowToppings: true,
    items: [
      ['Special Grilled Shawarma', 450],
      ['Grilled Shawarma', 280],
      ['Zinger Shawarma', 300],
    ],
  },
  {
    name: 'Wraps',
    color: '#0D9488',
    allowToppings: true,
    items: [
      ['Special Grilled Wrap', 700],
      ['Zinger Wrap', 600],
      ['Grilled Wrap', 550],
      ['Grillish Signature Wrap', 850],
    ],
  },
  {
    name: 'Sandwiches',
    color: '#3B82F6',
    allowToppings: true,
    // The price was not visible on the printed menu - set it from the Menu page.
    items: [['Crunchwich Cheesy', 0]],
  },
  {
    name: 'Fries & Sides',
    color: '#A855F7',
    allowToppings: false,
    items: [
      ['Loaded Fries', 550],
      ['Masala Fries', 200],
      ['Mayao Fries', 200],
      ['Plain Fries', 170],
      ['Hot Wings (10 Pieces)', 600],
      ['Hot Shots (10 Pieces)', 600],
    ],
  },
  {
    name: 'Drinks',
    color: '#06B6D4',
    allowToppings: false,
    // No drinks were on the printed menu - add them from the Menu page.
    items: [],
  },
];

const TOPPINGS = [
  ['Extra Topping', 100],
  ['Extra Beef Patty', 280],
  ['Extra Chicken', 180],
  ['Dip Sauce', 40],
  ['Cheese Slice', 50],
];

export async function POST() {
  try {
    await connectDB();

    // Only the MENU data is reset. Tables and orders are left untouched.
    // Order of work: first the collections that link to nothing (categories, toppings),
    // then the items, which link to categories through categoryId.
    await Item.deleteMany({});
    await Category.deleteMany({});
    await Topping.deleteMany({});

    // Step 1: independent collections
    const [categories, toppings] = await Promise.all([
      Category.create(
        MENU.map((c, index) => ({
          name: c.name,
          description: c.name,
          color: c.color,
          sortOrder: index + 1,
        }))
      ),
      Topping.create(
        TOPPINGS.map(([name, price], index) => ({ name, price, sortOrder: index + 1 }))
      ),
    ]);

    // Step 2: items, linked to the categories created above
    const itemDocs = [];
    MENU.forEach((c, index) => {
      c.items.forEach(([name, price]) => {
        itemDocs.push({
          name,
          price,
          categoryId: categories[index]._id,
          allowToppings: c.allowToppings,
          preparationTime: 15,
        });
      });
    });
    const items = await Item.create(itemDocs);

    // Safety check: every item must point to an existing category
    const categoryIds = new Set(categories.map(c => String(c._id)));
    const broken = items.filter(i => !categoryIds.has(String(i.categoryId)));
    if (broken.length > 0) {
      throw new Error(`${broken.length} item(s) have a missing category`);
    }

    // Create sample tables only if there are none yet
    let tablesCreated = 0;
    if ((await Table.countDocuments()) === 0) {
      const tables = await Table.create([
        { number: 1, capacity: 2, location: 'Window Side' },
        { number: 2, capacity: 4, location: 'Center' },
        { number: 3, capacity: 2, location: 'Corner' },
        { number: 4, capacity: 6, location: 'Private Section' },
        { number: 5, capacity: 4, location: 'Window Side' },
      ]);
      tablesCreated = tables.length;
    }

    return NextResponse.json({
      message: 'Menu seeded successfully!',
      data: {
        categories: categories.length,
        toppings: toppings.length,
        items: items.length,
        tablesCreated
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