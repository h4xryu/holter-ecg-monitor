"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useECGData } from "@/context/ecg-data-context"
import { ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export function SampleByampleView() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { ecgData } = useECGData()
  const [zoom, setZoom] = useState(1)
  const [timePosition, setTimePosition] = useState(0) // Position in seconds
  const [error, setError] = useState<string | null>(null)
  const [selectedSampleIndex, setSelectedSampleIndex] = useState<number | null>(null)
  const [goToTime, setGoToTime] = useState("")
  const [visibleTimeRange, setVisibleTimeRange] = useState<{ start: number; end: number }>({ start: 0, end: 10 })

  // Draw the ECG data as a time-amplitude graph
  useEffect(() => {
    if (!ecgData?.rawData || ecgData.rawData.length === 0 || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw background
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Calculate time values
    const data = ecgData.rawData
    const samplingRate = ecgData.samplingRate
    const totalDurationSec = data.length / samplingRate

    // Calculate visible time range based on zoom and position
    const visibleDuration = totalDurationSec / zoom
    const startTime = Math.min(timePosition, totalDurationSec - visibleDuration)
    const endTime = startTime + visibleDuration

    // Convert time to sample indices
    const startSample = Math.floor(startTime * samplingRate)
    const endSample = Math.min(Math.ceil(endTime * samplingRate), data.length)

    setVisibleTimeRange({ start: startTime, end: endTime })

    // Find min and max amplitude for visible range
    let minAmp = Number.POSITIVE_INFINITY
    let maxAmp = Number.NEGATIVE_INFINITY
    for (let i = startSample; i < endSample; i++) {
      minAmp = Math.min(minAmp, data[i])
      maxAmp = Math.max(maxAmp, data[i])
    }

    // Add 10% padding to amplitude range
    const ampRange = maxAmp - minAmp
    minAmp -= ampRange * 0.1
    maxAmp += ampRange * 0.1

    // Draw grid
    drawTimeGrid(ctx, canvas.width, canvas.height, startTime, endTime, minAmp, maxAmp)

    // Draw ECG signal
    const xScale = canvas.width / (endTime - startTime)
    const yScale = canvas.height / (maxAmp - minAmp)

    // Draw line
    ctx.beginPath()
    ctx.strokeStyle = "#2563eb"
    ctx.lineWidth = 2

    for (let i = startSample; i < endSample; i++) {
      const time = i / samplingRate
      const x = (time - startTime) * xScale
      const y = canvas.height - (data[i] - minAmp) * yScale

      if (i === startSample) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
    ctx.stroke()

    // Draw R-peaks if available
    if (ecgData.rPeaks && ecgData.rPeaks.length > 0) {
      ctx.fillStyle = "#ef4444"

      for (const peakIdx of ecgData.rPeaks) {
        if (peakIdx >= startSample && peakIdx < endSample) {
          const time = peakIdx / samplingRate
          const x = (time - startTime) * xScale
          const y = canvas.height - (data[peakIdx] - minAmp) * yScale

          ctx.beginPath()
          ctx.arc(x, y, 5, 0, 2 * Math.PI)
          ctx.fill()
        }
      }
    }

    // Draw selected sample if within visible range
    if (selectedSampleIndex !== null && selectedSampleIndex >= startSample && selectedSampleIndex < endSample) {
      const time = selectedSampleIndex / samplingRate
      const x = (time - startTime) * xScale
      const y = canvas.height - (data[selectedSampleIndex] - minAmp) * yScale

      // Draw highlighted point
      ctx.fillStyle = "#f97316" // Orange
      ctx.beginPath()
      ctx.arc(x, y, 6, 0, 2 * Math.PI)
      ctx.fill()

      // Draw vertical line
      ctx.strokeStyle = "#f97316"
      ctx.lineWidth = 1
      ctx.setLineDash([5, 3])
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvas.height)
      ctx.stroke()
      ctx.setLineDash([])

      // Draw label
      ctx.fillStyle = "#000000"
      ctx.font = "12px Arial"
      ctx.textAlign = "center"
      ctx.fillText(`Time: ${time.toFixed(3)}s, Value: ${data[selectedSampleIndex].toFixed(2)}`, x, 20)
    }
  }, [ecgData, zoom, timePosition, selectedSampleIndex])

  // Draw time grid with time labels
  const drawTimeGrid = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    startTime: number,
    endTime: number,
    minAmp: number,
    maxAmp: number,
  ) => {
    // Draw minor grid
    ctx.strokeStyle = "rgba(156, 163, 175, 0.2)"
    ctx.lineWidth = 1

    // Calculate time grid spacing (aim for ~10 vertical lines)
    const timeRange = endTime - startTime
    const timeGridSpacing = calculateNiceTimeSpacing(timeRange / 10)

    // Calculate amplitude grid spacing (aim for ~10 horizontal lines)
    const ampRange = maxAmp - minAmp
    const ampGridSpacing = calculateNiceValueSpacing(ampRange / 10)

    // Draw vertical time grid lines
    const firstGridTime = Math.ceil(startTime / timeGridSpacing) * timeGridSpacing
    for (let t = firstGridTime; t <= endTime; t += timeGridSpacing) {
      const x = ((t - startTime) / timeRange) * width

      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()

      // Add time label
      ctx.fillStyle = "#6b7280"
      ctx.font = "10px Arial"
      ctx.textAlign = "center"
      ctx.fillText(`${t.toFixed(1)}s`, x, height - 5)
    }

    // Draw horizontal amplitude grid lines
    const firstAmpGrid = Math.ceil(minAmp / ampGridSpacing) * ampGridSpacing
    for (let a = firstAmpGrid; a <= maxAmp; a += ampGridSpacing) {
      const y = height - ((a - minAmp) / ampRange) * height

      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()

      // Add amplitude label
      ctx.fillStyle = "#6b7280"
      ctx.font = "10px Arial"
      ctx.textAlign = "left"
      ctx.fillText(a.toFixed(1), 5, y - 5)
    }

    // Draw axes labels
    ctx.fillStyle = "#000000"
    ctx.font = "12px Arial"
    ctx.textAlign = "center"
    ctx.fillText("Time (seconds)", width / 2, height - 20)

    ctx.save()
    ctx.translate(15, height / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.textAlign = "center"
    ctx.fillText("Amplitude", 0, 0)
    ctx.restore()
  }

  // Calculate nice spacing for time grid
  const calculateNiceTimeSpacing = (targetSpacing: number) => {
    const exponent = Math.floor(Math.log10(targetSpacing))
    const fraction = targetSpacing / Math.pow(10, exponent)

    let niceFraction
    if (fraction < 1.5) niceFraction = 1
    else if (fraction < 3) niceFraction = 2
    else if (fraction < 7) niceFraction = 5
    else niceFraction = 10

    return niceFraction * Math.pow(10, exponent)
  }

  // Calculate nice spacing for amplitude grid
  const calculateNiceValueSpacing = (targetSpacing: number) => {
    const exponent = Math.floor(Math.log10(targetSpacing))
    const fraction = targetSpacing / Math.pow(10, exponent)

    let niceFraction
    if (fraction < 1.5) niceFraction = 1
    else if (fraction < 3) niceFraction = 2
    else if (fraction < 7) niceFraction = 5
    else niceFraction = 10

    return niceFraction * Math.pow(10, exponent)
  }

  const handleZoomIn = () => {
    setZoom(Math.min(zoom * 1.5, 20))
  }

  const handleZoomOut = () => {
    setZoom(Math.max(zoom / 1.5, 1))
  }

  const handleReset = () => {
    setZoom(1)
    setTimePosition(0)
    setSelectedSampleIndex(null)
  }

  const handleTimePositionChange = (value: number[]) => {
    if (!ecgData?.rawData) return

    const totalDurationSec = ecgData.rawData.length / ecgData.samplingRate
    const visibleDuration = totalDurationSec / zoom
    const maxPosition = Math.max(0, totalDurationSec - visibleDuration)

    setTimePosition(maxPosition * (value[0] / 100))
  }

  const handlePrevSample = () => {
    if (!ecgData?.rawData) return

    if (selectedSampleIndex === null) {
      // If no sample is selected, select the one in the middle of the view
      const middleTime = (visibleTimeRange.start + visibleTimeRange.end) / 2
      const middleSample = Math.floor(middleTime * ecgData.samplingRate)
      setSelectedSampleIndex(middleSample)
    } else {
      setSelectedSampleIndex(Math.max(0, selectedSampleIndex - 1))

      // If the selected sample is outside the visible range, adjust the view
      const sampleTime = selectedSampleIndex / ecgData.samplingRate
      if (sampleTime < visibleTimeRange.start) {
        setTimePosition(sampleTime)
      }
    }
  }

  const handleNextSample = () => {
    if (!ecgData?.rawData) return

    if (selectedSampleIndex === null) {
      // If no sample is selected, select the one in the middle of the view
      const middleTime = (visibleTimeRange.start + visibleTimeRange.end) / 2
      const middleSample = Math.floor(middleTime * ecgData.samplingRate)
      setSelectedSampleIndex(middleSample)
    } else {
      setSelectedSampleIndex(Math.min(ecgData.rawData.length - 1, selectedSampleIndex + 1))

      // If the selected sample is outside the visible range, adjust the view
      const sampleTime = selectedSampleIndex / ecgData.samplingRate
      if (sampleTime > visibleTimeRange.end) {
        const totalDurationSec = ecgData.rawData.length / ecgData.samplingRate
        const visibleDuration = totalDurationSec / zoom
        setTimePosition(Math.min(sampleTime, totalDurationSec - visibleDuration))
      }
    }
  }

  const handleGoToTime = () => {
    if (!ecgData?.rawData) return

    const time = Number.parseFloat(goToTime)
    if (isNaN(time)) {
      setError("Please enter a valid time in seconds")
      return
    }

    const totalDurationSec = ecgData.rawData.length / ecgData.samplingRate

    if (time < 0 || time > totalDurationSec) {
      setError(`Time must be between 0 and ${totalDurationSec.toFixed(2)} seconds`)
      return
    }

    setError(null)

    // Convert time to sample index
    const sampleIndex = Math.floor(time * ecgData.samplingRate)
    setSelectedSampleIndex(sampleIndex)

    // Adjust view to show the selected time
    const visibleDuration = totalDurationSec / zoom
    const newPosition = Math.max(0, Math.min(time - visibleDuration / 2, totalDurationSec - visibleDuration))
    setTimePosition(newPosition)
  }

  if (!ecgData?.rawData || ecgData.rawData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Time-Amplitude View</CardTitle>
          <CardDescription>View ECG data as a time-amplitude graph</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No ECG data available. Please upload a file first.</p>
        </CardContent>
      </Card>
    )
  }

  // Calculate total duration in seconds
  const totalDurationSec = ecgData.rawData.length / ecgData.samplingRate

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Time-Amplitude View</CardTitle>
          <CardDescription>
            {ecgData.fileName} - {ecgData.samplingRate} Hz - Total Duration: {totalDurationSec.toFixed(2)} seconds
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2 justify-between items-center">
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={handleZoomIn}>
                <ZoomIn className="h-4 w-4 mr-1" /> Zoom In
              </Button>
              <Button variant="outline" size="sm" onClick={handleZoomOut}>
                <ZoomOut className="h-4 w-4 mr-1" /> Zoom Out
              </Button>
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-1" /> Reset
              </Button>
            </div>

            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={handlePrevSample}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Prev
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
              <Button variant="outline" size="sm" onClick={handleNextSample}>
                <ChevronRight className="h-4 w-4 mr-1" /> Next
              </Button>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <canvas ref={canvasRef} width={800} height={400} className="w-full h-auto" />
          </div>

          <div className="space-y-2">
            <Label>
              Time Position ({visibleTimeRange.start.toFixed(2)}s - {visibleTimeRange.end.toFixed(2)}s of{" "}
              {totalDurationSec.toFixed(2)}s)
            </Label>
            <Slider
              value={[(timePosition / (totalDurationSec - totalDurationSec / zoom)) * 100 || 0]}
              min={0}
              max={100}
              step={1}
              onValueChange={handleTimePositionChange}
            />
          </div>

          {selectedSampleIndex !== null && (
            <div className="p-4 border rounded-md bg-muted/20">
              <h4 className="font-medium mb-2">Selected Point Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Sample Index:</p>
                  <p className="font-medium">{selectedSampleIndex}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Time (s):</p>
                  <p className="font-medium">{(selectedSampleIndex / ecgData.samplingRate).toFixed(3)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amplitude:</p>
                  <p className="font-medium">{ecgData.rawData[selectedSampleIndex].toFixed(4)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">R-Peak:</p>
                  <p className="font-medium">
                    {ecgData.rPeaks && ecgData.rPeaks.includes(selectedSampleIndex) ? "Yes" : "No"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Table</CardTitle>
          <CardDescription>View data points around the selected time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-auto max-h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Index</TableHead>
                  <TableHead>Time (s)</TableHead>
                  <TableHead>Amplitude</TableHead>
                  <TableHead>R-Peak</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedSampleIndex !== null
                  ? // Show samples around the selected one
                    Array.from({ length: 11 }, (_, i) => {
                      const index = Math.max(0, selectedSampleIndex - 5) + i
                      if (index >= ecgData.rawData.length) return null

                      const time = index / ecgData.samplingRate
                      const value = ecgData.rawData[index]
                      const isRPeak = ecgData.rPeaks ? ecgData.rPeaks.includes(index) : false
                      const isSelected = index === selectedSampleIndex

                      return (
                        <TableRow key={index} className={isSelected ? "bg-muted" : ""}>
                          <TableCell className="font-medium">{index}</TableCell>
                          <TableCell>{time.toFixed(3)}</TableCell>
                          <TableCell>{value.toFixed(4)}</TableCell>
                          <TableCell>
                            {isRPeak && (
                              <div className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-red-100 text-red-800">
                                R
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  : // If no sample is selected, show samples from the visible range
                    Array.from({ length: 10 }, (_, i) => {
                      const time = visibleTimeRange.start + (visibleTimeRange.end - visibleTimeRange.start) * (i / 9)
                      const index = Math.floor(time * ecgData.samplingRate)
                      if (index >= ecgData.rawData.length) return null

                      const value = ecgData.rawData[index]
                      const isRPeak = ecgData.rPeaks ? ecgData.rPeaks.includes(index) : false

                      return (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{index}</TableCell>
                          <TableCell>{time.toFixed(3)}</TableCell>
                          <TableCell>{value.toFixed(4)}</TableCell>
                          <TableCell>
                            {isRPeak && (
                              <div className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-red-100 text-red-800">
                                R
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

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
