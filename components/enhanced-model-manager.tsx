"use client"

import { useState } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, FileUp, Trash2, Info, Star, StarOff } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Enhanced model interface with versioning and metadata
interface EnhancedModel {
  id: string
  name: string
  version: string
  description: string
  type: string
  originalType: string
  data: ArrayBuffer
  dateAdded: string
  isFavorite: boolean
  metadata: {
    architecture?: string
    trainingDataset?: string
    accuracy?: number
    sensitivity?: number
    specificity?: number
    f1Score?: number
    trainedBy?: string
    trainedDate?: string
    notes?: string
  }
}

export function EnhancedModelManager() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [modelName, setModelName] = useState("")
  const [modelVersion, setModelVersion] = useState("1.0.0")
  const [modelType, setModelType] = useState("onnx")
  const [modelDescription, setModelDescription] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  // Model metadata
  const [architecture, setArchitecture] = useState("")
  const [trainingDataset, setTrainingDataset] = useState("")
  const [accuracy, setAccuracy] = useState<number | undefined>()
  const [sensitivity, setSensitivity] = useState<number | undefined>()
  const [specificity, setSpecificity] = useState<number | undefined>()
  const [f1Score, setF1Score] = useState<number | undefined>()
  const [trainedBy, setTrainedBy] = useState("")
  const [trainedDate, setTrainedDate] = useState("")
  const [notes, setNotes] = useState("")

  // Mock for the enhanced model context
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

      // Add model to IndexedDB with enhanced metadata
      const modelId = await addModel({
        name: modelName || file.name,
        version: modelVersion,
        description: modelDescription,
        type: modelType,
        originalType: modelType,
        data: arrayBuffer,
        dateAdded: new Date().toISOString(),
        isFavorite: false,
        metadata: {
          architecture,
          trainingDataset,
          accuracy,
          sensitivity,
          specificity,
          f1Score,
          trainedBy,
          trainedDate,
          notes,
        },
      })

      setIsLoading(false)
      setIsDialogOpen(false)

      // Reset form
      setModelName("")
      setModelVersion("1.0.0")
      setModelDescription("")
      setArchitecture("")
      setTrainingDataset("")
      setAccuracy(undefined)
      setSensitivity(undefined)
      setSpecificity(undefined)
      setF1Score(undefined)
      setTrainedBy("")
      setTrainedDate("")
      setNotes("")
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

  const toggleFavorite = (id: string) => {
    // In a real implementation, this would update the model in IndexedDB
    console.log(`Toggle favorite for model ${id}`)
  }

  const filteredModels = models
    .filter((model) => {
      if (activeTab === "favorites" && !model.isFavorite) return false
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        return (
          model.name.toLowerCase().includes(searchLower) ||
          model.description.toLowerCase().includes(searchLower) ||
          model.version.toLowerCase().includes(searchLower)
        )
      }
      return true
    })
    .sort((a, b) => {
      // Sort by favorite status first, then by date
      if (a.isFavorite && !b.isFavorite) return -1
      if (!a.isFavorite && b.isFavorite) return 1
      return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
    })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Enhanced Model Management</CardTitle>
              <CardDescription>Upload, manage, and select models with versioning and metadata</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>Upload New Model</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Upload Model</DialogTitle>
                  <DialogDescription>Upload ONNX or PyTorch models with detailed metadata</DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="basic">Basic Info</TabsTrigger>
                    <TabsTrigger value="metadata">Metadata</TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
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
                        <Label htmlFor="model-version">Version</Label>
                        <Input
                          id="model-version"
                          value={modelVersion}
                          onChange={(e) => setModelVersion(e.target.value)}
                          placeholder="1.0.0"
                        />
                      </div>
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
                      <Label htmlFor="model-description">Description</Label>
                      <Textarea
                        id="model-description"
                        value={modelDescription}
                        onChange={(e) => setModelDescription(e.target.value)}
                        placeholder="Enter model description"
                        rows={3}
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
                  </TabsContent>

                  <TabsContent value="metadata" className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="architecture">Architecture</Label>
                        <Input
                          id="architecture"
                          value={architecture}
                          onChange={(e) => setArchitecture(e.target.value)}
                          placeholder="e.g., DSResUDenseNeXt"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="training-dataset">Training Dataset</Label>
                        <Input
                          id="training-dataset"
                          value={trainingDataset}
                          onChange={(e) => setTrainingDataset(e.target.value)}
                          placeholder="e.g., MIT-BIH, INCART"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="accuracy">Accuracy (%)</Label>
                        <Input
                          id="accuracy"
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={accuracy?.toString() || ""}
                          onChange={(e) => setAccuracy(e.target.value ? Number(e.target.value) : undefined)}
                          placeholder="e.g., 98.5"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="f1-score">F1 Score</Label>
                        <Input
                          id="f1-score"
                          type="number"
                          min="0"
                          max="1"
                          step="0.01"
                          value={f1Score?.toString() || ""}
                          onChange={(e) => setF1Score(e.target.value ? Number(e.target.value) : undefined)}
                          placeholder="e.g., 0.95"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="sensitivity">Sensitivity</Label>
                        <Input
                          id="sensitivity"
                          type="number"
                          min="0"
                          max="1"
                          step="0.01"
                          value={sensitivity?.toString() || ""}
                          onChange={(e) => setSensitivity(e.target.value ? Number(e.target.value) : undefined)}
                          placeholder="e.g., 0.92"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="specificity">Specificity</Label>
                        <Input
                          id="specificity"
                          type="number"
                          min="0"
                          max="1"
                          step="0.01"
                          value={specificity?.toString() || ""}
                          onChange={(e) => setSpecificity(e.target.value ? Number(e.target.value) : undefined)}
                          placeholder="e.g., 0.97"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="trained-by">Trained By</Label>
                        <Input
                          id="trained-by"
                          value={trainedBy}
                          onChange={(e) => setTrainedBy(e.target.value)}
                          placeholder="e.g., John Doe"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="trained-date">Training Date</Label>
                        <Input
                          id="trained-date"
                          type="date"
                          value={trainedDate}
                          onChange={(e) => setTrainedDate(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Additional Notes</Label>
                      <Textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Enter any additional information about the model"
                        rows={3}
                      />
                    </div>
                  </TabsContent>
                </Tabs>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

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
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <Input
                placeholder="Search models..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
                <TabsList className="grid w-48 grid-cols-2">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="favorites">Favorites</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {filteredModels.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {searchTerm
                    ? "No models match your search criteria."
                    : activeTab === "favorites"
                      ? "No favorite models available."
                      : "No models available. Upload a model to get started."}
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Metrics</TableHead>
                      <TableHead>Date Added</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredModels.map((model) => (
                      <TableRow key={model.id} className={activeModelId === model.id ? "bg-muted/50" : ""}>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleFavorite(model.id)}
                            className="h-8 w-8"
                          >
                            {model.isFavorite ? (
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            ) : (
                              <StarOff className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="font-medium">{model.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{model.version}</Badge>
                        </TableCell>
                        <TableCell>{model.type.toUpperCase()}</TableCell>
                        <TableCell>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8">
                                <Info className="h-4 w-4 mr-1" /> View Metrics
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80">
                              <div className="space-y-2">
                                <h4 className="font-medium">Model Metrics</h4>
                                <div className="grid grid-cols-2 gap-1 text-sm">
                                  {model.metadata.accuracy && (
                                    <>
                                      <div className="text-muted-foreground">Accuracy:</div>
                                      <div>{model.metadata.accuracy}%</div>
                                    </>
                                  )}
                                  {model.metadata.f1Score && (
                                    <>
                                      <div className="text-muted-foreground">F1 Score:</div>
                                      <div>{model.metadata.f1Score}</div>
                                    </>
                                  )}
                                  {model.metadata.sensitivity && (
                                    <>
                                      <div className="text-muted-foreground">Sensitivity:</div>
                                      <div>{model.metadata.sensitivity}</div>
                                    </>
                                  )}
                                  {model.metadata.specificity && (
                                    <>
                                      <div className="text-muted-foreground">Specificity:</div>
                                      <div>{model.metadata.specificity}</div>
                                    </>
                                  )}
                                  {model.metadata.trainingDataset && (
                                    <>
                                      <div className="text-muted-foreground">Dataset:</div>
                                      <div>{model.metadata.trainingDataset}</div>
                                    </>
                                  )}
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </TableCell>
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
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
