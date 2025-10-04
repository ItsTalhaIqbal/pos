# Crunchy Bites - Restaurant Management System

A complete restaurant management system built with Next.js, featuring POS, order management, customer management, and analytics. Designed to work offline with local or cloud MongoDB storage.

## Demo
[Live Demo](https://arham-restaurant.vercel.app/)

## Features

✨ **Point of Sale (POS) System**
- Modern touch-friendly interface
- Real-time cart management
- Multiple payment methods
- Order type selection (dine-in, takeaway, delivery)

📋 **Order Management**
- Live order tracking
- Status updates (pending, preparing, ready, served)
- Date range filtering
- Order history with search

👥 **Customer Management**
- Customer database with contact information
- Order history tracking
- Total spent analytics
- Search and filter customers

🍽️ **Menu Management**
- Category-based organization
- Item availability toggle
- Price management
- Preparation time tracking
- Tags and descriptions

📊 **Dashboard & Analytics**
- Daily sales overview
- Order statistics
- Customer insights
- Revenue tracking

📈 **Reports & Analytics**
- Date range sales reports
- Top selling items analysis
- Daily sales breakdown
- Payment method analytics
- Order type distribution
- Export functionality

🏪 **Offline Functionality**
- Local MongoDB storage
- Works without internet connection
- PWA ready for desktop installation

## Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **UI Components**: Shadcn UI
- **Database**: MongoDB (local)
- **Icons**: Lucide React
- **Styling**: Tailwind CSS

## Quick Start

1. **Install dependencies**
```bash
pnpm install
```

2. **Start MongoDB** (make sure it's running on localhost:27017)

3. **Start the development server**
```bash
pnpm dev
```

4. **Open your browser**
Navigate to [http://localhost:3000](http://localhost:3000)

5. **Set up sample data**
On first visit, you'll be redirected to the setup page. Click "Setup Sample Data" to populate your database with sample menu items, categories, and customers.

## Usage

### POS System
- Navigate to `/dashboard/pos`
- Add items to cart
- Enter customer details
- Process payment and create order

### Order Management
- View and manage orders at `/dashboard/orders`
- Update order status as items are prepared
- Filter by date and status

### Customer Management
- Manage customer database at `/dashboard/customers`
- Track order history and spending

### Menu Management
- Configure menu items and categories at `/dashboard/menu`
- Toggle item availability
- Set prices and preparation times

Built with Pakistani Restaurant owners in mind - all prices in Pakistani Rupees (PKR).
