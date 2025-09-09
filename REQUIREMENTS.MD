Overview
This documentation outlines the Model-View-Controller (MVC) architecture for a Next.js web app built with JavaScript, using Shadcn UI for a modern interface with a sidebar-based dashboard layout. The app uses a local MongoDB instance for offline data storage, ensuring it runs entirely on the client’s PC without internet dependency. It’s optimized for a small restaurant, fetching today’s orders by default and allowing admins to load past orders on demand via a date range picker.
Project Setup
Tech Stack:

Next.js: React framework using JavaScript for the web app.
Shadcn UI: Component library for UI elements (Button, Table, Input, DatePicker, Sidebar, etc.), styled with Tailwind CSS.
MongoDB: Local MongoDB instance for offline data storage.
Mongoose: ODM library to interact with MongoDB in JavaScript.
Tailwind CSS: Styling framework for Shadcn UI.
next-pwa: Enables offline functionality and PWA installation.
react-to-print: Handles receipt printing via the browser’s print API.

Pages: Dashboard (index, with sidebar), POS, order history, customer management, menu management, reports.

Dashboard Layout:

The app uses a dashboard layout with a Shadcn UI sidebar(prebuilt just install and use) for navigation.
The sidebar contains links to all main pages (Dashboard, POS, Orders, Customers, Menu, Reports)
The sidebar is fixed or collapsible, showing icons and labels.
Main content (e.g., order history table) renders to the right of the sidebar, adjusting dynamically for screen size.

MVC Architecture
The app follows the MVC pattern, adapted for Next.js with JavaScript, Shadcn UI (including a sidebar), and a local MongoDB database for offline storage.

Database Setup:

Connect to the local MongoDB instance (localhost:27017) using Mongoose.
Create a database named “crunchy-bites” with collections for orders, items, categories, tables, customers, and employees.
Define indexes on key fields (e.g., order date, customer name) for efficient queries.

Order Model
Customer Model
Table Model
Item Model
Category Model
Discount Model

2. Views (Presentation Layer)
Views are React components using Shadcn UI components (installed explicitly: Button, Table, Input, DatePicker, and Sidebar or equivalent). They are rendered client-side, cached for offline use via PWA, and styled with Tailwind CSS. The dashboard layout includes a Shadcn UI sidebar for navigation.

Dashboard Layout:

A fixed or collapsible sidebar on the left, containing links to: Dashboard (analytics, tables status), POS, Orders, Customers, Menu, Reports.
Main content renders to the right, adjusting for screen size (e.g., full-width on mobile).
Example: Sidebar has a Button for each page (e.g., “Orders” navigates to the orders page).


Order History View (orders page)
POS View (pos page)
Customer Management View (customers page)
Menu Management View (menu page)
Receipt Component
Reports View (reports page, optional)
Login View (optional)

Implementation Notes

Offline Functionality:

MongoDB runs locally on the client’s PC (localhost:27017, no network access).
Next.js assets (JS, CSS, Shadcn UI components) are cached by the PWA service worker for offline access.
The app works without internet after MongoDB and the app are started.


MongoDB Local Setup:

MongoDB stores data in a local directory (e.g., ./data).
Start the server manually or via a script before running the app.
Mongoose handles schema validation and queries, ensuring reliable offline CRUD operations.


Shadcn UI Setup:

Install components explicitly (Button, Table, Input, DatePicker, Sidebar or equivalent) using Shadcn UI CLI commands.


Efficiency:

Small dataset (~10–50 orders/day, <500 customers) means no pagination needed.
MongoDB with indexes (e.g., on date) ensures fast queries (milliseconds for today’s orders).
Customer search uses MongoDB’s text search or client-side filtering for small lists.


Printing:

Receipts use react-to-print with a Shadcn UI Table for layout.
CSS media queries ensure only the receipt prints, hiding other UI elements.


Additional Features:

Reports: Generate daily sales or popular items, displayed in a Table or exported.
