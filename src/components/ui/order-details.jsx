"use client"
import React from "react"
import printReceipt from '@/lib/print-receipt'
import { Dialog, DialogContent, DialogTitle, DialogTrigger, } from "./dialog"
import { Button } from "./button"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "./card"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "./table"
import { Badge } from "./badge"
import { Separator } from "./separator"
import { cn } from "@/lib/utils"

function formatCurrency(amount) {
  if (typeof amount !== "number") return "-"
  return amount.toLocaleString(undefined, { style: "currency", currency: "PKR", maximumFractionDigits: 2 })
}

function formatDate(date) {
  if (!date) return "-"
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date
  return d.toLocaleString()
}

const OrderDetailsContent = ({order = {}}) => {
  const items = Array.isArray(order.items) ? order.items : []

  const handlePrint = (e) => {
    if (e && e.preventDefault) e.preventDefault()
    printReceipt(order, { paperWidthMm: 80, brand: { name: "Crunchy Bites", address: "Karachi", phone: "0327-1234567" } })
  }
  return (
    <DialogContent className="max-w-3xl">
        <DialogTitle className="sr-only">Order details for {order.orderNumber ?? "order"}</DialogTitle>
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-4">
            <div>
              <CardTitle>
                Order #{order.orderNumber ?? "—"}
              </CardTitle>
              <div className="text-sm text-muted-foreground">{order.customerName ?? "Guest"} · {order.orderType ?? "—"}</div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={order.status === "cancelled" ? "destructive" : "default"}>{order.status ?? "unknown"}</Badge>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Created</div>
                <div className="font-medium">{formatDate(order.createdAt)}</div>

                <div className="text-sm text-muted-foreground mt-4">Table / Phone</div>
                <div className="flex gap-2 items-center">
                  <div className="font-medium">{order.tableNumber ?? "—"}</div>
                  {order.customerPhone && <div className="text-sm text-muted-foreground">{order.customerPhone}</div>}
                </div>

                <div className="text-sm text-muted-foreground mt-4">Notes</div>
                <div className={cn("text-sm rounded-md border px-3 py-2", !order.notes && "text-muted-foreground")}>{order.notes ?? "No notes"}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Payment</div>
                <div className="flex items-center gap-3 mt-1">
                  <div className="font-medium">{order.paymentMethod ?? "—"}</div>
                  <div className="text-sm text-muted-foreground">{formatCurrency(order.total ?? 0)}</div>
                </div>

                <Separator className="my-4" />

                <div className="text-sm text-muted-foreground">Summary</div>
                <div className="mt-2 space-y-1 text-sm">
                  <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(order.subtotal ?? 0)}</span></div>
                  <div className="flex justify-between"><span>Tax</span><span>{formatCurrency(order.tax ?? 0)}</span></div>
                  <div className="flex justify-between"><span>Discount</span><span>-{formatCurrency(order.discount ?? 0)}</span></div>
                  <div className="flex justify-between font-semibold text-foreground"><span>Total</span><span>{formatCurrency(order.total ?? 0)}</span></div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Items</h4>
                <div className="text-sm text-muted-foreground">{items.length} item{items.length !== 1 ? "s" : ""}</div>
              </div>

              {items.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">No items on this order.</div>
              ) : (
                <Table className="mt-3">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                          <TableBody>
                            {items.map((it, idx) => (
                              <TableRow key={it.itemId ?? it.id ?? idx}>
                                <TableCell className="max-w-[30%] truncate">{it.name}</TableCell>
                                <TableCell>{it.quantity}</TableCell>
                                <TableCell>{formatCurrency((it.price ?? 0) * (it.quantity ?? 0))}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                </Table>
              )}
            </div>
          </CardContent>

          <CardFooter>
                    <div className="w-full flex flex-col items-end">
                      <Button variant="default" onClick={handlePrint}>Print</Button>
                    </div>
          </CardFooter>
        </Card>
      </DialogContent>
  )
}

const OrderDetails = ({ order = {}, triggerLabel = "View Details" }) => {

  return (
    <Dialog>
        <DialogTrigger asChild>
            <Button variant="default" size="sm">{triggerLabel}</Button>
        </DialogTrigger>
        <OrderDetailsContent order={order} />
    </Dialog>
  )
}




export default OrderDetails