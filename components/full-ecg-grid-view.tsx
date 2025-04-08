"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { useECGData } from "@/context/ecg-data-context"
import { ChevronLeft, ChevronRight, Brain, AlertCircle, Heart, Activity, ZoomIn, ZoomOut } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useResizeObserver } from "@/hooks/use-resize-observer"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useModel } from "@/context/model-context"
import { detectRPeaksWithSlidingWindow } from "@/lib/r-peak-detection"
import { Slider } from "@/components/ui/slider"

// Arrhythmia type definition
export type ArrhythmiaType = "N" | "S" | "V" | "F" | "Q" | "Unknown"

// Arrhythmia event interface
interface ArrhythmiaEvent {
  type: ArrhythmiaType
  peakIndex: number
  confidence: number
  timestamp: Date
}

export function FullECGGridView() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { ecgData, setECGData } = useECGData()
  const { activeModel } = useModel()
  const { width: containerWidth, height: containerHeight } = useResizeObserver(containerRef)

  const [secondsPerRow, setSecondsPerRow] = useState(5)
  const [selectedPeak, setSelectedPeak] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentRow, setCurrentRow] = useState(0)
  const [showGrid, setShowGrid] = useState(true)
  const [goToTime, setGoToTime] = useState("")
  const [heartRate, setHeartRate] = useState<number | null>(null)
  const [extractedSegment, setExtractedSegment] = useState<Float32Array | null>(null)
  const [isClassifying, setIsClassifying] = useState(false)
  const [arrhythmiaEvents, setArrhythmiaEvents] = useState<ArrhythmiaEvent[]>([])
  const [autoClassify, setAutoClassify] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // Add scale factor state
  const [scaleFactor, setScaleFactor] = useState(5.0)

  // Calculate derived values
  const samplingRate = ecgData?.samplingRate || 250
  const totalSeconds = ecgData?.rawData ? ecgData.rawData.length / samplingRate : 0
  const totalRows = Math.ceil(totalSeconds / secondsPerRow)
  const rowHeight = 120 // Fixed height for each row

  // 데이터베이스 유형 선택을 위한 상태 변수 추가:
  const [databaseType, setDatabaseType] = useState<"mit-bih" | "incart">("mit-bih")

  // Set canvas dimensions and draw ECG when data or container size changes
  useEffect(() => {
    if (!ecgData?.rawData || !canvasRef.current || !containerWidth) return

    const canvas = canvasRef.current

    // Set canvas width to container width
    canvas.width = containerWidth

    // Set canvas height based on number of rows
    const calculatedHeight = totalRows * rowHeight
    canvas.height = Math.max(calculatedHeight, containerHeight || 300)

    // Draw the ECG grid
    drawECGGrid()
  }, [ecgData, containerWidth, containerHeight, secondsPerRow, showGrid, selectedPeak, totalRows, scaleFactor])

  // Calculate heart rate from R-peaks
  useEffect(() => {
    if (!ecgData?.rPeaks || ecgData.rPeaks.length < 2) return

    const recentPeaks = ecgData.rPeaks.slice(-10) // Use last 10 peaks
    if (recentPeaks.length < 2) return

    const intervals = []
    for (let i = 1; i < recentPeaks.length; i++) {
      intervals.push(recentPeaks[i] - recentPeaks[i - 1])
    }

    // Calculate average RR interval
    const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length

    // Convert to heart rate (beats per minute)
    const hr = (60 * samplingRate) / avgInterval
    setHeartRate(Math.round(hr))
  }, [ecgData?.rPeaks, samplingRate])

  // Extract segment when a peak is selected
  useEffect(() => {
    if (selectedPeak === null || !ecgData?.rawData) {
      setExtractedSegment(null)
      return
    }

    // Extract 360 samples around the R-peak (MIT-BIH standard)
    // const segmentLength = 360
    // const halfSegment = Math.floor(segmentLength / 2)

    // // Calculate segment boundaries
    // const start = Math.max(0, selectedPeak - halfSegment)
    // const end = Math.min(ecgData.rawData.length - 1, start + segmentLength)

    // // Create segment
    // const segment = new Float32Array(segmentLength)

    // // Fill segment with data or zero-pad if needed
    // for (let i = 0; i < segmentLength; i++) {
    //   const dataIndex = start + i
    //   segment[i] = dataIndex < ecgData.rawData.length ? ecgData.rawData[dataIndex] : 0
    // }

    const segment = extractSegmentAroundPeak(selectedPeak)

    setExtractedSegment(segment)

    // Auto-classify if enabled
    if (autoClassify && activeModel) {
      classifySegment(segment)
    }
  }, [selectedPeak, ecgData?.rawData, autoClassify, activeModel])

  // Draw the ECG grid
  const drawECGGrid = () => {
    if (!ecgData?.rawData || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const data = ecgData.rawData

    // Find min/max for scaling
    let min = Number.POSITIVE_INFINITY
    let max = Number.NEGATIVE_INFINITY

    for (let i = 0; i < data.length; i++) {
      if (data[i] < min) min = data[i]
      if (data[i] > max) max = data[i]
    }

    // Add 20% padding (1.2x scaling)
    const range = max - min
    min -= range * 0.2
    max += range * 0.2

    // Draw each row
    for (let rowIndex = 0; rowIndex < totalRows; rowIndex++) {
      const y = rowIndex * rowHeight
      const rowStartSample = rowIndex * secondsPerRow * samplingRate
      const rowEndSample = Math.min(rowStartSample + secondsPerRow * samplingRate, data.length)

      // Draw row background
      ctx.fillStyle = rowIndex % 2 === 0 ? "#f8f9fa" : "#f1f3f5"
      ctx.fillRect(0, y, canvas.width, rowHeight)

      // Draw grid if enabled
      if (showGrid) {
        // Draw minor grid lines
        ctx.strokeStyle = "#e5e5e5"
        ctx.lineWidth = 0.5

        // Vertical grid lines (0.2 seconds)
        const secondWidth = canvas.width / secondsPerRow
        for (let i = 0; i <= secondsPerRow * 5; i++) {
          const x = (i / 5) * secondWidth
          ctx.beginPath()
          ctx.moveTo(x, y)
          ctx.lineTo(x, y + rowHeight)
          ctx.stroke()
        }

        // Horizontal grid lines (0.5mV)
        const step = rowHeight / 6
        for (let i = 0; i <= 6; i++) {
          ctx.beginPath()
          ctx.moveTo(0, y + i * step)
          ctx.lineTo(canvas.width, y + i * step)
          ctx.stroke()
        }

        // Draw major grid lines
        ctx.strokeStyle = "#d0d0d0"
        ctx.lineWidth = 1

        // Vertical major lines (1 second)
        for (let i = 0; i <= secondsPerRow; i++) {
          const x = i * secondWidth
          ctx.beginPath()
          ctx.moveTo(x, y)
          ctx.lineTo(x, y + rowHeight)
          ctx.stroke()
        }

        // Horizontal major lines (1mV)
        for (let i = 0; i <= 3; i++) {
          const yPos = y + i * (step * 2)
          ctx.beginPath()
          ctx.moveTo(0, yPos)
          ctx.lineTo(canvas.width, yPos)
          ctx.stroke()
        }
      }

      // Draw time labels
      ctx.fillStyle = "#666"
      ctx.font = "10px Arial"
      for (let i = 0; i <= secondsPerRow; i++) {
        const x = i * (canvas.width / secondsPerRow)
        const timeInSeconds = rowIndex * secondsPerRow + i
        const minutes = Math.floor(timeInSeconds / 60)
        const seconds = timeInSeconds % 60
        ctx.fillText(`${minutes}:${seconds.toString().padStart(2, "0")}`, x + 2, y + 12)
      }

      // Draw row label
      ctx.fillStyle = "#333"
      ctx.font = "11px Arial"
      ctx.fillText(`Row ${rowIndex + 1}`, 5, y + rowHeight - 5)

      // Draw ECG line
      if (rowStartSample < rowEndSample) {
        ctx.strokeStyle = "#2563eb"
        ctx.lineWidth = 1.5
        ctx.beginPath()

        // Calculate the center of the row for scaling
        const rowCenter = y + rowHeight / 2

        for (let i = rowStartSample; i < rowEndSample; i++) {
          const x = ((i - rowStartSample) / (secondsPerRow * samplingRate)) * canvas.width

          // Apply scale factor to the signal
          const normalizedValue = (data[i] - min) / (max - min)
          const scaledValue = normalizedValue * scaleFactor

          // Center the signal in the row and apply scaling
          const rowHeightFraction = rowHeight * 0.8
          const y2 = rowCenter - (scaledValue - 0.5) * rowHeightFraction

          if (i === rowStartSample) {
            ctx.moveTo(x, y2)
          } else {
            ctx.lineTo(x, y2)
          }
        }

        ctx.stroke()

        // Draw R-peaks
        if (ecgData.rPeaks) {
          for (const peakIndex of ecgData.rPeaks) {
            if (peakIndex >= rowStartSample && peakIndex < rowEndSample) {
              const x = ((peakIndex - rowStartSample) / (secondsPerRow * samplingRate)) * canvas.width

              // Apply scale factor to the peak
              const normalizedValue = (data[peakIndex] - min) / (max - min)
              const scaledValue = normalizedValue * scaleFactor

              // Center the peak in the row and apply scaling
              const rowHeightFraction = rowHeight * 0.8
              const y2 = rowCenter - (scaledValue - 0.5) * rowHeightFraction

              // Draw R-peak circle
              ctx.fillStyle = peakIndex === selectedPeak ? "#ef4444" : "#3b82f6"
              ctx.beginPath()
              ctx.arc(x, y2, 4, 0, Math.PI * 2)
              ctx.fill()

              // Draw arrhythmia marker if this peak has been classified
              const arrhythmiaEvent = arrhythmiaEvents.find((event) => event.peakIndex === peakIndex)
              if (arrhythmiaEvent && arrhythmiaEvent.type !== "N") {
                // Draw a colored marker above the peak
                const markerColors: Record<ArrhythmiaType, string> = {
                  N: "#10b981", // green
                  S: "#f59e0b", // amber
                  V: "#ef4444", // red
                  F: "#6366f1", // indigo
                  Q: "#71717a", // gray
                  Unknown: "#94a3b8", // slate
                }

                ctx.fillStyle = markerColors[arrhythmiaEvent.type]
                ctx.beginPath()
                ctx.arc(x, y2 - 15, 6, 0, 2 * Math.PI)
                ctx.fill()

                // Add label
                ctx.fillStyle = "#000000"
                ctx.font = "10px Arial"
                ctx.textAlign = "center"
                ctx.fillText(arrhythmiaEvent.type, x, y2 - 25)
              }
            }
          }
        }
      }
    }
  }

  // Detect R-peaks using sliding window approach
  const handleDetectAllRPeaks = () => {
    if (!ecgData?.rawData || ecgData.rawData.length === 0) {
      setError("No ECG data available for R-peak detection")
      return
    }

    setError(null)

    try {
      // Use the library function to detect R-peaks with sliding window
      const allRPeaks = detectRPeaksWithSlidingWindow(
        ecgData.rawData,
        ecgData.samplingRate,
        500, // 500-sample window
        0.5, // threshold
      )

      // Update ECG data with detected R-peaks
      setECGData({
        ...ecgData,
        rPeaks: allRPeaks,
      })

      // Show success message
      setError(null)
    } catch (err) {
      setError(`R-peak detection failed: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  // Handle canvas click to select R-peaks
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!ecgData?.rawData || !ecgData.rPeaks || !canvasRef.current) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Calculate row
    const rowIndex = Math.floor(y / rowHeight)

    // Calculate sample index
    const samplesPerRow = secondsPerRow * samplingRate
    const rowStartSample = rowIndex * samplesPerRow
    const xRatio = x / canvas.width
    const sampleOffset = Math.floor(xRatio * samplesPerRow)
    const sampleIndex = rowStartSample + sampleOffset

    // Find closest R-peak
    if (sampleIndex >= 0 && sampleIndex < ecgData.rawData.length) {
      const pixelThreshold = 20
      const samplesPerPixel = samplesPerRow / canvas.width
      const sampleThreshold = pixelThreshold * samplesPerPixel

      let closestPeak = -1
      let minDistance = sampleThreshold

      for (const peakIndex of ecgData.rPeaks) {
        const distance = Math.abs(peakIndex - sampleIndex)
        if (distance < minDistance) {
          minDistance = distance
          closestPeak = peakIndex
        }
      }

      if (closestPeak !== -1) {
        setSelectedPeak(closestPeak)

        // Scroll to the row containing the selected peak
        const peakRowIndex = Math.floor(closestPeak / samplesPerRow)
        setCurrentRow(peakRowIndex)

        if (containerRef.current) {
          const scrollY = peakRowIndex * rowHeight
          containerRef.current.scrollTo({
            top: scrollY - 50, // Add some margin
            behavior: "smooth",
          })
        }
      }
    }
  }

  // Handle navigation
  const handlePrevRow = () => {
    if (currentRow > 0) {
      setCurrentRow(currentRow - 1)
      scrollToRow(currentRow - 1)
    }
  }

  const handleNextRow = () => {
    if (currentRow < totalRows - 1) {
      setCurrentRow(currentRow + 1)
      scrollToRow(currentRow + 1)
    }
  }

  const scrollToRow = (rowIndex: number) => {
    if (containerRef.current) {
      const scrollY = rowIndex * rowHeight
      containerRef.current.scrollTo({
        top: scrollY,
        behavior: "smooth",
      })
    }
  }

  const handleGoToTime = () => {
    if (!ecgData?.rawData) return

    const time = Number.parseFloat(goToTime)
    if (isNaN(time)) {
      setError("Please enter a valid time in seconds")
      return
    }

    if (time < 0 || time > totalSeconds) {
      setError(`Time must be between 0 and ${totalSeconds.toFixed(2)} seconds`)
      return
    }

    setError(null)

    // Calculate row for the given time
    const targetRow = Math.floor(time / secondsPerRow)
    setCurrentRow(targetRow)
    scrollToRow(targetRow)
  }

  const handleSecondsPerRowChange = (value: string) => {
    const seconds = Number.parseInt(value, 10)
    if (!isNaN(seconds) && seconds > 0) {
      setSecondsPerRow(seconds)
    }
  }

  // Handle scale factor changes
  const handleScaleFactorChange = (value: number[]) => {
    setScaleFactor(value[0])
  }

  // Increase scale factor
  const increaseScale = () => {
    setScaleFactor(Math.min(scaleFactor + 0.5, 5.0))
  }

  // Decrease scale factor
  const decreaseScale = () => {
    setScaleFactor(Math.max(scaleFactor - 0.5, 0.5))
  }

  // Classify the current segment
  const classifySegment = async (segment: Float32Array) => {
    if (!activeModel || !segment) {
      setError("No model or segment available for classification")
      return
    }

    setIsClassifying(true)
    setError(null)

    try {
      // Simulate classification (in a real app, this would use the model)
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Generate a random classification result for demonstration
      const classes: ArrhythmiaType[] = ["N", "S", "V", "F", "Q"]
      const randomIndex = Math.floor(Math.random() * classes.length)
      const classType = classes[randomIndex]
      const confidence = 0.5 + Math.random() * 0.5 // Random confidence between 0.5 and 1.0

      // Create arrhythmia event
      const event: ArrhythmiaEvent = {
        type: classType,
        peakIndex: selectedPeak!,
        confidence,
        timestamp: new Date(),
      }

      // Add to events list
      setArrhythmiaEvents((prev) => {
        // Remove any existing event for this peak
        const filtered = prev.filter((e) => e.peakIndex !== selectedPeak)
        return [...filtered, event]
      })

      // Show success message
      setError(null)
    } catch (err) {
      setError(`Classification failed: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setIsClassifying(false)
    }
  }

  // Handle classification button click
  const handleClassify = () => {
    if (!extractedSegment) {
      setError("No segment extracted. Please select an R-peak first.")
      return
    }

    classifySegment(extractedSegment)
  }

  // Get badge color for arrhythmia type
  const getArrhythmiaColor = (type: ArrhythmiaType): string => {
    switch (type) {
      case "N":
        return "bg-green-100 text-green-800"
      case "S":
        return "bg-amber-100 text-amber-800"
      case "V":
        return "bg-red-100 text-red-800"
      case "F":
        return "bg-indigo-100 text-indigo-800"
      case "Q":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-slate-100 text-slate-800"
    }
  }

  // Get arrhythmia description
  const getArrhythmiaDescription = (type: ArrhythmiaType): string => {
    switch (type) {
      case "N":
        return "Normal Beat"
      case "S":
        return "Supraventricular Premature Beat"
      case "V":
        return "Ventricular Premature Beat"
      case "F":
        return "Fusion Beat"
      case "Q":
        return "Unknown Beat"
      default:
        return "Unclassified"
    }
  }

  // Automatically detect R-peaks when data is loaded
  useEffect(() => {
    if (ecgData?.rawData && ecgData.rawData.length > 0 && (!ecgData.rPeaks || ecgData.rPeaks.length === 0)) {
      // Automatically detect R-peaks using sliding window approach
      handleDetectAllRPeaks()
      setIsInitialized(true)
    }
  }, [ecgData?.rawData])

  // Force re-render when component mounts to ensure data is displayed
  useEffect(() => {
    // This will trigger a re-render after component mount
    setIsInitialized(true)
  }, [])

  const hasRawData = ecgData?.rawData && ecgData.rawData.length > 0

  // Extract segment around an R-peak based on database type
  const extractSegmentAroundPeak = (peakIndex: number): Float32Array | null => {
    if (!ecgData?.rawData) return null

    // Determine segment length based on database type
    const halfSegmentLength = databaseType === "mit-bih" ? 180 : 150
    const segmentLength = halfSegmentLength * 2

    // Skip first and last R-peaks
    if (peakIndex === ecgData.rPeaks[0] || peakIndex === ecgData.rPeaks[ecgData.rPeaks.length - 1]) {
      return null
    }

    // Calculate segment boundaries
    const start = Math.max(0, peakIndex - halfSegmentLength)
    const end = Math.min(ecgData.rawData.length - 1, peakIndex + halfSegmentLength)

    // Create segment
    const segment = new Float32Array(segmentLength)

    // Fill segment with data or zero-pad if needed
    for (let i = 0; i < segmentLength; i++) {
      const dataIndex = start + i
      segment[i] = dataIndex < ecgData.rawData.length ? ecgData.rawData[dataIndex] : 0
    }

    return segment
  }

  // Update the return statement to show loading state
  // Replace the existing if (!hasRawData) block with this:
  if (!hasRawData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Full ECG Grid View</CardTitle>
          <CardDescription>View ECG data in a standard grid format</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No ECG data available. Please upload a file first.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Full ECG Grid View</CardTitle>
          <CardDescription>
            {ecgData.fileName} - {ecgData.samplingRate} Hz - Total Duration: {totalSeconds.toFixed(2)} seconds
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4 justify-between items-center">
            <div className="flex items-center space-x-2">
              <Label htmlFor="seconds-per-row">Seconds per row:</Label>
              <Select value={secondsPerRow.toString()} onValueChange={handleSecondsPerRowChange}>
                <SelectTrigger id="seconds-per-row" className="w-20">
                  <SelectValue placeholder="5" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="15">15</SelectItem>
                  <SelectItem value="30">30</SelectItem>
                </SelectContent>
              </Select>

              <Label htmlFor="show-grid" className="ml-4">
                Show grid:
              </Label>
              <input
                id="show-grid"
                type="checkbox"
                checked={showGrid}
                onChange={(e) => setShowGrid(e.target.checked)}
                className="ml-2"
              />
            </div>

            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={handlePrevRow} disabled={currentRow <= 0}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Prev Row
              </Button>
              <div className="flex items-center space-x-2">
                <Input
                  className="w-24"
                  value={goToTime}
                  onChange={(e) => setGoToTime(e.target.value)}
                  placeholder="Time (s)"
                />
                <Button variant="outline" size="sm" onClick={handleGoToTime}>
                  Go
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={handleNextRow} disabled={currentRow >= totalRows - 1}>
                <ChevronRight className="h-4 w-4 mr-1" /> Next Row
              </Button>
              <Button variant="default" size="sm" onClick={handleDetectAllRPeaks}>
                <Heart className="h-4 w-4 mr-1" /> Detect All R-Peaks
              </Button>
            </div>
          </div>

          {/* Add amplitude scale controls */}
          <div className="flex items-center space-x-4">
            <Label htmlFor="amplitude-scale" className="min-w-[120px]">
              Amplitude Scale:
            </Label>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="icon" onClick={decreaseScale}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Slider
                id="amplitude-scale"
                value={[scaleFactor]}
                min={0.5}
                max={5.0}
                step={0.1}
                className="w-[200px]"
                onValueChange={handleScaleFactorChange}
              />
              <Button variant="outline" size="icon" onClick={increaseScale}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium">{scaleFactor.toFixed(1)}x</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Label htmlFor="database-type" className="min-w-[120px]">
              Database Type:
            </Label>
            <Select value={databaseType} onValueChange={(value) => setDatabaseType(value as "mit-bih" | "incart")}>
              <SelectTrigger id="database-type" className="w-[200px]">
                <SelectValue placeholder="Select database type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mit-bih">MIT-BIH (360 samples)</SelectItem>
                <SelectItem value="incart">INCART (300 samples)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div ref={containerRef} className="border rounded-lg overflow-auto" style={{ height: "500px" }}>
            <canvas ref={canvasRef} className="w-full" onClick={handleCanvasClick} />
          </div>

          <div className="text-sm text-muted-foreground">
            <p>
              Showing {totalRows} rows, {secondsPerRow} seconds per row. Current row: {currentRow + 1} of {totalRows}.
            </p>
            {selectedPeak !== null && (
              <p className="mt-1">
                Selected R-peak at sample {selectedPeak} ({(selectedPeak / samplingRate).toFixed(2)} seconds)
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Heart Rate Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Heart className="h-5 w-5 mr-2 text-red-500" />
              Heart Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <span className="text-3xl font-bold">{heartRate !== null ? heartRate : "--"}</span>
              <span className="ml-1 text-muted-foreground">BPM</span>
            </div>
          </CardContent>
        </Card>

        {/* Segment Extraction Card */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Activity className="h-5 w-5 mr-2 text-blue-500" />
              Segment Extraction & Classification
            </CardTitle>
            <CardDescription>Extract 360-sample segments around R-peaks for MIT-BIH standard</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Selected R-peak:</span>
                <Badge variant={selectedPeak !== null ? "outline" : "secondary"}>
                  {selectedPeak !== null ? `Sample ${selectedPeak}` : "None"}
                </Badge>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Extracted segment:</span>
                <Badge variant={extractedSegment ? "outline" : "secondary"}>
                  {extractedSegment ? "360 samples" : "None"}
                </Badge>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Auto-classify segments:</span>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="auto-classify"
                    checked={autoClassify}
                    onChange={(e) => setAutoClassify(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="auto-classify">Enable</Label>
                </div>
              </div>

              <Button
                onClick={handleClassify}
                disabled={!extractedSegment || isClassifying || !activeModel}
                className="w-full"
              >
                {isClassifying ? (
                  <>Classifying...</>
                ) : (
                  <>
                    <Brain className="mr-2 h-4 w-4" />
                    Classify Segment
                  </>
                )}
              </Button>

              {!activeModel && (
                <p className="text-xs text-amber-600">No model selected. Please load a model in the Models tab.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="classification">
        <TabsList>
          <TabsTrigger value="classification">Classification Results</TabsTrigger>
          <TabsTrigger value="arrhythmia">Arrhythmia Events</TabsTrigger>
        </TabsList>

        <TabsContent value="classification" className="pt-4">
          {selectedPeak !== null && arrhythmiaEvents.some((e) => e.peakIndex === selectedPeak) ? (
            <Card>
              <CardHeader>
                <CardTitle>Classification Result</CardTitle>
                <CardDescription>
                  R-peak at sample {selectedPeak} ({(selectedPeak / samplingRate).toFixed(2)} seconds)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const event = arrhythmiaEvents.find((e) => e.peakIndex === selectedPeak)!
                  return (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Arrhythmia Type:</span>
                        <Badge className={getArrhythmiaColor(event.type)}>{event.type}</Badge>
                      </div>

                      <div>
                        <span className="font-medium">Description:</span>
                        <p className="mt-1 text-sm">{getArrhythmiaDescription(event.type)}</p>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="font-medium">Confidence:</span>
                        <span>{(event.confidence * 100).toFixed(1)}%</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="font-medium">Timestamp:</span>
                        <span>{event.timestamp.toLocaleTimeString()}</span>
                      </div>

                      {event.type !== "N" && (
                        <Alert variant="warning" className="mt-2">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Abnormal Beat Detected</AlertTitle>
                          <AlertDescription>
                            This beat shows characteristics of {getArrhythmiaDescription(event.type)}. Consider further
                            analysis.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )
                })()}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">
                  {selectedPeak === null
                    ? "Select an R-peak to view classification results"
                    : "This R-peak has not been classified yet. Click 'Classify Segment' to analyze."}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="arrhythmia" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Arrhythmia Events</CardTitle>
              <CardDescription>Detected arrhythmia events from ECG analysis</CardDescription>
            </CardHeader>
            <CardContent>
              {arrhythmiaEvents.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-5 gap-4">
                    {["N", "S", "V", "F", "Q"].map((type) => {
                      const count = arrhythmiaEvents.filter((e) => e.type === type).length
                      const percentage = arrhythmiaEvents.length > 0 ? (count / arrhythmiaEvents.length) * 100 : 0

                      return (
                        <Card key={type} className="p-2">
                          <div className="text-center">
                            <Badge className={getArrhythmiaColor(type as ArrhythmiaType)}>{type}</Badge>
                            <p className="text-2xl font-bold mt-2">{count}</p>
                            <p className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</p>
                          </div>
                        </Card>
                      )
                    })}
                  </div>

                  <div className="border rounded-md divide-y">
                    {arrhythmiaEvents
                      .slice()
                      .reverse()
                      .map((event, idx) => (
                        <div key={idx} className="p-3 flex justify-between items-center hover:bg-muted/50">
                          <div className="flex items-center">
                            <Badge className={getArrhythmiaColor(event.type)} className="mr-2">
                              {event.type}
                            </Badge>
                            <span>
                              Sample {event.peakIndex} ({(event.peakIndex / samplingRate).toFixed(2)}s)
                            </span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-sm text-muted-foreground mr-2">
                              {(event.confidence * 100).toFixed(0)}%
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedPeak(event.peakIndex)
                                // Scroll to the row containing this peak
                                const peakRowIndex = Math.floor(event.peakIndex / (secondsPerRow * samplingRate))
                                setCurrentRow(peakRowIndex)
                                scrollToRow(peakRowIndex)
                              }}
                            >
                              View
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  No arrhythmia events detected yet. Classify R-peaks to detect arrhythmias.
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setArrhythmiaEvents([])}
                disabled={arrhythmiaEvents.length === 0}
              >
                Clear All Events
              </Button>
              <Button
                variant="outline"
                disabled={!activeModel || ecgData.rPeaks.length === 0}
                onClick={async () => {
                  if (!activeModel || ecgData.rPeaks.length === 0) return

                  setIsClassifying(true)
                  setError(null)

                  try {
                    // Clear existing events
                    setArrhythmiaEvents([])

                    // Filter out first and last R-peaks
                    const peaksToProcess = ecgData.rPeaks.filter(
                      (_, idx) => idx !== 0 && idx !== ecgData.rPeaks.length - 1,
                    )

                    // Process each R-peak one by one with delay
                    for (const peakIndex of peaksToProcess) {
                      // Extract segment based on database type
                      const segment = extractSegmentAroundPeak(peakIndex)

                      if (!segment) continue

                      // Show current peak being processed
                      setSelectedPeak(peakIndex)

                      // Scroll to the row containing this peak
                      const peakRowIndex = Math.floor(peakIndex / (secondsPerRow * samplingRate))
                      setCurrentRow(peakRowIndex)
                      scrollToRow(peakRowIndex)

                      // Simulate classification with delay to show progress
                      await new Promise((resolve) => setTimeout(resolve, 800))

                      // Generate random result
                      const classes: ArrhythmiaType[] = ["N", "S", "V", "F", "Q"]
                      const weights = [0.7, 0.1, 0.1, 0.05, 0.05] // Make normal beats more common

                      // Weighted random selection
                      const random = Math.random()
                      let sum = 0
                      let selectedIndex = 0

                      for (let i = 0; i < weights.length; i++) {
                        sum += weights[i]
                        if (random < sum) {
                          selectedIndex = i
                          break
                        }
                      }

                      const classType = classes[selectedIndex]
                      const confidence = 0.5 + Math.random() * 0.5

                      // Add event
                      setArrhythmiaEvents((prev) => [
                        ...prev,
                        {
                          type: classType,
                          peakIndex,
                          confidence,
                          timestamp: new Date(),
                        },
                      ])
                    }
                  } catch (err) {
                    setError(`Batch classification failed: ${err instanceof Error ? err.message : String(err)}`)
                  } finally {
                    setIsClassifying(false)
                  }
                }}
              >
                {isClassifying
                  ? "Processing..."
                  : `Batch Classify (${databaseType === "mit-bih" ? "360" : "300"} samples)`}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
