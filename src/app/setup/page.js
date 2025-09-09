"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertCircle, Database, Coffee } from "lucide-react"

export default function SetupPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const seedDatabase = async () => {
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
        setError(data.error || 'Failed to seed database')
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
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Coffee className="h-8 w-8 text-orange-600" />
            <h1 className="text-2xl font-bold text-orange-600">Crunchy Bites</h1>
          </div>
          <CardTitle className="text-xl">Restaurant Setup</CardTitle>
          <p className="text-muted-foreground">
            Welcome to your restaurant management system! Let&apos;s set up your database with sample data.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* MongoDB Status */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Setup
            </h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">MongoDB Requirements</h4>
              <p className="text-blue-800 text-sm mb-3">
                Make sure MongoDB is installed and running on your system at localhost:27017 if you&apos;re using the local setup or use the cloud database, both connection strings can be provided in your environment variables.
              </p>
              <div className="space-y-2 text-sm">
                <p className="text-blue-700">
                  <strong>Download:</strong> <a href="https://www.mongodb.com/products/tools/compass" target="_blank" rel="noopener noreferrer" className="underline">MongoDB Compass</a>
                </p>
                <p className="text-blue-700">
                  <strong>Start MongoDB:</strong> Search <code className="bg-blue-100 px-1 rounded">MongoDB Compass</code> in your applications menu and launch it.
                </p>
              </div>
            </div>
          </div>

          {/* Seed Database */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Sample Data</h3>
            <p className="text-muted-foreground text-sm">
              Click the button below to populate your database with sample menu items, categories, and tables.
            </p>
            
            <Button 
              onClick={seedDatabase} 
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? 'Setting up database...' : 'Setup Sample Data'}
            </Button>
          </div>

          {/* Results */}
          {result && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Setup Successful!</h3>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 mb-3">{result.message}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{result.data.categories} Categories</Badge>
                  <Badge variant="secondary">{result.data.items} Menu Items</Badge>
                  <Badge variant="secondary">{result.data.tables} Tables</Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button asChild className="flex-1">
                  <a href="/dashboard">Go to Dashboard</a>
                </Button>
                <Button asChild variant="outline" className="flex-1">
                  <a href="/dashboard/pos">Start Taking Orders</a>
                </Button>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Setup Failed</h3>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">{error}</p>
                <p className="text-red-700 text-sm mt-2">
                  Please make sure MongoDB is running and try again.
                </p>
              </div>
            </div>
          )}

          {/* Features Overview */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-3">What&apos;s Included</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Point of Sale (POS) System</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Order Management</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Menu & Category Management</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Table Management</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Offline MongoDB Storage</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
