"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { useECGData } from "@/context/ecg-data-context"
import { detectRPeaks } from "@/lib/r-peak-detection"
import { extractSegments } from "@/lib/segment-extraction"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, ZoomIn, ZoomOut } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function ECGVisualization() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { ecgData, setECGData } = useECGData()
  const [threshold, setThreshold] = useState(0.5)
  const [windowSize, setWindowSize] = useState(30)
  const [segmentLength, setSegmentLength] = useState("360")
  const [databaseType, setDatabaseType] = useState("mit-bih")
  const [zoom, setZoom] = useState(1)
  const [position, setPosition] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!ecgData?.rawData || ecgData.rawData.length === 0) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw ECG signal
    drawECGSignal(ctx, canvas.width, canvas.height)

    // Draw R-peaks if available
    if (ecgData.rPeaks && ecgData.rPeaks.length > 0) {
      drawRPeaks(ctx, canvas.width, canvas.height)
    }
  }, [ecgData, zoom, position])

  const drawECGSignal = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (!ecgData?.rawData) return

    const data = ecgData.rawData
    const startIdx = Math.floor(position * data.length)
    const visiblePoints = Math.floor(data.length / zoom)
    const endIdx = Math.min(startIdx + visiblePoints, data.length)

    // Find min and max for scaling
    let min = Number.POSITIVE_INFINITY
    let max = Number.NEGATIVE_INFINITY

    for (let i = startIdx; i < endIdx; i++) {
      min = Math.min(min, data[i])
      max = Math.max(max, data[i])
    }

    const range = max - min
    const padding = height * 0.1
    const yScale = (height - 2 * padding) / range
    const xScale = width / (endIdx - startIdx)

    // Draw grid
    drawGrid(ctx, width, height)

    // Draw signal
    ctx.beginPath()
    ctx.strokeStyle = "#2563eb"
    ctx.lineWidth = 1.5

    for (let i = startIdx; i < endIdx; i++) {
      const x = (i - startIdx) * xScale
      const y = height - padding - (data[i] - min) * yScale

      if (i === startIdx) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }

    ctx.stroke()
  }

  const drawRPeaks = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (!ecgData?.rawData || !ecgData.rPeaks) return

    const data = ecgData.rawData
    const startIdx = Math.floor(position * data.length)
    const visiblePoints = Math.floor(data.length / zoom)
    const endIdx = Math.min(startIdx + visiblePoints, data.length)

    // Find min and max for scaling
    let min = Number.POSITIVE_INFINITY
    let max = Number.NEGATIVE_INFINITY

    for (let i = startIdx; i < endIdx; i++) {
      min = Math.min(min, data[i])
      max = Math.max(max, data[i])
    }

    const range = max - min
    const padding = height * 0.1
    const yScale = (height - 2 * padding) / range
    const xScale = width / (endIdx - startIdx)

    // Draw R-peaks
    ctx.fillStyle = "rgba(220, 38, 38, 0.7)"

    for (const peakIdx of ecgData.rPeaks) {
      if (peakIdx >= startIdx && peakIdx < endIdx) {
        const x = (peakIdx - startIdx) * xScale
        const y = height - padding - (data[peakIdx] - min) * yScale

        ctx.beginPath()
        ctx.arc(x, y, 5, 0, 2 * Math.PI)
        ctx.fill()
      }
    }
  }

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Draw background
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, width, height)

    // Draw grid
    ctx.strokeStyle = "rgba(156, 163, 175, 0.2)"
    ctx.lineWidth = 1

    // Vertical lines
    const verticalSpacing = width / 20
    for (let x = 0; x <= width; x += verticalSpacing) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }

    // Horizontal lines
    const horizontalSpacing = height / 10
    for (let y = 0; y <= height; y += horizontalSpacing) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }
  }

  const handleDetectRPeaks = () => {
    if (!ecgData?.rawData || ecgData.rawData.length === 0) {
      setError("No ECG data available. Please upload a file first.")
      return
    }

    setError(null)

    try {
      // Detect R-peaks using the enhanced Pan-Tompkins algorithm
      const rPeaks = detectRPeaks(ecgData.rawData, ecgData.samplingRate, threshold, windowSize)

      // Update ECG data with detected R-peaks
      setECGData({
        ...ecgData,
        rPeaks,
      })
    } catch (err) {
      setError("Failed to detect R-peaks. Please check your parameters and try again.")
    }
  }

  const handleExtractSegments = () => {
    if (!ecgData?.rawData || ecgData.rawData.length === 0) {
      setError("No ECG data available. Please upload a file first.")
      return
    }

    if (!ecgData.rPeaks || ecgData.rPeaks.length === 0) {
      setError("No R-peaks detected. Please detect R-peaks first.")
      return
    }

    setError(null)

    try {
      // Extract segments around R-peaks
      const segments = extractSegments(ecgData.rawData, ecgData.rPeaks, Number.parseInt(segmentLength))

      // Update ECG data with extracted segments
      setECGData({
        ...ecgData,
        segments,
      })
    } catch (err) {
      setError("Failed to extract segments. Please check your parameters and try again.")
    }
  }

  if (!ecgData?.rawData || ecgData.rawData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>ECG Visualization</CardTitle>
          <CardDescription>Upload ECG data to visualize and analyze</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No ECG data available. Please upload a file first.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>ECG Visualization</CardTitle>
          <CardDescription>
            {ecgData.fileName} - {ecgData.samplingRate} Hz
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative border rounded-lg overflow-hidden">
            <canvas ref={canvasRef} width={800} height={400} className="w-full h-auto" />
            <div className="absolute top-2 right-2 flex space-x-2">
              <Button variant="outline" size="icon" onClick={() => setZoom(Math.min(zoom * 1.5, 10))}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setZoom(Math.max(zoom / 1.5, 1))}>
                <ZoomOut className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Position</Label>
            <Slider
              value={[position * 100]}
              min={0}
              max={100}
              step={1}
              onValueChange={(value) => setPosition(value[0] / 100)}
            />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="r-peaks">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="r-peaks">R-Peak Detection</TabsTrigger>
          <TabsTrigger value="segments">Segment Extraction</TabsTrigger>
        </TabsList>

        <TabsContent value="r-peaks" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>R-Peak Detection Parameters</CardTitle>
              <CardDescription>Configure parameters for the enhanced Pan-Tompkins algorithm</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="threshold">Detection Threshold: {threshold}</Label>
                </div>
                <Slider
                  id="threshold"
                  value={[threshold * 100]}
                  min={10}
                  max={90}
                  step={1}
                  onValueChange={(value) => setThreshold(value[0] / 100)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="window-size">Analysis Window (ms): {windowSize}</Label>
                </div>
                <Slider
                  id="window-size"
                  value={[windowSize]}
                  min={10}
                  max={100}
                  step={5}
                  onValueChange={(value) => setWindowSize(value[0])}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleDetectRPeaks} className="w-full">
                Detect R-Peaks
              </Button>
            </CardFooter>
          </Card>

          {ecgData.rPeaks && (
            <div className="text-sm text-muted-foreground">{ecgData.rPeaks.length} R-peaks detected</div>
          )}
        </TabsContent>

        <TabsContent value="segments" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Segment Extraction Parameters</CardTitle>
              <CardDescription>Configure parameters for extracting segments around R-peaks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="database-type">Database Type</Label>
                <Select value={databaseType} onValueChange={setDatabaseType}>
                  <SelectTrigger id="database-type">
                    <SelectValue placeholder="Select database type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mit-bih">MIT-BIH (360 samples)</SelectItem>
                    <SelectItem value="incart">INCART (300 samples)</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="segment-length">Segment Length (samples)</Label>
                <Input
                  id="segment-length"
                  type="number"
                  value={segmentLength}
                  onChange={(e) => setSegmentLength(e.target.value)}
                  disabled={databaseType !== "custom"}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleExtractSegments}
                className="w-full"
                disabled={!ecgData.rPeaks || ecgData.rPeaks.length === 0}
              >
                Extract Segments
              </Button>
            </CardFooter>
          </Card>

          {ecgData.segments && (
            <div className="text-sm text-muted-foreground">{ecgData.segments.length} segments extracted</div>
          )}
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
