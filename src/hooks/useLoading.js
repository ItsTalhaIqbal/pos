import { useState, useEffect } from 'react'

export function usePageLoading() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate minimum loading time for better UX
    const timer = setTimeout(() => setLoading(false), 300)
    return () => clearTimeout(timer)
  }, [])

  return loading
}

export function useAsyncOperation() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const execute = async (asyncFunction) => {
    try {
      setLoading(true)
      setError(null)
      const result = await asyncFunction()
      return result
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { loading, error, execute }
}
