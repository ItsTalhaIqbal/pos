"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ReportsSkeleton } from "@/components/skeletons/ReportsSkeleton"
import { format, startOfDay, endOfDay, subDays } from "date-fns"
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  RotateCcw,
  CalendarIcon,
  Download,
  RefreshCw,
  Award,
  ShoppingBag
} from "lucide-react"

export default function ReportsPage() {
  const [startDate, setStartDate] = useState(() => subDays(new Date(), 7))
  const [endDate, setEndDate] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [reportData, setReportData] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    tableTurnover: 0,
    popularItems: [],
    dailySales: [],
    paymentMethods: {},
    orderTypes: {}
  })

  useEffect(() => {
    generateReport()
  }, [startDate, endDate])

  const generateReport = async () => {
    setLoading(true)
    try {
      // Fetch orders for the date range
      const promises = []
      const currentDate = new Date(startDate)
      
      while (currentDate <= endDate) {
        const dateStr = format(currentDate, 'yyyy-MM-dd')
        promises.push(
          fetch(`/api/orders?date=${dateStr}`).then(res => res.json())
        )
        currentDate.setDate(currentDate.getDate() + 1)
      }

      const results = await Promise.all(promises)
      const allOrders = results.flatMap(result => result.orders || [])

      // Calculate metrics
      const totalRevenue = allOrders.reduce((sum, order) => sum + order.total, 0)
      const totalOrders = allOrders.length
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
      
      // Calculate table turnover rate (orders per table per day)
      const dayCount = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1
      const dineInOrders = allOrders.filter(order => order.orderType === 'dine-in').length
      const tableTurnover = dineInOrders > 0 ? (dineInOrders / dayCount / 8).toFixed(1) : 0 // Assuming 8 tables average

      // Popular items
      const itemCounts = {}
      allOrders.forEach(order => {
        order.items.forEach(item => {
          if (itemCounts[item.name]) {
            itemCounts[item.name].quantity += item.quantity
            itemCounts[item.name].revenue += item.price * item.quantity
          } else {
            itemCounts[item.name] = {
              name: item.name,
              quantity: item.quantity,
              revenue: item.price * item.quantity
            }
          }
        })
      })

      const popularItems = Object.values(itemCounts)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10)

      // Daily sales
      const dailySalesMap = {}
      const dateRange = []
      const current = new Date(startDate)
      
      while (current <= endDate) {
        const dateStr = format(current, 'yyyy-MM-dd')
        dailySalesMap[dateStr] = { date: dateStr, revenue: 0, orders: 0 }
        dateRange.push(dateStr)
        current.setDate(current.getDate() + 1)
      }

      allOrders.forEach(order => {
        const dateStr = format(new Date(order.createdAt), 'yyyy-MM-dd')
        if (dailySalesMap[dateStr]) {
          dailySalesMap[dateStr].revenue += order.total
          dailySalesMap[dateStr].orders += 1
        }
      })

      const dailySales = dateRange.map(date => dailySalesMap[date])

      // Payment methods
      const paymentMethods = {}
      allOrders.forEach(order => {
        paymentMethods[order.paymentMethod] = (paymentMethods[order.paymentMethod] || 0) + 1
      })

      // Order types
      const orderTypes = {}
      allOrders.forEach(order => {
        orderTypes[order.orderType] = (orderTypes[order.orderType] || 0) + 1
      })

      setReportData({
        totalRevenue,
        totalOrders,
        avgOrderValue,
        tableTurnover,
        popularItems,
        dailySales,
        paymentMethods,
        orderTypes
      })

    } catch (error) {
      console.error('Error generating report:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportReport = () => {
    const reportContent = `
CRUNCHY BITES - SALES REPORT
Period: ${format(startDate, 'PP')} to ${format(endDate, 'PP')}

SUMMARY:
- Total Revenue: Rs ${reportData.totalRevenue.toFixed(2)}
- Total Orders: ${reportData.totalOrders}
- Average Order Value: Rs ${reportData.avgOrderValue.toFixed(2)}
- Table Turnover Rate: ${reportData.tableTurnover} per day

TOP SELLING ITEMS:
${reportData.popularItems.map((item, index) => 
  `${index + 1}. ${item.name} - ${item.quantity} sold - Rs ${item.revenue.toFixed(2)}`
).join('\n')}

DAILY SALES:
${reportData.dailySales.map(day => 
  `${day.date}: ${day.orders} orders - Rs ${day.revenue.toFixed(2)}`
).join('\n')}
    `

    const blob = new Blob([reportContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sales-report-${format(startDate, 'yyyy-MM-dd')}-to-${format(endDate, 'yyyy-MM-dd')}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return <ReportsSkeleton />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={generateReport} variant="outline" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={exportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Date Range Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Report Period</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <div>
              <label className="text-sm font-medium">From</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(startDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <label className="text-sm font-medium">To</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(endDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs {reportData.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {reportData.dailySales.length} days period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              Avg {(reportData.totalOrders / Math.max(reportData.dailySales.length, 1)).toFixed(1)} per day
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs {reportData.avgOrderValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Per order average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Table Turnover</CardTitle>
            <RotateCcw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.tableTurnover}</div>
            <p className="text-xs text-muted-foreground">
              Average turnovers per day
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Selling Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Top Selling Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">Loading...</div>
            ) : reportData.popularItems.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">No data available</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.popularItems.map((item, index) => (
                    <TableRow key={item.name}>
                      <TableCell>
                        <Badge variant={index < 3 ? "default" : "secondary"}>
                          #{index + 1}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>Rs {item.revenue.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Daily Sales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Daily Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">Loading...</div>
            ) : reportData.dailySales.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">No data available</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.dailySales.map((day) => (
                    <TableRow key={day.date}>
                      <TableCell>{format(new Date(day.date), 'MMM dd')}</TableCell>
                      <TableCell>{day.orders}</TableCell>
                      <TableCell>Rs {day.revenue.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods & Order Types */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(reportData.paymentMethods).map(([method, count]) => (
                <div key={method} className="flex justify-between items-center">
                  <span className="capitalize">{method}</span>
                  <Badge variant="secondary">{count} orders</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(reportData.orderTypes).map(([type, count]) => (
                <div key={type} className="flex justify-between items-center">
                  <span className="capitalize">{type.replace('-', ' ')}</span>
                  <Badge variant="secondary">{count} orders</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
