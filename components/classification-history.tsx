"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Download, Trash2 } from "lucide-react"

interface ClassificationResult {
  id: string
  fileName: string
  modelName: string
  date: string
  totalBeats: number
  classes: {
    N: number
    S: number
    V: number
    F: number
    Q: number
  }
}

export function ClassificationHistory() {
  const [history, setHistory] = useState<ClassificationResult[]>([])
  const [selectedResults, setSelectedResults] = useState<string[]>([])
  const [comparisonMode, setComparisonMode] = useState<"absolute" | "percentage">("percentage")

  // Load history from localStorage on mount
  useEffect(() => {
    const storedHistory = localStorage.getItem("ecg-classification-history")
    if (storedHistory) {
      try {
        setHistory(JSON.parse(storedHistory))
      } catch (err) {
        console.error("Failed to parse classification history:", err)
      }
    }
  }, [])

  const toggleResultSelection = (id: string) => {
    setSelectedResults((prev) => (prev.includes(id) ? prev.filter((resultId) => resultId !== id) : [...prev, id]))
  }

  const deleteResult = (id: string) => {
    setHistory((prev) => {
      const updated = prev.filter((result) => result.id !== id)
      localStorage.setItem("ecg-classification-history", JSON.stringify(updated))
      return updated
    })

    setSelectedResults((prev) => prev.filter((resultId) => resultId !== id))
  }

  const exportResults = (id: string) => {
    const result = history.find((r) => r.id === id)
    if (!result) return

    const dataStr = JSON.stringify(result, null, 2)
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`
    const exportFileName = `${result.fileName.split(".")[0]}_classification.json`

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileName)
    linkElement.click()
  }

  const getComparisonData = () => {
    if (selectedResults.length === 0) return []

    const selectedData = history.filter((result) => selectedResults.includes(result.id))

    if (comparisonMode === "absolute") {
      return [
        { name: "N", ...Object.fromEntries(selectedData.map((d) => [d.fileName, d.classes.N])) },
        { name: "S", ...Object.fromEntries(selectedData.map((d) => [d.fileName, d.classes.S])) },
        { name: "V", ...Object.fromEntries(selectedData.map((d) => [d.fileName, d.classes.V])) },
        { name: "F", ...Object.fromEntries(selectedData.map((d) => [d.fileName, d.classes.F])) },
        { name: "Q", ...Object.fromEntries(selectedData.map((d) => [d.fileName, d.classes.Q])) },
      ]
    } else {
      return [
        {
          name: "N",
          ...Object.fromEntries(selectedData.map((d) => [d.fileName, (d.classes.N / d.totalBeats) * 100])),
        },
        {
          name: "S",
          ...Object.fromEntries(selectedData.map((d) => [d.fileName, (d.classes.S / d.totalBeats) * 100])),
        },
        {
          name: "V",
          ...Object.fromEntries(selectedData.map((d) => [d.fileName, (d.classes.V / d.totalBeats) * 100])),
        },
        {
          name: "F",
          ...Object.fromEntries(selectedData.map((d) => [d.fileName, (d.classes.F / d.totalBeats) * 100])),
        },
        {
          name: "Q",
          ...Object.fromEntries(selectedData.map((d) => [d.fileName, (d.classes.Q / d.totalBeats) * 100])),
        },
      ]
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Classification History</CardTitle>
        <CardDescription>View and compare previous classification results</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="history">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="comparison" disabled={selectedResults.length < 2}>
              Comparison
            </TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="pt-4">
            {history.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No classification history available.</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <span className="sr-only">Select</span>
                      </TableHead>
                      <TableHead>File</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Results</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((result) => (
                      <TableRow key={result.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedResults.includes(result.id)}
                            onChange={() => toggleResultSelection(result.id)}
                            className="rounded border-gray-300"
                          />
                        </TableCell>
                        <TableCell className="font-medium">{result.fileName}</TableCell>
                        <TableCell>{result.modelName}</TableCell>
                        <TableCell>{new Date(result.date).toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            <Badge className={getClassColor("N")}>N: {result.classes.N}</Badge>
                            <Badge className={getClassColor("S")}>S: {result.classes.S}</Badge>
                            <Badge className={getClassColor("V")}>V: {result.classes.V}</Badge>
                            <Badge className={getClassColor("F")}>F: {result.classes.F}</Badge>
                            <Badge className={getClassColor("Q")}>Q: {result.classes.Q}</Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => exportResults(result.id)}
                              title="Export"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => deleteResult(result.id)}
                              title="Delete"
                            >
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
          </TabsContent>

          <TabsContent value="comparison" className="pt-4">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Comparing {selectedResults.length} results</h3>
                <Select value={comparisonMode} onValueChange={(v) => setComparisonMode(v as any)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="View mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="absolute">Absolute Count</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getComparisonData()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis
                      label={
                        comparisonMode === "percentage"
                          ? { value: "Percentage (%)", angle: -90, position: "insideLeft" }
                          : { value: "Count", angle: -90, position: "insideLeft" }
                      }
                    />
                    <Tooltip />
                    <Legend />
                    {selectedResults.map((id) => {
                      const result = history.find((r) => r.id === id)
                      if (!result) return null
                      return (
                        <Bar
                          key={id}
                          dataKey={result.fileName}
                          name={`${result.fileName} (${result.modelName})`}
                          fill={`#${Math.floor(Math.random() * 16777215).toString(16)}`}
                        />
                      )
                    })}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
