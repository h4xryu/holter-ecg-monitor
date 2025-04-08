"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useECGData } from "@/context/ecg-data-context"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Download } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export function ECGExport() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { ecgData } = useECGData()
  const [exportFormat, setExportFormat] = useState<"png" | "svg" | "pdf">("png")
  const [showGrid, setShowGrid] = useState(true)
  const [showRPeaks, setShowRPeaks] = useState(true)
  const [showClassifications, setShowClassifications] = useState(true)
  const [width, setWidth] = useState(1200)
  const [height, setHeight] = useState(600)
  const [error, setError] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const generateExport = async () => {
    if (!ecgData?.rawData || ecgData.rawData.length === 0) {
      setError("No ECG data available to export")
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const canvas = canvasRef.current
      if (!canvas) {
        throw new Error("Canvas not available")
      }

      // Set canvas dimensions
      canvas.width = width
      canvas.height = height

      // Get canvas context
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        throw new Error("Could not get canvas context")
      }

      // Draw background
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw grid if enabled
      if (showGrid) {
        drawGrid(ctx, canvas.width, canvas.height)
      }

      // Draw ECG signal
      drawECGSignal(ctx, canvas.width, canvas.height)

      // Draw R-peaks if available and enabled
      if (showRPeaks && ecgData.rPeaks && ecgData.rPeaks.length > 0) {
        drawRPeaks(ctx, canvas.width, canvas.height)
      }

      // Draw classifications if available and enabled
      if (
        showClassifications &&
        ecgData.classifications &&
        ecgData.classifications.length > 0 &&
        ecgData.rPeaks &&
        ecgData.rPeaks.length > 0
      ) {
        drawClassifications(ctx, canvas.width, canvas.height)
      }

      // Add metadata
      drawMetadata(ctx, canvas.width, canvas.height)

      // Export based on selected format
      if (exportFormat === "png") {
        // Export as PNG
        const dataUrl = canvas.toDataURL("image/png")
        downloadFile(dataUrl, `${ecgData.fileName.split(".")[0]}_ecg.png`)
      } else if (exportFormat === "svg") {
        // Export as SVG
        const svgData = generateSVG()
        const svgBlob = new Blob([svgData], { type: "image/svg+xml" })
        const svgUrl = URL.createObjectURL(svgBlob)
        downloadFile(svgUrl, `${ecgData.fileName.split(".")[0]}_ecg.svg`)
        URL.revokeObjectURL(svgUrl)
      } else if (exportFormat === "pdf") {
        // For PDF, we'd typically use a library like jsPDF
        // This is a simplified version
        alert("PDF export would be implemented with a library like jsPDF")
      }

      setIsGenerating(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate export")
      setIsGenerating(false)
    }
  }

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = "rgba(156, 163, 175, 0.2)"
    ctx.lineWidth = 1

    // Vertical lines
    const verticalSpacing = width / 40
    for (let x = 0; x <= width; x += verticalSpacing) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }

    // Horizontal lines
    const horizontalSpacing = height / 20
    for (let y = 0; y <= height; y += horizontalSpacing) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }

    // Draw darker lines every 5 small squares (typical ECG paper)
    ctx.strokeStyle = "rgba(156, 163, 175, 0.5)"

    for (let x = 0; x <= width; x += verticalSpacing * 5) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }

    for (let y = 0; y <= height; y += horizontalSpacing * 5) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }
  }

  const drawECGSignal = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (!ecgData?.rawData) return

    const data = ecgData.rawData

    // Find min and max for scaling
    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1

    const padding = height * 0.1
    const yScale = (height - 2 * padding) / range
    const xScale = width / data.length

    // Draw signal
    ctx.beginPath()
    ctx.strokeStyle = "#2563eb"
    ctx.lineWidth = 2

    for (let i = 0; i < data.length; i++) {
      const x = i * xScale
      const y = height - padding - (data[i] - min) * yScale

      if (i === 0) {
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

    // Find min and max for scaling
    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1

    const padding = height * 0.1
    const yScale = (height - 2 * padding) / range
    const xScale = width / data.length

    // Draw R-peaks
    ctx.fillStyle = "rgba(220, 38, 38, 0.7)"

    for (const peakIdx of ecgData.rPeaks) {
      if (peakIdx >= 0 && peakIdx < data.length) {
        const x = peakIdx * xScale
        const y = height - padding - (data[peakIdx] - min) * yScale

        ctx.beginPath()
        ctx.arc(x, y, 5, 0, 2 * Math.PI)
        ctx.fill()
      }
    }
  }

  const drawClassifications = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (!ecgData?.rawData || !ecgData.rPeaks || !ecgData.classifications) return

    const data = ecgData.rawData

    // Find min and max for scaling
    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1

    const padding = height * 0.1
    const yScale = (height - 2 * padding) / range
    const xScale = width / data.length

    // Map class to color
    const classColors: Record<string, string> = {
      N: "rgba(34, 197, 94, 0.7)", // Green
      S: "rgba(59, 130, 246, 0.7)", // Blue
      V: "rgba(239, 68, 68, 0.7)", // Red
      F: "rgba(234, 179, 8, 0.7)", // Yellow
      Q: "rgba(168, 85, 247, 0.7)", // Purple
    }

    // Draw classification labels
    ctx.font = "12px Arial"
    ctx.textAlign = "center"

    for (let i = 0; i < ecgData.classifications.length; i++) {
      if (i >= ecgData.rPeaks.length) break

      const peakIdx = ecgData.rPeaks[i]
      const classification = ecgData.classifications[i]

      if (peakIdx >= 0 && peakIdx < data.length) {
        const x = peakIdx * xScale
        const y = height - padding - (data[peakIdx] - min) * yScale - 15 // Position above the peak

        // Draw colored background for the label
        const labelWidth = 20
        const labelHeight = 16
        ctx.fillStyle = classColors[classification.class] || "rgba(107, 114, 128, 0.7)"
        ctx.fillRect(x - labelWidth / 2, y - labelHeight / 2, labelWidth, labelHeight)

        // Draw label text
        ctx.fillStyle = "#ffffff"
        ctx.fillText(classification.class, x, y + 4)
      }
    }
  }

  const drawMetadata = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (!ecgData) return

    ctx.fillStyle = "#000000"
    ctx.font = "12px Arial"
    ctx.textAlign = "left"

    const padding = 10
    let y = padding

    // Draw file name
    ctx.fillText(`File: ${ecgData.fileName}`, padding, y)
    y += 20

    // Draw sampling rate
    ctx.fillText(`Sampling Rate: ${ecgData.samplingRate} Hz`, padding, y)
    y += 20

    // Draw number of data points
    ctx.fillText(`Data Points: ${ecgData.rawData.length}`, padding, y)
    y += 20

    // Draw number of R-peaks if available
    if (ecgData.rPeaks) {
      ctx.fillText(`R-Peaks: ${ecgData.rPeaks.length}`, padding, y)
      y += 20
    }

    // Draw export date
    ctx.fillText(`Exported: ${new Date().toLocaleString()}`, padding, y)
  }

  const generateSVG = (): string => {
    if (!ecgData?.rawData) return ""

    const data = ecgData.rawData

    // Find min and max for scaling
    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1

    const padding = height * 0.1
    const yScale = (height - 2 * padding) / range
    const xScale = width / data.length

    // Start SVG
    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">\n`

    // Add white background
    svg += `  <rect width="${width}" height="${height}" fill="white" />\n`

    // Add grid if enabled
    if (showGrid) {
      // Vertical lines
      const verticalSpacing = width / 40
      for (let x = 0; x <= width; x += verticalSpacing) {
        svg += `  <line x1="${x}" y1="0" x2="${x}" y2="${height}" stroke="rgba(156, 163, 175, 0.2)" strokeWidth="1" />\n`
      }

      // Horizontal lines
      const horizontalSpacing = height / 20
      for (let y = 0; y <= height; y += horizontalSpacing) {
        svg += `  <line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="rgba(156, 163, 175, 0.2)" strokeWidth="1" />\n`
      }

      // Darker lines
      for (let x = 0; x <= width; x += verticalSpacing * 5) {
        svg += `  <line x1="${x}" y1="0" x2="${x}" y2="${height}" stroke="rgba(156, 163, 175, 0.5)" strokeWidth="1" />\n`
      }

      for (let y = 0; y <= height; y += horizontalSpacing * 5) {
        svg += `  <line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="rgba(156, 163, 175, 0.5)" strokeWidth="1" />\n`
      }
    }

    // Add ECG signal
    svg += `  <path d="M`
    for (let i = 0; i < data.length; i++) {
      const x = i * xScale
      const y = height - padding - (data[i] - min) * yScale
      svg += `${i === 0 ? "" : " L"}${x},${y}`
    }
    svg += `" stroke="#2563eb" strokeWidth="2" fill="none" />\n`

    // Add R-peaks if available and enabled
    if (showRPeaks && ecgData.rPeaks && ecgData.rPeaks.length > 0) {
      for (const peakIdx of ecgData.rPeaks) {
        if (peakIdx >= 0 && peakIdx < data.length) {
          const x = peakIdx * xScale
          const y = height - padding - (data[peakIdx] - min) * yScale
          svg += `  <circle cx="${x}" cy="${y}" r="5" fill="rgba(220, 38, 38, 0.7)" />\n`
        }
      }
    }

    // Add classifications if available and enabled
    if (
      showClassifications &&
      ecgData.classifications &&
      ecgData.classifications.length > 0 &&
      ecgData.rPeaks &&
      ecgData.rPeaks.length > 0
    ) {
      // Map class to color
      const classColors: Record<string, string> = {
        N: "rgba(34, 197, 94, 0.7)",
        S: "rgba(59, 130, 246, 0.7)",
        V: "rgba(239, 68, 68, 0.7)",
        F: "rgba(234, 179, 8, 0.7)",
        Q: "rgba(168, 85, 247, 0.7)",
      }

      for (let i = 0; i < ecgData.classifications.length; i++) {
        if (i >= ecgData.rPeaks.length) break

        const peakIdx = ecgData.rPeaks[i]
        const classification = ecgData.classifications[i]

        if (peakIdx >= 0 && peakIdx < data.length) {
          const x = peakIdx * xScale
          const y = height - padding - (data[peakIdx] - min) * yScale - 15

          const labelWidth = 20
          const labelHeight = 16

          svg += `  <rect x="${x - labelWidth / 2}" y="${y - labelHeight / 2}" width="${labelWidth}" height="${labelHeight}" fill="${
            classColors[classification.class] || "rgba(107, 114, 128, 0.7)"
          }" />\n`

          svg += `  <text x="${x}" y="${y + 4}" fontFamily="Arial" fontSize="12" fill="white" textAnchor="middle">${classification.class}</text>\n`
        }
      }
    }

    // Add metadata
    let metaY = 20
    svg += `  <text x="10" y="${metaY}" fontFamily="Arial" fontSize="12" fill="black">File: ${ecgData.fileName}</text>\n`
    metaY += 20
    svg += `  <text x="10" y="${metaY}" fontFamily="Arial" fontSize="12" fill="black">Sampling Rate: ${ecgData.samplingRate} Hz</text>\n`
    metaY += 20
    svg += `  <text x="10" y="${metaY}" fontFamily="Arial" fontSize="12" fill="black">Data Points: ${ecgData.rawData.length}</text>\n`

    if (ecgData.rPeaks) {
      metaY += 20
      svg += `  <text x="10" y="${metaY}" fontFamily="Arial" fontSize="12" fill="black">R-Peaks: ${ecgData.rPeaks.length}</text>\n`
    }

    metaY += 20
    svg += `  <text x="10" y="${metaY}" fontFamily="Arial" fontSize="12" fill="black">Exported: ${new Date().toLocaleString()}</text>\n`

    // End SVG
    svg += `</svg>`

    return svg
  }

  const downloadFile = (url: string, filename: string) => {
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (!ecgData?.rawData || ecgData.rawData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>ECG Export</CardTitle>
          <CardDescription>Export ECG visualizations as images</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No ECG data available to export</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>ECG Export</CardTitle>
        <CardDescription>Export ECG visualizations as images or vector graphics</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="export-format">Export Format</Label>
            <Select value={exportFormat} onValueChange={(value) => setExportFormat(value as any)}>
              <SelectTrigger id="export-format">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="png">PNG Image</SelectItem>
                <SelectItem value="svg">SVG Vector</SelectItem>
                <SelectItem value="pdf">PDF Document</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Options</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="show-grid" checked={showGrid} onCheckedChange={(checked) => setShowGrid(!!checked)} />
                <Label htmlFor="show-grid" className="cursor-pointer">
                  Show grid
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-rpeaks"
                  checked={showRPeaks}
                  onCheckedChange={(checked) => setShowRPeaks(!!checked)}
                  disabled={!ecgData.rPeaks || ecgData.rPeaks.length === 0}
                />
                <Label htmlFor="show-rpeaks" className="cursor-pointer">
                  Show R-peaks
                  {(!ecgData.rPeaks || ecgData.rPeaks.length === 0) && " (none detected)"}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-classifications"
                  checked={showClassifications}
                  onCheckedChange={(checked) => setShowClassifications(!!checked)}
                  disabled={!ecgData.classifications || ecgData.classifications.length === 0}
                />
                <Label htmlFor="show-classifications" className="cursor-pointer">
                  Show classifications
                  {(!ecgData.classifications || ecgData.classifications.length === 0) && " (none available)"}
                </Label>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="export-width">Width (px)</Label>
            <Input
              id="export-width"
              type="number"
              value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
              min="400"
              max="3000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="export-height">Height (px)</Label>
            <Input
              id="export-height"
              type="number"
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
              min="200"
              max="2000"
            />
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <div className="bg-muted/50 p-2 text-center text-sm text-muted-foreground">
            Preview (actual export will be {width} x {height}px)
          </div>
          <canvas ref={canvasRef} width="800" height="400" className="w-full h-auto" />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={generateExport} disabled={isGenerating} className="w-full">
          {isGenerating ? "Generating..." : "Export ECG"}
          {!isGenerating && <Download className="ml-2 h-4 w-4" />}
        </Button>
      </CardFooter>
    </Card>
  )
}
