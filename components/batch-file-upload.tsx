"use client"

import { useState } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { FileUp, X } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useECGData } from "@/context/ecg-data-context"
import { detectRPeaks } from "@/lib/r-peak-detection"
import { extractSegments } from "@/lib/segment-extraction"
import { useModel } from "@/context/model-context"
import { classifySegments } from "@/lib/classification"

interface BatchFile {
  id: string
  file: File
  status: "pending" | "processing" | "success" | "error"
  progress: number
  error?: string
  data?: number[]
  rPeaks?: number[]
  segments?: any[]
  classifications?: any[]
}

export function BatchFileUpload() {
  const [files, setFiles] = useState<BatchFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [samplingRate, setSamplingRate] = useState(250)
  const { setECGData } = useECGData()
  const { activeModel } = useModel()

  const onDrop = (acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map((file) => ({
      id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      status: "pending" as const,
      progress: 0,
    }))

    setFiles((prev) => [...prev, ...newFiles])
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "text/plain": [".txt"],
      "application/vnd.ms-excel": [".csv"],
      "text/tab-separated-values": [".tsv"],
    },
    multiple: true,
  })

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== id))
  }

  const parseFile = async (fileContent: string): Promise<number[]> => {
    // Split the content into lines
    const lines = fileContent.trim().split(/\r?\n/)

    // Check the first line to determine the delimiter and if there's a header
    const firstLine = lines[0].trim()

    // Determine delimiter: tab, comma, or space
    let delimiter = "\t"
    if (firstLine.includes(",")) {
      delimiter = ","
    } else if (!firstLine.includes("\t") && firstLine.includes(" ")) {
      delimiter = " "
    }

    // Check if there's a header by looking for text in the first line
    const hasHeader = /[a-zA-Z]/.test(firstLine)

    // Find the amplitude column index
    let amplitudeColumnIndex = 2 // Default to the third column (0-indexed)

    if (hasHeader) {
      const headers = firstLine.toLowerCase().split(delimiter)
      const ampIndex = headers.findIndex((h) => h.includes("amplitude"))
      if (ampIndex !== -1) {
        amplitudeColumnIndex = ampIndex
      }
    }

    // Parse data
    const data: number[] = []
    const startLine = hasHeader ? 1 : 0

    for (let i = startLine; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      // Handle multiple consecutive delimiters
      const columns = delimiter === " " ? line.split(/\s+/) : line.split(delimiter)

      if (columns.length > amplitudeColumnIndex) {
        const valueStr = columns[amplitudeColumnIndex].trim()
        const value = Number.parseFloat(valueStr)

        if (!isNaN(value)) {
          data.push(value)
        }
      }
    }

    return data
  }

  const processFiles = async () => {
    if (files.length === 0 || isProcessing) return

    setIsProcessing(true)

    // Process files sequentially
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file.status !== "pending") continue

      // Update status to processing
      setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, status: "processing", progress: 10 } : f)))

      try {
        // Read file content
        const text = await file.file.text()
        setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, progress: 30 } : f)))

        // Parse file
        const data = await parseFile(text)
        setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, data, progress: 50 } : f)))

        // Detect R-peaks
        const rPeaks = detectRPeaks(data, samplingRate)
        setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, rPeaks, progress: 70 } : f)))

        // Extract segments
        const segments = extractSegments(data, rPeaks, 360)
        setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, segments, progress: 90 } : f)))

        // Classify segments if model is available
        if (activeModel) {
          const classifications = await classifySegments(segments, activeModel)
          setFiles((prev) =>
            prev.map((f) => (f.id === file.id ? { ...f, classifications, progress: 100, status: "success" } : f)),
          )
        } else {
          setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, progress: 100, status: "success" } : f)))
        }
      } catch (err) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === file.id
              ? { ...f, status: "error", error: err instanceof Error ? err.message : "Unknown error" }
              : f,
          ),
        )
      }
    }

    setIsProcessing(false)
  }

  const viewResults = (file: BatchFile) => {
    if (!file.data) return

    // Set the selected file data to the ECG data context
    setECGData({
      rawData: file.data,
      samplingRate,
      fileName: file.file.name,
      rPeaks: file.rPeaks || [],
      segments: file.segments || [],
      classifications: file.classifications || [],
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Batch ECG Processing</CardTitle>
        <CardDescription>Upload and process multiple ECG files simultaneously</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
            isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
          }`}
        >
          <input {...getInputProps()} />
          <FileUp className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
          {isDragActive ? (
            <p>Drop the files here...</p>
          ) : (
            <div className="space-y-2">
              <p>Drag and drop multiple ECG files here, or click to select</p>
              <p className="text-sm text-muted-foreground">
                Supports CSV, TSV, and TXT formats with tab, comma, or space delimiters
              </p>
            </div>
          )}
        </div>

        {files.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Files ({files.length})</h3>
            <div className="space-y-2">
              {files.map((file) => (
                <div key={file.id} className="flex items-center p-2 border rounded-md">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center">
                      <p className="text-sm font-medium truncate mr-2">{file.file.name}</p>
                      <Badge
                        variant={
                          file.status === "success" ? "default" : file.status === "error" ? "destructive" : "outline"
                        }
                        className="ml-auto"
                      >
                        {file.status === "pending"
                          ? "Pending"
                          : file.status === "processing"
                            ? "Processing"
                            : file.status === "success"
                              ? "Complete"
                              : "Error"}
                      </Badge>
                    </div>
                    <Progress value={file.progress} className="h-1 mt-1" />
                    {file.error && <p className="text-xs text-destructive mt-1">{file.error}</p>}
                  </div>
                  <div className="flex items-center ml-4 space-x-2">
                    {file.status === "success" && (
                      <Button size="sm" variant="outline" onClick={() => viewResults(file)}>
                        View Results
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => removeFile(file.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => setFiles([])}>
          Clear All
        </Button>
        <Button onClick={processFiles} disabled={isProcessing || files.length === 0}>
          {isProcessing ? "Processing..." : "Process All Files"}
        </Button>
      </CardFooter>
    </Card>
  )
}
