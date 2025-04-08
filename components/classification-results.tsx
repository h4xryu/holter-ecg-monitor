"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Download, Play } from "lucide-react"
import { useECGData } from "@/context/ecg-data-context"
import { useModel } from "@/context/model-context"
import { classifySegments } from "@/lib/classification"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrhythmiaInfo } from "@/components/arrhythmia-info"

export function ClassificationResults() {
  const [error, setError] = useState<string | null>(null)
  const [isClassifying, setIsClassifying] = useState(false)
  const { ecgData, setECGData } = useECGData()
  const { activeModel } = useModel()

  const handleClassify = async () => {
    if (!ecgData?.segments || ecgData.segments.length === 0) {
      setError("No segments available. Please extract segments first.")
      return
    }

    if (!activeModel) {
      setError("No model selected. Please select a model first.")
      return
    }

    setError(null)
    setIsClassifying(true)

    try {
      // Classify segments using the selected model
      const classifications = await classifySegments(ecgData.segments, activeModel)

      // Update ECG data with classifications
      setECGData({
        ...ecgData,
        classifications,
      })

      setIsClassifying(false)
    } catch (err) {
      setError("Failed to classify segments. Please check your model and try again.")
      setIsClassifying(false)
    }
  }

  const handleExportResults = () => {
    if (!ecgData?.classifications || ecgData.classifications.length === 0) {
      setError("No classification results available to export.")
      return
    }

    try {
      // Create export data
      const exportData = {
        fileName: ecgData.fileName,
        samplingRate: ecgData.samplingRate,
        modelName: activeModel?.name,
        modelType: activeModel?.type,
        results: ecgData.classifications.map((classification, index) => ({
          segmentIndex: index,
          rPeakPosition: ecgData.rPeaks?.[index] || 0,
          class: classification.class,
          confidence: classification.confidence,
          scores: classification.scores,
        })),
      }

      // Convert to JSON and create download link
      const dataStr = JSON.stringify(exportData, null, 2)
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`

      const exportFileName = `${ecgData.fileName.split(".")[0]}_results.json`

      const linkElement = document.createElement("a")
      linkElement.setAttribute("href", dataUri)
      linkElement.setAttribute("download", exportFileName)
      linkElement.click()
    } catch (err) {
      setError("Failed to export results.")
    }
  }

  const getClassColor = (className: string) => {
    switch (className) {
      case "N":
        return "bg-green-100 text-green-800"
      case "S":
        return "bg-blue-100 text-blue-800"
      case "V":
        return "bg-red-100 text-red-800"
      case "F":
        return "bg-yellow-100 text-yellow-800"
      case "Q":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getClassLabel = (className: string) => {
    switch (className) {
      case "N":
        return "Normal"
      case "S":
        return "Supraventricular"
      case "V":
        return "Ventricular"
      case "F":
        return "Fusion"
      case "Q":
        return "Unknown"
      default:
        return className
    }
  }

  if (!ecgData?.rawData || ecgData.rawData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Classification Results</CardTitle>
          <CardDescription>Classify ECG segments and view results</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No ECG data available. Please upload a file first.</p>
        </CardContent>
      </Card>
    )
  }

  if (!ecgData.segments || ecgData.segments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Classification Results</CardTitle>
          <CardDescription>Classify ECG segments and view results</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No segments available. Please extract segments first.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Classification Results</CardTitle>
          <CardDescription>
            {ecgData.fileName} - {ecgData.segments.length} segments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!ecgData.classifications || ecgData.classifications.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                No classification results available. Classify segments to view results.
              </p>
              <Button onClick={handleClassify} disabled={isClassifying || !activeModel}>
                {isClassifying ? (
                  <>
                    <span className="mr-2">Classifying...</span>
                    <Progress value={45} className="w-20" />
                  </>
                ) : (
                  <>
                    Classify Segments
                    <Play className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
              {!activeModel && (
                <p className="text-sm text-muted-foreground mt-2">Please select a model in the Models tab first.</p>
              )}
            </div>
          ) : (
            <Tabs defaultValue="table">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="table">Table View</TabsTrigger>
                <TabsTrigger value="summary">Summary</TabsTrigger>
              </TabsList>

              <TabsContent value="table" className="pt-4">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Segment</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Confidence</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ecgData.classifications.map((classification, index) => (
                        <TableRow key={index}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{ecgData.rPeaks?.[index] || "N/A"}</TableCell>
                          <TableCell>
                            <Badge className={getClassColor(classification.class)}>
                              {classification.class} - {getClassLabel(classification.class)}
                            </Badge>
                          </TableCell>
                          <TableCell>{(classification.confidence * 100).toFixed(2)}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="summary" className="pt-4">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {["N", "S", "V", "F", "Q"].map((classType) => {
                      const count = ecgData.classifications?.filter((c) => c.class === classType).length || 0

                      const percentage = ecgData.classifications ? (count / ecgData.classifications.length) * 100 : 0

                      return (
                        <Card key={classType}>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg">
                              <Badge className={getClassColor(classType)}>{classType}</Badge>
                            </CardTitle>
                            <CardDescription>{getClassLabel(classType)}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{count}</div>
                            <Progress value={percentage} className="h-2 mt-2" />
                            <div className="text-xs text-muted-foreground mt-1">{percentage.toFixed(1)}% of beats</div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>

                  <ArrhythmiaInfo />
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
        {ecgData.classifications && ecgData.classifications.length > 0 && (
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handleClassify} disabled={isClassifying}>
              Reclassify
            </Button>
            <Button onClick={handleExportResults} disabled={isClassifying}>
              Export Results
              <Download className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        )}
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
