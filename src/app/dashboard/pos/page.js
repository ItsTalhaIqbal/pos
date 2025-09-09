"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { POSSkeleton } from "@/components/skeletons/POSSkeleton"
import { 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingCart, 
  Search,
  Receipt,
  User,
  Phone
} from "lucide-react"

export default function POSPage() {
  const [categories, setCategories] = useState([])
  const [items, setItems] = useState([])
  const [tables, setTables] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [cart, setCart] = useState([])
  const [customerName, setCustomerName] = useState('walk-in-customer')
  const [customerPhone, setCustomerPhone] = useState('')
  const [tableNumber, setTableNumber] = useState('')
  const [selectedTable, setSelectedTable] = useState('')
  const [orderType, setOrderType] = useState('dine-in')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [loading, setLoading] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)

  useEffect(() => {
    fetchCategories()
    fetchItems()
    fetchTables()
  }, [])

  useEffect(() => {
    fetchItems()
  }, [selectedCategory, searchTerm])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories?activeOnly=true')
      const data = await response.json()
      if (data.categories) {
        setCategories(data.categories)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchItems = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedCategory !== 'all') {
        params.append('categoryId', selectedCategory)
      }
      if (searchTerm) {
        params.append('search', searchTerm)
      }

      const response = await fetch(`/api/items?${params}`)
      const data = await response.json()
      if (data.items) {
        setItems(data.items)
      }
    } catch (error) {
      console.error('Error fetching items:', error)
    }
  }

  const fetchTables = async () => {
    try {
      const response = await fetch('/api/tables')
      const data = await response.json()
      if (data.tables) {
        setTables(data.tables)
      }
    } catch (error) {
      console.error('Error fetching tables:', error)
    }
  }

  const addToCart = (item) => {
    const existingItem = cart.find(cartItem => cartItem._id === item._id)
    
    if (existingItem) {
      setCart(cart.map(cartItem =>
        cartItem._id === item._id
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ))
    } else {
      setCart([...cart, { ...item, quantity: 1 }])
    }
  }

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity === 0) {
      setCart(cart.filter(item => item._id !== itemId))
    } else {
      setCart(cart.map(item =>
        item._id === itemId
          ? { ...item, quantity: newQuantity }
          : item
      ))
    }
  }

  const removeFromCart = (itemId) => {
    setCart(cart.filter(item => item._id !== itemId))
  }

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  }

  const calculateTax = (subtotal) => {
    return subtotal * 0.00 // 0% tax
  }

  const calculateTotal = () => {
    const subtotal = calculateSubtotal()
    const tax = calculateTax(subtotal)
    return subtotal + tax
  }

  const clearCart = () => {
    setCart([])
    setCustomerName('walk-in-customer')
    setCustomerPhone('')
    setTableNumber('')
    setSelectedTable('')
  }

  const submitOrder = async () => {
    if (cart.length === 0) {
      alert('Cart is empty')
      return
    }

    if (!customerName.trim()) {
      alert('Customer name is required')
      return
    }

    // Validate table selection for dine-in orders
    if (orderType === 'dine-in' && !selectedTable) {
      alert('Please select a table for dine-in orders')
      return
    }

    setLoading(true)

    try {
      const subtotal = calculateSubtotal()
      const tax = calculateTax(subtotal)
      const total = calculateTotal()

      const orderData = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || null,
        tableNumber: selectedTable ? parseInt(selectedTable) : null,
        tableId: selectedTable || null,
        orderType,
        paymentMethod,
        items: cart.map(item => ({
          itemId: item._id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          notes: ''
        })),
        subtotal,
        tax,
        total,
        status: 'pending'
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      })

      if (response.ok) {
        const newOrder = await response.json()
        
        // Update table status to occupied if it's a dine-in order
        if (orderType === 'dine-in' && selectedTable) {
          await fetch(`/api/tables/${selectedTable}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              status: 'occupied',
              currentOrderId: newOrder.order._id
            }),
          })
          // Refresh tables list
          fetchTables()
        }
        
        alert(`Order ${newOrder.orderNumber} created successfully!`)
        clearCart()
        setShowCheckout(false)
      } else {
        throw new Error('Failed to create order')
      }
    } catch (error) {
      console.error('Error creating order:', error)
      alert('Failed to create order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const filteredItems = items

  if (loading) {
    return <POSSkeleton />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <h1 className="text-3xl font-bold tracking-tight">Point of Sale</h1>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            <ShoppingCart className="h-4 w-4 mr-1" />
            {cart.reduce((sum, item) => sum + item.quantity, 0)} items
          </Badge>
          <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
            <DialogTrigger asChild>
              <Button disabled={cart.length === 0}>
                <Receipt className="h-4 w-4 mr-2" />
                Checkout (Rs {calculateTotal().toFixed(2)})
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Checkout</DialogTitle>
                <DialogDescription>
                  Review your order details and complete the checkout process.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                {/* Customer Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Customer Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Customer Name *</label>
                      <Input
                        placeholder="Enter customer name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Phone Number</label>
                      <Input
                        placeholder="Enter phone number"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                      />
                    </div>
                    {orderType === 'dine-in' ? (
                      <div>
                        <label className="text-sm font-medium">Select Table *</label>
                        <Select value={selectedTable} onValueChange={setSelectedTable}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose available table" />
                          </SelectTrigger>
                          <SelectContent>
                            {tables
                              .filter(table => table.status === 'available')
                              .map((table) => (
                                <SelectItem key={table._id} value={table._id}>
                                  Table {table.number} ({table.capacity} seats)
                                  {table.location && ` - ${table.location}`}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        {tables.filter(table => table.status === 'available').length === 0 && (
                          <p className="text-sm text-red-500 mt-1">
                            No available tables. Please clean or add more tables.
                          </p>
                        )}
                      </div>
                    ) : (
                      <div>
                        <label className="text-sm font-medium">Reference Number</label>
                        <Input
                          placeholder="Order reference (optional)"
                          value={tableNumber}
                          onChange={(e) => setTableNumber(e.target.value)}
                        />
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium">Order Type</label>
                      <Select value={orderType} onValueChange={setOrderType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dine-in">Dine In</SelectItem>
                          <SelectItem value="takeaway">Takeaway</SelectItem>
                          <SelectItem value="delivery">Delivery</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Order Summary */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Order Summary</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cart.map((item) => (
                        <TableRow key={item._id}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>Rs {item.price.toFixed(2)}</TableCell>
                          <TableCell>Rs {(item.price * item.quantity).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>Rs {calculateSubtotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax (0%):</span>
                      <span>Rs {calculateTax(calculateSubtotal()).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span>Rs {calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Payment Method</label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCheckout(false)}>
                    Cancel
                  </Button>
                  <Button onClick={submitOrder} disabled={loading}>
                    {loading ? 'Processing...' : 'Place Order'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Menu Items */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search menu items..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category._id} value={category._id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Menu Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <Card key={item._id} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold">{item.name}</h3>
                      <Badge style={{ backgroundColor: item.categoryId?.color }}>
                        {item.categoryId?.name}
                      </Badge>
                    </div>
                    {item.description && (
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold">Rs {item.price.toFixed(2)}</span>
                      <Button onClick={() => addToCart(item)} size="sm">
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredItems.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">No menu items found</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Cart */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Order</CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Cart is empty
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item._id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex-1">
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-muted-foreground">Rs {item.price.toFixed(2)} each</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => updateQuantity(item._id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => updateQuantity(item._id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => removeFromCart(item._id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>Rs {calculateSubtotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax (0%):</span>
                      <span>Rs {calculateTax(calculateSubtotal()).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span>Rs {calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={clearCart} className="flex-1">
                      Clear
                    </Button>
                    <Button onClick={() => setShowCheckout(true)} className="flex-1">
                      Checkout
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
