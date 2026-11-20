"use client"

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { OrdersSkeleton } from "@/components/skeletons/OrdersSkeleton"
import { format } from "date-fns"
import { Search, RefreshCw, ChefHat, Receipt } from "lucide-react"
import OrderDetails from '@/components/ui/order-details'
import printReceipt from '@/lib/print-receipt'
import { useWorkPeriod } from '@/components/work-period'

const BRAND = { name: "Burger Buddies", address: "Sahiwal", phone: "0327-6589441" }

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const { workPeriod } = useWorkPeriod()
  const [periods, setPeriods] = useState([])
  const [selectedPeriod, setSelectedPeriod] = useState(null) // null = abhi load ho raha, 'none' = koi period nahi
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")

  const fetchCounter = useRef(0)
  const activeRequests = useRef(0)

  // Work periods ki list (start/end hone par dobara). Default: jo open hai, warna sab se latest.
  useEffect(() => {
    const controller = new AbortController()
    fetchPeriods(controller.signal)
    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workPeriod?._id])

  useEffect(() => {
    const controller = new AbortController()
    fetchOrders(controller.signal)
    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeriod, statusFilter])

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 500)
    return () => clearTimeout(t)
  }, [searchTerm])

  const fetchPeriods = async (signal) => {
    try {
      const response = await fetch('/api/work-period?list=1&limit=30', { signal, cache: 'no-store' })
      const data = await response.json()
      const list = data.workPeriods ?? []
      setPeriods(list)
      setSelectedPeriod(workPeriod?._id ?? list[0]?._id ?? 'none')
    } catch (error) {
      if (error.name === 'AbortError') return
      console.error('Error fetching work periods:', error)
    }
  }

  const fetchOrders = async (signal) => {
    if (!selectedPeriod) return // abhi periods load ho rahe hain
    if (selectedPeriod === 'none') {
      setOrders([])
      setLoading(false)
      return
    }

    const thisRequestId = ++fetchCounter.current
    setLoading(true)

    try {
      const params = new URLSearchParams({ workPeriod: selectedPeriod, limit: '500' })
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }

      const response = await fetch(`/api/orders?${params}`, signal ? { signal } : undefined)
      const data = await response.json()

      // purani request ka result ignore karo
      if (thisRequestId !== fetchCounter.current) return

      if (data.orders) {
        setOrders(data.orders)
      }
    } catch (error) {
      if (error.name === 'AbortError') return
      console.error('Error fetching orders:', error)
    } finally {
      // sirf latest request loading band karegi
      if (thisRequestId === fetchCounter.current) setLoading(false)
    }
  }

  const handlePrint = (order, type) => {
    printReceipt(order, { type, paperWidthMm: 80, brand: BRAND })
  }

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        fetchOrders() // Refresh the orders list
      }
    } catch (error) {
      console.error('Error updating order status:', error)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
      case 'preparing':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200'
      case 'ready':
        return 'bg-green-100 text-green-800 hover:bg-green-200'
      case 'served':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200'
      case 'completed':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 hover:bg-red-200'
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200'
    }
  }

  const filteredOrders = orders.filter(order =>
    order.customerName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    order.orderNumber.toLowerCase().includes(debouncedSearch.toLowerCase())
  )

  if (loading) {
    return <OrdersSkeleton />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
        </div>
        <Button onClick={() => fetchOrders()} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {/* Work Period */}
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium">Work Period</label>
              <Select value={selectedPeriod ?? 'none'} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-[260px]">
                  <SelectValue placeholder="Select work period" />
                </SelectTrigger>
                <SelectContent>
                  {periods.length === 0 && (
                    <SelectItem value="none" disabled>Koi work period nahi</SelectItem>
                  )}
                  {periods.map((p) => (
                    <SelectItem key={p._id} value={p._id}>
                      {format(new Date(p.startedAt), "dd MMM, hh:mm a")}
                      {p.status === 'open' ? ' (Open)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="preparing">Preparing</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="served">Served</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-[240px]"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Orders ({filteredOrders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {selectedPeriod === 'none'
                ? 'Abhi tak koi work period start nahi hua'
                : 'No orders found for the selected criteria'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Table</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order._id}>
                    <TableCell className="font-medium">
                      {order.orderNumber}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{order.customerName}</div>
                        {order.customerPhone && (
                          <div className="text-sm text-muted-foreground">
                            {order.customerPhone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {order.items.map((item, index) => (
                          <div key={index} className="text-sm">
                            {item.quantity}x {item.name}
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {order.orderType === 'dine-in' ? (
                        order.tableId ? (
                          <div>
                            <div className="font-medium">Table {order.tableId.number}</div>
                            {order.tableId.location && (
                              <div className="text-sm text-muted-foreground">
                                {order.tableId.location}
                              </div>
                            )}
                          </div>
                        ) : (
                          order.tableNumber ? `Table ${order.tableNumber}` : 'No table'
                        )
                      ) : (
                        <Badge variant="outline" className="capitalize">
                          {order.orderType}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      PKR {order.total.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={order.status}
                        onValueChange={(value) => updateOrderStatus(order._id, value)}
                      >
                        <SelectTrigger className="w-[120px]">
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="preparing">Preparing</SelectItem>
                          <SelectItem value="ready">Ready</SelectItem>
                          <SelectItem value="served">Served</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {format(new Date(order.createdAt), "HH:mm")}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => handlePrint(order, 'kitchen')}>
                          <ChefHat className="h-4 w-4 mr-1" />
                          Kitchen
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handlePrint(order, 'customer')}>
                          <Receipt className="h-4 w-4 mr-1" />
                          Customer
                        </Button>
                        <OrderDetails order={order} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
