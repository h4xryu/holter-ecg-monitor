"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { WifiOff } from "lucide-react"

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine)

    // Add event listeners
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Clean up
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  if (isOnline) {
    return null
  }

  return (
    <Alert variant="warning" className="fixed bottom-4 right-4 max-w-md z-50">
      <WifiOff className="h-4 w-4" />
      <AlertTitle>You are offline</AlertTitle>
      <AlertDescription>
        The app will continue to work with limited functionality. Your changes will be saved and synchronized when
        you're back online.
      </AlertDescription>
    </Alert>
  )
}
