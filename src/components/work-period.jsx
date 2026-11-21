"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { Play, Square, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { printWorkPeriodSummary } from "@/lib/print-receipt"

export const BRAND = { name: "Food Gate Grillish Okara", address: "Church Road, Near Pizza Online, Okara", phone: "0301-0560386" }

const money = (n) => `PKR ${Number(n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
const when = (d) => (d ? format(new Date(d), "dd MMM, hh:mm a") : "-")

/* -------------------------------------------------------------------------- */
/*  Context                                                                   */
/* -------------------------------------------------------------------------- */

const WorkPeriodContext = createContext(null)

export function useWorkPeriod() {
  const ctx = useContext(WorkPeriodContext)
  if (!ctx) throw new Error("useWorkPeriod must be used inside <WorkPeriodProvider>")
  return ctx
}

export function WorkPeriodProvider({ children }) {
  const [workPeriod, setWorkPeriod] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/work-period", { cache: "no-store" })
      const data = await res.json()
      setWorkPeriod(data.workPeriod ?? null)
      setStats(data.stats ?? null)
    } catch (error) {
      console.error("Error fetching work period:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Load once, then every 30 seconds (so a start/end from another device shows up here too)
  useEffect(() => {
    refresh()
    const t = setInterval(refresh, 30000)
    return () => clearInterval(t)
  }, [refresh])

  const startWorkPeriod = useCallback(async () => {
    const res = await fetch("/api/work-period", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
    const data = await res.json()
    await refresh()
    if (!res.ok) throw new Error(data.error || "Could not start the work period")
    return data.workPeriod
  }, [refresh])

  const endWorkPeriod = useCallback(async ({ force = false } = {}) => {
    const res = await fetch("/api/work-period/end", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ force }),
    })
    const data = await res.json()
    if (!res.ok) {
      const err = new Error(data.error || "Could not end the work period")
      err.requiresForce = !!data.requiresForce
      throw err
    }
    await refresh()
    return data.workPeriod
  }, [refresh])

  return (
    <WorkPeriodContext.Provider
      value={{ workPeriod, stats, loading, refresh, startWorkPeriod, endWorkPeriod }}
    >
      {children}
    </WorkPeriodContext.Provider>
  )
}

/* -------------------------------------------------------------------------- */
/*  "Start Work Period" card shown on the POS page                            */
/* -------------------------------------------------------------------------- */

export function StartWorkPeriodCard() {
  const { startWorkPeriod } = useWorkPeriod()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleStart = async () => {
    setSubmitting(true)
    setError("")
    try {
      await startWorkPeriod()
    } catch (e) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Work Period is closed</CardTitle>
        <CardDescription>
          Start a work period before taking orders.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button className="w-full" onClick={handleStart} disabled={submitting}>
          <Play className="h-4 w-4 mr-2" />
          {submitting ? "Starting..." : "Start Work Period"}
        </Button>
      </CardContent>
    </Card>
  )
}

/* -------------------------------------------------------------------------- */
/*  End Work Period dialog                                                    */
/* -------------------------------------------------------------------------- */

function Stat({ label, value, strong }) {
  return (
    <div className={`flex justify-between ${strong ? "font-semibold" : "text-sm"}`}>
      <span className={strong ? "" : "text-muted-foreground"}>{label}</span>
      <span>{value}</span>
    </div>
  )
}

function EndWorkPeriodDialog({ open, onOpenChange }) {
  const { workPeriod, stats, endWorkPeriod } = useWorkPeriod()
  const [force, setForce] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState(null) // summary shown after the period has ended

  const handleOpenChange = (value) => {
    onOpenChange(value)
    if (!value) {
      // reset the form when the dialog closes
      setForce(false)
      setError("")
      setResult(null)
    }
  }

  const hasOpenOrders = (stats?.openOrders ?? 0) > 0

  const handleEnd = async () => {
    setSubmitting(true)
    setError("")
    try {
      const closed = await endWorkPeriod({ force })
      setResult(closed)
    } catch (e) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Already ended: show the sales summary
  if (result) {
    const s = result.summary ?? {}
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Work Period Ended</DialogTitle>
            <DialogDescription>
              {when(result.startedAt)} → {when(result.endedAt)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Stat label="Orders" value={s.totalOrders ?? 0} />
            <Stat label="Cancelled" value={s.cancelledOrders ?? 0} />
            <Stat label="Cash sales" value={money(s.cashSales)} />
            <Stat label="Card sales" value={money(s.cardSales)} />
            <Stat label="Other sales" value={money(s.otherSales)} />
            <div className="border-t my-2" />
            <Stat label="Total sales" value={money(s.totalSales)} strong />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => printWorkPeriodSummary(result, { brand: BRAND })}
            >
              <Printer className="h-4 w-4 mr-2" />
              Print Report
            </Button>
            <Button onClick={() => handleOpenChange(false)}>Done</Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!workPeriod) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>End Work Period</DialogTitle>
          <DialogDescription>
            Started: {when(workPeriod.startedAt)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Stat label="Orders" value={stats?.totalOrders ?? 0} />
          <Stat label="Cash sales" value={money(stats?.cashSales)} />
          <Stat label="Card sales" value={money(stats?.cardSales)} />
          <Stat label="Other sales" value={money(stats?.otherSales)} />
          <div className="border-t my-2" />
          <Stat label="Total sales" value={money(stats?.totalSales)} strong />
        </div>

        {hasOpenOrders && (
          <label className="flex items-start gap-2 text-sm rounded-md border border-amber-400 bg-amber-50 text-amber-900 p-3">
            <input
              type="checkbox"
              className="mt-1"
              checked={force}
              onChange={(e) => setForce(e.target.checked)}
            />
            <span>
              {stats.openOrders} order(s) are still pending / preparing / ready. End the work period anyway.
            </span>
          </label>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleEnd}
            disabled={submitting || (hasOpenOrders && !force)}
          >
            {submitting ? "Ending..." : "End Work Period"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* -------------------------------------------------------------------------- */
/*  Status bar at the top of the dashboard                                    */
/* -------------------------------------------------------------------------- */

export function WorkPeriodBar() {
  const { workPeriod, stats, loading } = useWorkPeriod()
  const [endOpen, setEndOpen] = useState(false)

  if (loading) return null

  return (
    <>
      <div className="border-b px-6 py-2 flex flex-wrap items-center justify-between gap-2 text-sm">
        {workPeriod ? (
          <>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" />
              <span className="font-medium">Work Period OPEN</span>
              <span className="text-muted-foreground">
                since {when(workPeriod.startedAt)} · {stats?.totalOrders ?? 0} orders · {money(stats?.totalSales)}
              </span>
            </div>
            <Button size="sm" variant="outline" onClick={() => setEndOpen(true)}>
              <Square className="h-3.5 w-3.5 mr-2" />
              End Work Period
            </Button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" />
              <span className="font-medium">Work Period CLOSED</span>
              <span className="text-muted-foreground">start one to take orders</span>
            </div>
            <Button size="sm" asChild>
              <Link href="/dashboard/pos">
                <Play className="h-3.5 w-3.5 mr-2" />
                Start
              </Link>
            </Button>
          </>
        )}
      </div>
      <EndWorkPeriodDialog open={endOpen} onOpenChange={setEndOpen} />
    </>
  )
}
