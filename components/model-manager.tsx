"use client"

import { useState } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, FileUp, Trash2 } from "lucide-react"
import { useModel } from "@/context/model-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function ModelManager() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [modelName, setModelName] = useState("")
  const [modelType, setModelType] = useState("onnx")
  const [modelDescription, setModelDescription] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { models, addModel, deleteModel, setActiveModel, activeModelId } = useModel()

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    setIsLoading(true)
    setError(null)

    try {
      const file = acceptedFiles[0]

      // Check file extension
      const extension = file.name.split(".").pop()?.toLowerCase()

      if (modelType === "onnx" && extension !== "onnx") {
        throw new Error("Selected file is not an ONNX model")
      }

      if (modelType === "pytorch" && !["pt", "pth"].includes(extension || "")) {
        throw new Error("Selected file is not a PyTorch model")
      }

      // Read file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer()

      // In a real implementation, we would validate the model here
      // For PyTorch models, we would convert to ONNX

      // Add model to IndexedDB (simplified)
      const modelId = await addModel({
        name: modelName || file.name,
        description: modelDescription,
        type: modelType,
        originalType: modelType,
        data: arrayBuffer,
        dateAdded: new Date().toISOString(),
      })

      setIsLoading(false)
      setIsDialogOpen(false)

      // Reset form
      setModelName("")
      setModelDescription("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload model")
      setIsLoading(false)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/octet-stream": [".onnx", ".pt", ".pth"],
    },
    maxFiles: 1,
    disabled: isLoading,
  })

  const handleDeleteModel = async (id: string) => {
    try {
      await deleteModel(id)
    } catch (err) {
      setError("Failed to delete model")
    }
  }

  const handleSetActiveModel = (id: string) => {
    setActiveModel(id)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Model Management</CardTitle>
          <CardDescription>Upload, manage, and select models for arrhythmia classification</CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>Upload New Model</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Model</DialogTitle>
                <DialogDescription>Upload ONNX or PyTorch models for arrhythmia classification</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="model-name">Model Name</Label>
                  <Input
                    id="model-name"
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    placeholder="Enter model name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model-type">Model Type</Label>
                  <Select value={modelType} onValueChange={setModelType}>
                    <SelectTrigger id="model-type">
                      <SelectValue placeholder="Select model type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="onnx">ONNX</SelectItem>
                      <SelectItem value="pytorch">PyTorch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model-description">Description (Optional)</Label>
                  <Input
                    id="model-description"
                    value={modelDescription}
                    onChange={(e) => setModelDescription(e.target.value)}
                    placeholder="Enter model description"
                  />
                </div>

                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
                  }`}
                >
                  <input {...getInputProps()} />
                  <FileUp className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  {isDragActive ? (
                    <p>Drop the model file here...</p>
                  ) : (
                    <div className="space-y-1">
                      <p>Drag and drop your model file here, or click to select</p>
                      <p className="text-xs text-muted-foreground">
                        Supports ONNX (.onnx) and PyTorch (.pt, .pth) formats
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
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  disabled={isLoading}
                  onClick={() => {
                    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
                    if (fileInput && fileInput.files && fileInput.files.length > 0) {
                      onDrop([fileInput.files[0]])
                    } else {
                      setError("Please select a file")
                    }
                  }}
                >
                  {isLoading ? "Uploading..." : "Upload"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {models.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No models available. Upload a model to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date Added</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {models.map((model) => (
                  <TableRow key={model.id} className={activeModelId === model.id ? "bg-muted/50" : ""}>
                    <TableCell className="font-medium">{model.name}</TableCell>
                    <TableCell>{model.type.toUpperCase()}</TableCell>
                    <TableCell>{new Date(model.dateAdded).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant={activeModelId === model.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleSetActiveModel(model.id)}
                        >
                          {activeModelId === model.id ? "Active" : "Use"}
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => handleDeleteModel(model.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
