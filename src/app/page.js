"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    checkSetup()
  }, [])

  const checkSetup = async () => {
    try {
      // Check if we have any categories (indicating setup is done)
      const response = await fetch('/api/categories')
      const data = await response.json()
      
      if (data.categories && data.categories.length > 0) {
        router.push('/dashboard')
      } else {
        router.push('/setup')
      }
    } catch (error) {
      // If there's an error, go to setup page
      router.push('/setup')
    } finally {
      setChecking(false)
    }
  }

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Crunchy Bites</h1>
          <p className="text-muted-foreground">Checking system status...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Crunchy Bites</h1>
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  )
}