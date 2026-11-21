"use client"

import { Fragment, useState, useEffect, useMemo, useCallback } from 'react'
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
  DollarSign,
  TrendingUp,
  CalendarIcon,
  Download,
  RefreshCw,
  ShoppingBag,
  Clock,
  ChevronDown,
  ChevronRight,
  Award
} from "lucide-react"

const money = (n) => `PKR ${Number(n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`

// "Sat, 21 Nov 2026" (and the end date as well when the period ran past midnight)
function periodDate(period) {
  const start = new Date(period.startedAt)
  const label = format(start, 'EEE, dd MMM yyyy')
  if (period.endedAt) {
    const end = new Date(period.endedAt)
    if (format(end, 'yyyy-MM-dd') !== format(start, 'yyyy-MM-dd')) {
      return `${label} → ${format(end, 'dd MMM')}`
    }
  }
  return label
}

function periodTime(period) {
  const start = format(new Date(period.startedAt), 'hh:mm a')
  const end = period.endedAt ? format(new Date(period.endedAt), 'hh:mm a') : 'Now'
  return `${start} – ${end}`
}

/* Extra detail for one work period: top items and order types */
function PeriodDetails({ period }) {
  const [loading, setLoading] = useState(true)
  const [topItems, setTopItems] = useState([])
  const [orderTypes, setOrderTypes] = useState({})

  useEffect(() => {
    const controller = new AbortController()

    const load = async () => {
      try {
        const res = await fetch(`/api/orders?workPeriod=${period._id}&limit=500`, { signal: controller.signal })
        const data = await res.json()
        // cancelled orders are not part of sales
        const orders = (data.orders || []).filter(o => o.status !== 'cancelled')

        const itemMap = {}
        const types = {}
        orders.forEach(order => {
          types[order.orderType] = (types[order.orderType] || 0) + 1
          order.items.forEach(item => {
            if (!itemMap[item.name]) itemMap[item.name] = { name: item.name, quantity: 0, revenue: 0 }
            itemMap[item.name].quantity += item.quantity
            itemMap[item.name].revenue += item.price * item.quantity
          })
        })

        setTopItems(Object.values(itemMap).sort((a, b) => b.quantity - a.quantity).slice(0, 8))
        setOrderTypes(types)
      } catch (error) {
        if (error.name === 'AbortError') return
        console.error('Error loading work period details:', error)
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    load()
    return () => controller.abort()
  }, [period._id])

  if (loading) {
    return <div className="py-4 text-center text-sm text-muted-foreground">Loading details...</div>
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 py-2">
      <div>
        <h4 className="font-medium flex items-center gap-2 mb-2">
          <Award className="h-4 w-4" />
          Top Selling Items
        </h4>
        {topItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">No items sold</p>
        ) : (
          <div className="space-y-1">
            {topItems.map((item, index) => (
              <div key={item.name} className="flex justify-between text-sm">
                <span>{index + 1}. {item.name}</span>
                <span className="text-muted-foreground">{item.quantity} sold · {money(item.revenue)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h4 className="font-medium mb-2">Order Types</h4>
        {Object.keys(orderTypes).length === 0 ? (
          <p className="text-sm text-muted-foreground">No orders</p>
        ) : (
          <div className="space-y-1">
            {Object.entries(orderTypes).map(([type, count]) => (
              <div key={type} className="flex justify-between text-sm">
                <span className="capitalize">{type.replace('-', ' ')}</span>
                <Badge variant="secondary">{count} orders</Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function ReportsPage() {
  const [startDate, setStartDate] = useState(() => subDays(new Date(), 30))
  const [endDate, setEndDate] = useState(new Date())
  const [periods, setPeriods] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [expanded, setExpanded] = useState(null)

  const fetchPeriods = useCallback(async (signal) => {
    try {
      const params = new URLSearchParams({
        list: '1',
        limit: '200',
        from: startOfDay(startDate).toISOString(),
        to: endOfDay(endDate).toISOString()
      })
      const res = await fetch(`/api/work-period?${params}`, { signal, cache: 'no-store' })
      const data = await res.json()
      setPeriods(data.workPeriods || [])
    } catch (error) {
      if (error.name === 'AbortError') return
      console.error('Error loading work periods:', error)
    }
  }, [startDate, endDate])

  useEffect(() => {
    const controller = new AbortController()
    setExpanded(null)
    fetchPeriods(controller.signal).finally(() => {
      if (!controller.signal.aborted) setLoading(false)
    })
    return () => controller.abort()
  }, [fetchPeriods])

  const refresh = async () => {
    setRefreshing(true)
    await fetchPeriods()
    setRefreshing(false)
  }

  const totals = useMemo(() => {
    const totalSales = periods.reduce((sum, p) => sum + (p.summary?.totalSales ?? 0), 0)
    const totalOrders = periods.reduce((sum, p) => sum + (p.summary?.totalOrders ?? 0), 0)
    return {
      totalSales,
      totalOrders,
      avgPerPeriod: periods.length > 0 ? totalSales / periods.length : 0
    }
  }, [periods])

  const setRange = (days) => {
    setEndDate(new Date())
    setStartDate(days === 0 ? new Date() : subDays(new Date(), days))
  }

  const exportReport = () => {
    const header = ['Date', 'Start', 'End', 'Status', 'Orders', 'Cancelled', 'Cash Sales', 'Card Sales', 'Other Sales', 'Total Sales']
    const rows = periods.map(p => [
      format(new Date(p.startedAt), 'yyyy-MM-dd'),
      format(new Date(p.startedAt), 'hh:mm a'),
      p.endedAt ? format(new Date(p.endedAt), 'yyyy-MM-dd hh:mm a') : 'Open',
      p.status,
      p.summary?.totalOrders ?? 0,
      p.summary?.cancelledOrders ?? 0,
      p.summary?.cashSales ?? 0,
      p.summary?.cardSales ?? 0,
      p.summary?.otherSales ?? 0,
      p.summary?.totalSales ?? 0
    ])
    const csv = [header, ...rows].map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sales-report-${format(startDate, 'yyyy-MM-dd')}-to-${format(endDate, 'yyyy-MM-dd')}.csv`
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
      <div className="flex items-center justify-between flex-wrap gap-y-5">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <h1 className="text-3xl font-bold tracking-tight">Sales Reports</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={refresh} variant="outline" disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={exportReport} disabled={periods.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Date range filter */}
      <Card>
        <CardHeader>
          <CardTitle>Report Period</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end flex-wrap">
            <div className="flex flex-col space-y-1">
              <label className="text-sm font-medium">From</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[220px] justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(startDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(d) => d && setStartDate(d)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-sm font-medium">To</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[220px] justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(endDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(d) => d && setEndDate(d)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setRange(0)}>Today</Button>
              <Button variant="outline" size="sm" onClick={() => setRange(7)}>Last 7 days</Button>
              <Button variant="outline" size="sm" onClick={() => setRange(30)}>Last 30 days</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{money(totals.totalSales)}</div>
            <p className="text-xs text-muted-foreground">In the selected dates</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Work Periods</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{periods.length}</div>
            <p className="text-xs text-muted-foreground">Started in the selected dates</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.totalOrders}</div>
            <p className="text-xs text-muted-foreground">Cancelled orders not counted</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Sales / Work Period</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{money(totals.avgPerPeriod)}</div>
            <p className="text-xs text-muted-foreground">Per work period average</p>
          </CardContent>
        </Card>
      </div>

      {/* Work periods table */}
      <Card>
        <CardHeader>
          <CardTitle>Sales by Work Period</CardTitle>
        </CardHeader>
        <CardContent>
          {periods.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No work periods found for these dates
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead className="text-right">Cancelled</TableHead>
                  <TableHead className="text-right">Cash</TableHead>
                  <TableHead className="text-right">Card</TableHead>
                  <TableHead className="text-right">Other</TableHead>
                  <TableHead className="text-right">Total Sales</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {periods.map((period) => {
                  const s = period.summary ?? {}
                  const isOpen = expanded === period._id
                  return (
                    <Fragment key={period._id}>
                      <TableRow
                        className="cursor-pointer"
                        onClick={() => setExpanded(isOpen ? null : period._id)}
                      >
                        <TableCell>
                          {isOpen
                            ? <ChevronDown className="h-4 w-4" />
                            : <ChevronRight className="h-4 w-4" />}
                        </TableCell>
                        <TableCell className="font-medium whitespace-nowrap">{periodDate(period)}</TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">{periodTime(period)}</TableCell>
                        <TableCell className="text-right">{s.totalOrders ?? 0}</TableCell>
                        <TableCell className="text-right">{s.cancelledOrders ?? 0}</TableCell>
                        <TableCell className="text-right">{money(s.cashSales)}</TableCell>
                        <TableCell className="text-right">{money(s.cardSales)}</TableCell>
                        <TableCell className="text-right">{money(s.otherSales)}</TableCell>
                        <TableCell className="text-right font-bold">{money(s.totalSales)}</TableCell>
                        <TableCell>
                          <Badge variant={period.status === 'open' ? 'default' : 'secondary'}>
                            {period.status === 'open' ? 'Open' : 'Closed'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                      {isOpen && (
                        <TableRow className="hover:bg-transparent">
                          <TableCell colSpan={10} className="bg-muted/40">
                            <PeriodDetails period={period} />
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}