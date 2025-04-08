"use client"

import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
  message?: string
}

export function LoadingSpinner({ size = "md", className, message }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-3",
    lg: "h-12 w-12 border-4",
  }

  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <div
        className={cn("animate-spin rounded-full border-solid border-primary border-t-transparent", sizeClasses[size])}
      />
      {message && <p className="mt-4 text-muted-foreground">{message}</p>}
    </div>
  )
}
