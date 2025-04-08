"use client"

import { useState } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, FileUp, Upload } from "lucide-react"
import { useECGData } from "@/context/ecg-data-context"
import { useRouter } from "next/navigation"

export function FileUpload() {
  const [samplingRate, setSamplingRate] = useState("250")
  const [fileFormat, setFileFormat] = useState("csv")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { setECGData } = useECGData()

  const router = useRouter()

  // Update the onDrop function to handle the transition better
  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    setIsLoading(true)
    setError(null)

    try {
      const file = acceptedFiles[0]
      const text = await file.text()

      console.log("File content (first 200 chars):", text.substring(0, 200))

      // Parse the file based on content
      const parsedData = parseECGFile(text)

      if (parsedData.length === 0) {
        throw new Error("No valid data could be extracted from the file")
      }

      console.log(`Successfully parsed ${parsedData.length} data points`)

      // Set the ECG data in the context
      await setECGData({
        rawData: parsedData,
        samplingRate: Number.parseInt(samplingRate),
        fileName: file.name,
        rPeaks: [],
        segments: [],
        classifications: [],
      })

      // Navigate with loading state handled by the parent component
      window.location.href = "/?tab=visualization"
    } catch (err) {
      console.error("File processing error:", err)
      setError(`Failed to process file: ${err instanceof Error ? err.message : "Unknown error"}`)
      setIsLoading(false)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "text/plain": [".txt"],
      "application/vnd.ms-excel": [".csv"],
      "text/tab-separated-values": [".tsv"],
    },
    maxFiles: 1,
  })

  const parseECGFile = (fileContent: string): number[] => {
    // Split the content into lines
    const lines = fileContent.trim().split(/\r?\n/)
    console.log(`File has ${lines.length} lines`)

    if (lines.length <= 1) {
      throw new Error("File contains insufficient data")
    }

    // Check the first line to determine the delimiter and if there's a header
    const firstLine = lines[0].trim()
    console.log("First line:", firstLine)

    // Determine delimiter: tab, comma, or space
    let delimiter = "\t"
    if (firstLine.includes(",")) {
      delimiter = ","
    } else if (!firstLine.includes("\t") && firstLine.includes(" ")) {
      delimiter = " "
    }
    console.log(`Detected delimiter: "${delimiter === "\t" ? "tab" : delimiter}"`)

    // Check if there's a header by looking for text in the first line
    const hasHeader = /[a-zA-Z]/.test(firstLine)
    console.log(`Has header: ${hasHeader}`)

    // Find the amplitude column index
    let amplitudeColumnIndex = 2 // Default to the third column (0-indexed)

    if (hasHeader) {
      const headers = firstLine.toLowerCase().split(delimiter)
      console.log("Headers:", headers)

      const ampIndex = headers.findIndex((h) => h.includes("amplitude"))
      if (ampIndex !== -1) {
        amplitudeColumnIndex = ampIndex
        console.log(`Found amplitude column at index ${amplitudeColumnIndex}`)
      }

      // Check for sampling rate in the header row
      const sampRateIndex = headers.findIndex((h) => h.includes("samprate") || h.includes("samp") || h.includes("rate"))
      if (sampRateIndex !== -1) {
        // Look for sampling rate in the first data row
        const firstDataRow = lines[1].trim().split(delimiter)
        if (firstDataRow[sampRateIndex] && !isNaN(Number(firstDataRow[sampRateIndex]))) {
          const detectedRate = Number(firstDataRow[sampRateIndex])
          console.log(`Found sampling rate in file: ${detectedRate}`)
          setSamplingRate(detectedRate.toString())
        }
      }
    }

    // Parse data
    const data: number[] = []
    const startLine = hasHeader ? 1 : 0

    for (let i = startLine; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      // Handle multiple consecutive delimiters (especially for space delimiter)
      const columns = delimiter === " " ? line.split(/\s+/) : line.split(delimiter)

      if (columns.length > amplitudeColumnIndex) {
        const valueStr = columns[amplitudeColumnIndex].trim()
        const value = Number.parseFloat(valueStr)

        if (!isNaN(value)) {
          data.push(value)
        } else {
          console.warn(`Invalid amplitude value at line ${i + 1}: "${valueStr}"`)
        }
      } else {
        console.warn(`Line ${i + 1} has insufficient columns: ${columns.length} (need index ${amplitudeColumnIndex})`)
      }
    }

    console.log(`Extracted ${data.length} amplitude values`)
    return data
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload ECG Data</CardTitle>
        <CardDescription>Upload CSV, TSV, or TXT files containing ECG signal data</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="sampling-rate">Sampling Rate (Hz)</Label>
            <Input
              id="sampling-rate"
              type="number"
              value={samplingRate}
              onChange={(e) => setSamplingRate(e.target.value)}
              min="100"
              max="1000"
            />
          </div>
        </div>

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
            isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
          }`}
        >
          <input {...getInputProps()} />
          <FileUp className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
          {isDragActive ? (
            <p>Drop the file here...</p>
          ) : (
            <div className="space-y-2">
              <p>Drag and drop your ECG file here, or click to select</p>
              <p className="text-sm text-muted-foreground">
                Supports CSV, TSV, and TXT formats with tab, comma, or space delimiters
              </p>
            </div>
          )}
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
        <Button
          disabled={isLoading}
          className="w-full"
          onClick={() => {
            const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
            if (fileInput && fileInput.files && fileInput.files.length > 0) {
              onDrop([fileInput.files[0]])
            } else if (!isLoading) {
              setError("Please select a file first")
            }
          }}
        >
          {isLoading ? "Processing and Loading..." : "Upload and Process"}
          {!isLoading && <Upload className="ml-2 h-4 w-4" />}
        </Button>
      </CardFooter>
    </Card>
  )
}
