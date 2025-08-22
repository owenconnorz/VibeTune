"use client"

import React from "react"

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function ErrorBoundaryComponent({ children, fallback }: ErrorBoundaryProps) {
  const [hasError, setHasError] = React.useState(false)
  const [error, setError] = React.useState<Error | undefined>(undefined)

  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error("Error caught by boundary:", event.error)
      setHasError(true)
      setError(event.error)
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("Unhandled promise rejection caught by boundary:", event.reason)
      setHasError(true)
      setError(new Error(event.reason))
    }

    window.addEventListener("error", handleError)
    window.addEventListener("unhandledrejection", handleUnhandledRejection)

    return () => {
      window.removeEventListener("error", handleError)
      window.removeEventListener("unhandledrejection", handleUnhandledRejection)
    }
  }, [])

  // Reset error state when children change
  React.useEffect(() => {
    if (hasError) {
      setHasError(false)
      setError(undefined)
    }
  }, [children])

  if (hasError) {
    return (
      fallback || (
        <div className="flex items-center justify-center p-4 text-white/60">
          <p>Something went wrong</p>
        </div>
      )
    )
  }

  return <>{children}</>
}
