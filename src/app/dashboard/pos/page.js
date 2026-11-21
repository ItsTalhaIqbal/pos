"use client"

import { useState, useEffect, useMemo, useCallback } from 'react'
import printReceipt from '@/lib/print-receipt'
import { useWorkPeriod, StartWorkPeriodCard, BRAND } from '@/components/work-period'
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
  LayoutGrid
} from "lucide-react"

// Which slips are printed automatically when an order is placed.
// Kitchen only: ['kitchen']  |  both: ['kitchen', 'customer']
const AUTO_PRINT_TYPES = ['kitchen']

const money = (n) => `PKR ${Number(n ?? 0).toFixed(2)}`

// A cart line is identified by the item AND its toppings,
// so the same burger with different add-ons becomes separate lines.
const makeKey = (itemId, toppings) =>
  `${itemId}|${toppings.map(t => t._id).sort().join(',')}`

export default function POSPage() {
  const { workPeriod, loading: workPeriodLoading, refresh: refreshWorkPeriod } = useWorkPeriod()
  const [categories, setCategories] = useState([])
  const [items, setItems] = useState([])
  const [toppings, setToppings] = useState([])
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
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)

  // Toppings picker
  const [toppingItem, setToppingItem] = useState(null)
  const [pickedToppings, setPickedToppings] = useState([])

  const fetchTables = useCallback(async (signal) => {
    try {
      const response = await fetch('/api/tables', { signal })
      const data = await response.json()
      if (data.tables) setTables(data.tables)
    } catch (error) {
      if (error.name === 'AbortError') return
      console.error('Error fetching tables:', error)
    }
  }, [])

  // Initial load: everything is fetched once, categories / search filter on the client (instant)
  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller

    const load = async () => {
      try {
        const [catRes, itemRes, topRes] = await Promise.all([
          fetch('/api/categories?activeOnly=true', { signal }).then(r => r.json()),
          fetch('/api/items', { signal }).then(r => r.json()),
          fetch('/api/toppings', { signal }).then(r => r.json()),
        ])
        if (catRes.categories) setCategories(catRes.categories)
        if (itemRes.items) setItems(itemRes.items)
        if (topRes.toppings) setToppings(topRes.toppings)
        await fetchTables(signal)
      } catch (error) {
        if (error.name === 'AbortError') return
        console.error('Error loading POS data:', error)
      } finally {
        if (!signal.aborted) setLoading(false)
      }
    }

    load()
    return () => controller.abort()
  }, [fetchTables])

  // Items per category (for the counts in the left bar)
  const countByCategory = useMemo(() => {
    const counts = {}
    items.forEach(item => {
      const id = item.categoryId?._id
      if (id) counts[id] = (counts[id] || 0) + 1
    })
    return counts
  }, [items])

  const filteredItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return items.filter(item => {
      if (selectedCategory !== 'all' && item.categoryId?._id !== selectedCategory) return false
      if (term) {
        const haystack = `${item.name} ${item.description || ''}`.toLowerCase()
        if (!haystack.includes(term)) return false
      }
      return true
    })
  }, [items, selectedCategory, searchTerm])

  /* ------------------------------- Cart ---------------------------------- */

  const addToCart = (item, chosenToppings = []) => {
    const key = makeKey(item._id, chosenToppings)
    const toppingsTotal = chosenToppings.reduce((sum, t) => sum + t.price, 0)

    setCart(prev => {
      const existing = prev.find(line => line.key === key)
      if (existing) {
        return prev.map(line =>
          line.key === key ? { ...line, quantity: line.quantity + 1 } : line
        )
      }
      return [
        ...prev,
        {
          key,
          _id: item._id,
          name: item.name,
          basePrice: item.price,
          toppings: chosenToppings.map(t => ({ _id: t._id, name: t.name, price: t.price })),
          price: item.price + toppingsTotal, // unit price including toppings
          quantity: 1
        }
      ]
    })
  }

  const handleItemClick = (item) => {
    if (item.allowToppings && toppings.length > 0) {
      setToppingItem(item)
      setPickedToppings([])
    } else {
      addToCart(item)
    }
  }

  const toggleTopping = (id) => {
    setPickedToppings(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    )
  }

  const confirmToppings = () => {
    const chosen = toppings.filter(t => pickedToppings.includes(t._id))
    addToCart(toppingItem, chosen)
    setToppingItem(null)
    setPickedToppings([])
  }

  const updateQuantity = (key, newQuantity) => {
    if (newQuantity <= 0) {
      setCart(prev => prev.filter(line => line.key !== key))
    } else {
      setCart(prev => prev.map(line =>
        line.key === key ? { ...line, quantity: newQuantity } : line
      ))
    }
  }

  const removeFromCart = (key) => {
    setCart(prev => prev.filter(line => line.key !== key))
  }

  const calculateSubtotal = () =>
    cart.reduce((sum, line) => sum + (line.price * line.quantity), 0)

  const calculateTax = (subtotal) => subtotal * 0.00 // 0% tax

  const calculateTotal = () => {
    const subtotal = calculateSubtotal()
    return subtotal + calculateTax(subtotal)
  }

  const clearCart = () => {
    setCart([])
    setCustomerName('walk-in-customer')
    setCustomerPhone('')
    setTableNumber('')
    setSelectedTable('')
  }

  /* ----------------------------- Checkout -------------------------------- */

  const handlePrint = (order = {}) => {
    AUTO_PRINT_TYPES.forEach((type, index) => {
      // with more than one slip, wait a little so the popups do not collide
      setTimeout(() => {
        try {
          printReceipt(order, { type, paperWidthMm: 80, brand: BRAND })
        } catch (err) {
          console.error('Print failed', err)
        }
      }, index * 800)
    })
  }

  const submitOrder = async (e) => {
    e.preventDefault()
    if (cart.length === 0) {
      alert('Cart is empty')
      return
    }

    if (!customerName.trim()) {
      alert('Customer name is required')
      return
    }

    // Dine-in orders need a table
    if (orderType === 'dine-in' && !selectedTable) {
      alert('Please select a table for dine-in orders')
      return
    }

    setSubmitting(true)
    try {
      const subtotal = calculateSubtotal()
      const tax = calculateTax(subtotal)
      const total = calculateTotal()

      const orderData = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || null,
        tableNumber: selectedTable ? (tables.find(t => t._id === selectedTable)?.number ?? null) : null,
        tableId: selectedTable || null,
        orderType,
        paymentMethod,
        items: cart.map(line => ({
          itemId: line._id,
          name: line.name,
          price: line.price, // unit price including toppings
          quantity: line.quantity,
          // shows up on the kitchen slip and the customer receipt
          notes: line.toppings.length > 0
            ? `Add-ons: ${line.toppings.map(t => t.name).join(', ')}`
            : '',
          toppings: line.toppings.map(t => ({ name: t.name, price: t.price }))
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

      if (response.status === 403) {
        // the work period was closed (for example from another device)
        const err = await response.json().catch(() => ({}))
        alert(err.error || 'No work period is open')
        refreshWorkPeriod()
        return
      }

      if (response.ok) {
        const newOrder = await response.json()
        // Auto print the kitchen slip (supports both { order } and a direct order)
        const created = newOrder?.order ?? newOrder
        handlePrint(created)
        refreshWorkPeriod() // update the orders / sales in the top bar
        // Mark the table as occupied for dine-in orders
        if (orderType === 'dine-in' && selectedTable) {
          await fetch(`/api/tables/${selectedTable}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              status: 'occupied',
              currentOrderId: created._id
            }),
          })
          fetchTables()
        }

        clearCart()
        setShowCheckout(false)
      } else {
        throw new Error('Failed to create order')
      }
    } catch (error) {
      console.error('Error creating order:', error)
      alert('Failed to create order. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || workPeriodLoading) {
    return <POSSkeleton />
  }

  // Orders cannot be taken without an open work period
  if (!workPeriod) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <h1 className="text-3xl font-bold tracking-tight">Point of Sale</h1>
        </div>
        <StartWorkPeriodCard />
      </div>
    )
  }

  const toppingsPreviewTotal = toppings
    .filter(t => pickedToppings.includes(t._id))
    .reduce((sum, t) => sum + t.price, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-y-5">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <h1 className="text-3xl font-bold tracking-tight">Point of Sale</h1>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            <ShoppingCart className="h-4 w-4 mr-1" />
            {cart.reduce((sum, line) => sum + line.quantity, 0)} items
          </Badge>
          <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
            <DialogTrigger asChild>
              <Button disabled={cart.length === 0}>
                <Receipt className="h-4 w-4 mr-2" />
                Checkout ({money(calculateTotal())})
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                      {cart.map((line) => (
                        <TableRow key={line.key}>
                          <TableCell>
                            <div>{line.name}</div>
                            {line.toppings.length > 0 && (
                              <div className="text-xs text-muted-foreground whitespace-normal">
                                + {line.toppings.map(t => t.name).join(', ')}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>{line.quantity}</TableCell>
                          <TableCell>{money(line.price)}</TableCell>
                          <TableCell>{money(line.price * line.quantity)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{money(calculateSubtotal())}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax (0%):</span>
                      <span>{money(calculateTax(calculateSubtotal()))}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span>{money(calculateTotal())}</span>
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
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCheckout(false)}>
                    Cancel
                  </Button>
                  <Button onClick={submitOrder} disabled={submitting}>
                    {submitting ? 'Processing...' : 'Place Order'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Toppings / add-ons picker */}
      <Dialog open={!!toppingItem} onOpenChange={(open) => { if (!open) { setToppingItem(null); setPickedToppings([]) } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{toppingItem?.name}</DialogTitle>
            <DialogDescription>
              Choose toppings / add-ons (optional)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {toppings.map((t) => {
              const checked = pickedToppings.includes(t._id)
              return (
                <label
                  key={t._id}
                  className={`flex items-center justify-between rounded-lg border p-3 cursor-pointer transition-colors ${checked ? 'border-primary bg-primary/10' : 'hover:bg-muted'}`}
                >
                  <span className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={checked}
                      onChange={() => toggleTopping(t._id)}
                    />
                    <span className="font-medium">{t.name}</span>
                  </span>
                  <span className="text-sm text-muted-foreground">+ {money(t.price)}</span>
                </label>
              )
            })}
          </div>
          <div className="flex items-center justify-between border-t pt-4">
            <span className="font-semibold">
              {money((toppingItem?.price ?? 0) + toppingsPreviewTotal)}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setToppingItem(null); setPickedToppings([]) }}>
                Cancel
              </Button>
              <Button onClick={confirmToppings}>
                <Plus className="h-4 w-4 mr-1" />
                Add to Order
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-[210px_minmax(0,1fr)_340px] gap-6 items-start">
        {/* Left side bar: food categories */}
        <Card className="lg:sticky lg:top-4">
          <CardHeader className="pb-3 hidden lg:block">
            <CardTitle className="text-base flex items-center gap-2">
              <LayoutGrid className="h-4 w-4" />
              Categories
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 lg:pt-0">
            <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible lg:max-h-[calc(100vh-14rem)] lg:overflow-y-auto pb-1">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`shrink-0 flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-left transition-colors ${selectedCategory === 'all' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
              >
                <span>All Items</span>
                <span className="text-xs opacity-80">{items.length}</span>
              </button>
              {categories.map((category) => {
                const active = selectedCategory === category._id
                return (
                  <button
                    key={category._id}
                    type="button"
                    onClick={() => setSelectedCategory(category._id)}
                    className={`shrink-0 flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-left transition-colors border-l-4 ${active ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                    style={{ borderLeftColor: category.color }}
                  >
                    <span>{category.name}</span>
                    <span className="text-xs opacity-80">{countByCategory[category._id] || 0}</span>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Menu Items */}
        <div className="space-y-4 min-w-0">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {filteredItems.map((item) => (
              <Card
                key={item._id}
                onClick={() => handleItemClick(item)}
                className="cursor-pointer hover:shadow-lg hover:border-primary transition-all active:scale-[0.98]"
                style={{ borderTop: `4px solid ${item.categoryId?.color || 'transparent'}` }}
              >
                <CardContent className="p-4 flex flex-col justify-between gap-3 min-h-[110px]">
                  <div>
                    <h3 className="font-semibold leading-tight">{item.name}</h3>
                    {item.allowToppings && toppings.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">Add-ons available</p>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold">{money(item.price)}</span>
                    <span className="rounded-full bg-primary text-primary-foreground p-1.5">
                      <Plus className="h-4 w-4" />
                    </span>
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
        <div className="space-y-4 lg:sticky lg:top-4">
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
                  <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
                    {cart.map((line) => (
                      <div key={line.key} className="p-2 border rounded space-y-2">
                        <div className="flex justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium leading-tight">{line.name}</h4>
                            {line.toppings.length > 0 && (
                              <p className="text-xs text-muted-foreground">
                                + {line.toppings.map(t => t.name).join(', ')}
                              </p>
                            )}
                            <p className="text-sm text-muted-foreground">{money(line.price)} each</p>
                          </div>
                          <span className="font-semibold whitespace-nowrap">
                            {money(line.price * line.quantity)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(line.key, line.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center">{line.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(line.key, line.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="ml-auto"
                            onClick={() => removeFromCart(line.key)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{money(calculateSubtotal())}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax (0%):</span>
                      <span>{money(calculateTax(calculateSubtotal()))}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span>{money(calculateTotal())}</span>
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
