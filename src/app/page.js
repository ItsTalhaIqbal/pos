"use client"

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  const checkReq = useRef(0)

  useEffect(() => {
    const controller = new AbortController()
    const run = async () => {
      const thisId = ++checkReq.current
      try {
        const response = await fetch('/api/categories', { signal: controller.signal })
        const data = await response.json()
        if (thisId !== checkReq.current) return
        if (data.categories && data.categories.length > 0) router.push('/dashboard')
        else router.push('/setup')
      } catch (error) {
        if (error.name === 'AbortError') return
        router.push('/setup')
      } finally {
        if (thisId === checkReq.current) setChecking(false)
      }
    }
    run()
    return () => controller.abort()
  }, [router])

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