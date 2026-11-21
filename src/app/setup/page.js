"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertCircle, Database } from "lucide-react"
import Link from 'next/link'

export default function SetupPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const seedDatabase = async () => {
    // Seeding replaces the whole menu (items, categories, toppings)
    if (!confirm('This will delete the current menu (items, categories, toppings) and load the Food Gate menu. Continue?')) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
      } else {
        setError(data.details ? `${data.error}: ${data.details}` : (data.error || 'Failed to seed database'))
      }
    } catch (err) {
      setError('Network error occurred')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Setup Menu Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Loads the Food Gate Grillish menu: categories, items and toppings.
            Tables and orders are not touched.
          </p>

          <Button className="w-full" onClick={seedDatabase} disabled={loading}>
            {loading ? 'Setting up...' : 'Setup Sample Data'}
          </Button>

          {error && (
            <div className="flex items-start gap-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {result && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>{result.message}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{result.data?.categories} categories</Badge>
                <Badge variant="secondary">{result.data?.items} items</Badge>
                <Badge variant="secondary">{result.data?.toppings} toppings</Badge>
              </div>
            </div>
          )}

          <Button asChild variant="outline" className="w-full">
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}