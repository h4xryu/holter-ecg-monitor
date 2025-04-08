"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"

export function useResizeObserver(ref: React.RefObject<HTMLElement>) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const observerRef = useRef<ResizeObserver | null>(null)

  useEffect(() => {
    if (!ref.current) return

    // Create observer
    observerRef.current = new ResizeObserver((entries) => {
      if (entries[0]) {
        const { width, height } = entries[0].contentRect
        setDimensions({ width, height })
      }
    })

    // Start observing
    observerRef.current.observe(ref.current)

    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [ref])

  return dimensions
}
