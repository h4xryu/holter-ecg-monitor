"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Play, Pause, ZoomIn, ZoomOut, Save, Activity, Heart, AlertTriangle } from "lucide-react"
import ECGChart from "@/components/ecg-chart"
import ECGChartJS from "@/components/ecg-chart-js"
import { generateFakeECGData, simulateAIPrediction } from "@/lib/ecg-utils"

export default function MonitoringPage() {
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [ecgData, setEcgData] = useState<number[]>([])
  const [anomalyData, setAnomalyData] = useState<{ start: number; end: number; type: string }[]>([])

  // Chart.js 데이터
  const [chartJsData, setChartJsData] = useState<
    Array<{
      time: string
      value: number
      abnormal: boolean
    }>
  >([])
  const [predictions, setPredictions] = useState<
    Array<{
      startIndex: number
      endIndex: number
      beatType: string
      confidence: string
    }>
  >([])

  const [visualizationType, setVisualizationType] = useState<"canvas" | "chartjs">("chartjs")

  // 모니터링 시작/중지
  const toggleMonitoring = () => {
    setIsMonitoring(!isMonitoring)
  }

  // 줌 레벨 조정
  const adjustZoom = (direction: "in" | "out") => {
    if (direction === "in" && zoomLevel < 3) {
      setZoomLevel(zoomLevel + 0.5)
    } else if (direction === "out" && zoomLevel > 0.5) {
      setZoomLevel(zoomLevel - 0.5)
    }
  }

  // 가짜 ECG 데이터 생성 및 업데이트 (Canvas 버전)
  useEffect(() => {
    if (!isMonitoring) return

    const interval = setInterval(() => {
      // 새 데이터 생성
      const newDataPoint = Math.sin(Date.now() / 200) * 0.5 + (Math.random() - 0.5) * 0.1

      // 데이터 업데이트 (최대 1000개 포인트 유지)
      setEcgData((prevData) => {
        const updatedData = [...prevData, newDataPoint]
        if (updatedData.length > 1000) {
          return updatedData.slice(-1000)
        }
        return updatedData
      })

      // 최근 데이터에 대한 AI 분석 시뮬레이션
      if (ecgData.length > 0 && ecgData.length % 50 === 0) {
        const rand = Math.random()
        if (rand < 0.1) {
          setAnomalyData((prev) => [
            ...prev,
            {
              start: ecgData.length - 50,
              end: ecgData.length,
              type: rand < 0.05 ? "V" : "S",
            },
          ])
        }
      }
    }, 20) // 50Hz 샘플링 시뮬레이션

    return () => clearInterval(interval)
  }, [isMonitoring, ecgData])

  // Chart.js 데이터 업데이트
  useEffect(() => {
    if (!isMonitoring) return

    const interval = setInterval(() => {
      // 새 데이터 추가
      setChartJsData((prevData) => {
        // 마지막 990개 포인트를 유지하고 새 데이터 10개 추가
        const newData = [...prevData.slice(-990), ...generateFakeECGData(10)]

        // 새 데이터에 대한 예측 추가
        setPredictions((prevPredictions) => {
          const newPrediction = simulateAIPrediction(newData.slice(-60), 50)
          return [...prevPredictions.slice(-20), ...newPrediction]
        })

        return newData
      })
    }, 500)

    return () => clearInterval(interval)
  }, [isMonitoring])

  // 초기 데이터 로드
  useEffect(() => {
    // Canvas 버전 초기 데이터
    const initialData = Array(500)
      .fill(0)
      .map(() => Math.sin(Math.random() * Math.PI * 2) * 0.5 + (Math.random() - 0.5) * 0.1)
    setEcgData(initialData)

    // 초기 데이터에 대한 분석 결과 시뮬레이션
    const anomalies = [
      { start: 100, end: 130, type: "V" }, // V beat
      { start: 300, end: 330, type: "S" }, // S beat
    ]
    setAnomalyData(anomalies)

    // Chart.js 버전 초기 데이터
    const chartJsInitialData = generateFakeECGData(1000)
    setChartJsData(chartJsInitialData)

    // 초기 예측 데이터
    const initialPredictions = simulateAIPrediction(chartJsInitialData)
    setPredictions(initialPredictions)
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">심전도 모니터링</h1>
        <p className="text-muted-foreground">실시간 심전도 데이터를 모니터링하고 AI 분석 결과를 확인하세요.</p>
      </div>

      <div className="grid gap-4 grid-cols-1">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle>실시간 ECG</CardTitle>
              <CardDescription>{isMonitoring ? "실시간 모니터링 중" : "모니터링 중지됨"}</CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="icon" onClick={() => adjustZoom("out")} disabled={zoomLevel <= 0.5}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => adjustZoom("in")} disabled={zoomLevel >= 3}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant={isMonitoring ? "destructive" : "default"} onClick={toggleMonitoring}>
                {isMonitoring ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" /> 중지
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" /> 시작
                  </>
                )}
              </Button>
              <Button variant="outline">
                <Save className="h-4 w-4 mr-2" /> 저장
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="flex space-x-4">
                <Button
                  variant={visualizationType === "canvas" ? "default" : "outline"}
                  onClick={() => setVisualizationType("canvas")}
                >
                  Canvas 시각화
                </Button>
                <Button
                  variant={visualizationType === "chartjs" ? "default" : "outline"}
                  onClick={() => setVisualizationType("chartjs")}
                >
                  Chart.js 시각화
                </Button>
              </div>
            </div>

            <div className="h-[400px]">
              {visualizationType === "canvas" ? (
                <ECGChart data={ecgData} anomalies={anomalyData} zoomLevel={zoomLevel} />
              ) : (
                <ECGChartJS data={chartJsData} predictions={predictions} sliceSize={300} />
              )}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="analysis">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="analysis">AI 분석 결과</TabsTrigger>
            <TabsTrigger value="stats">통계</TabsTrigger>
            <TabsTrigger value="settings">모니터링 설정</TabsTrigger>
          </TabsList>
          <TabsContent value="analysis">
            <Card>
              <CardHeader>
                <CardTitle>AI 분석 결과</CardTitle>
                <CardDescription>AI 모델이 감지한 이상 징후를 확인하세요.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {visualizationType === "canvas" ? (
                    // Canvas 버전 이상 징후 표시
                    anomalyData.length > 0 ? (
                      anomalyData.map((anomaly, index) => (
                        <div key={index} className="flex items-center p-3 border rounded-md">
                          <div
                            className={`w-3 h-3 rounded-full mr-3 ${
                              anomaly.type === "V"
                                ? "bg-blue-500"
                                : anomaly.type === "S"
                                  ? "bg-red-500"
                                  : "bg-amber-500"
                            }`}
                          />
                          <div>
                            <div className="font-medium">
                              {anomaly.type === "V"
                                ? "심실 조기 수축 (VPC)"
                                : anomaly.type === "S"
                                  ? "심방 조기 수축 (APC)"
                                  : "미확인 이상"}
                            </div>
                            <div className="text-sm text-gray-500">
                              구간: {anomaly.start} - {anomaly.end}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-gray-500">감지된 이상 징후가 없습니다.</div>
                    )
                  ) : (
                    // Chart.js 버전 이상 징후 표시
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="border rounded-md p-4 flex flex-col items-center">
                          <div className="flex items-center mb-2">
                            <Heart className="h-5 w-5 text-green-500 mr-2" />
                            <span className="font-medium">정상 (N)</span>
                          </div>
                          <div className="text-2xl font-bold">
                            {predictions.filter((p) => p.beatType === "N").length}
                          </div>
                        </div>

                        <div className="border rounded-md p-4 flex flex-col items-center">
                          <div className="flex items-center mb-2">
                            <Activity className="h-5 w-5 text-blue-500 mr-2" />
                            <span className="font-medium">V Beat</span>
                          </div>
                          <div className="text-2xl font-bold">
                            {predictions.filter((p) => p.beatType === "V").length}
                          </div>
                        </div>

                        <div className="border rounded-md p-4 flex flex-col items-center">
                          <div className="flex items-center mb-2">
                            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                            <span className="font-medium">S Beat</span>
                          </div>
                          <div className="text-2xl font-bold">
                            {predictions.filter((p) => p.beatType === "S").length}
                          </div>
                        </div>
                      </div>

                      <div className="border rounded-md p-4">
                        <h4 className="font-medium mb-3">최근 예측 결과</h4>
                        <div className="max-h-[200px] overflow-y-auto">
                          <table className="min-w-full">
                            <thead>
                              <tr>
                                <th className="border-b px-4 py-2 text-left">시간</th>
                                <th className="border-b px-4 py-2 text-left">유형</th>
                                <th className="border-b px-4 py-2 text-left">신뢰도</th>
                              </tr>
                            </thead>
                            <tbody>
                              {predictions
                                .slice(-10)
                                .reverse()
                                .map((pred, i) => (
                                  <tr key={i}>
                                    <td className="border-b px-4 py-2">{new Date().toLocaleTimeString()}</td>
                                    <td className="border-b px-4 py-2">
                                      <span
                                        className={`px-2 py-1 rounded text-white ${
                                          pred.beatType === "N"
                                            ? "bg-green-500"
                                            : pred.beatType === "V"
                                              ? "bg-blue-500"
                                              : "bg-red-500"
                                        }`}
                                      >
                                        {pred.beatType === "N" ? "정상" : pred.beatType === "V" ? "V Beat" : "S Beat"}
                                      </span>
                                    </td>
                                    <td className="border-b px-4 py-2">
                                      {(Number.parseFloat(pred.confidence) * 100).toFixed(0)}%
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="stats">
            <Card>
              <CardHeader>
                <CardTitle>통계</CardTitle>
                <CardDescription>심전도 데이터의 통계적 정보를 확인하세요.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="border rounded-md p-4">
                    <div className="text-sm font-medium text-gray-500">평균 심박수</div>
                    <div className="text-2xl font-bold">72 BPM</div>
                  </div>
                  <div className="border rounded-md p-4">
                    <div className="text-sm font-medium text-gray-500">심박 변이도 (HRV)</div>
                    <div className="text-2xl font-bold">45 ms</div>
                  </div>
                  <div className="border rounded-md p-4">
                    <div className="text-sm font-medium text-gray-500">QT 간격</div>
                    <div className="text-2xl font-bold">420 ms</div>
                  </div>
                  <div className="border rounded-md p-4">
                    <div className="text-sm font-medium text-gray-500">ST 분절 편차</div>
                    <div className="text-2xl font-bold">0.5 mV</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>모니터링 설정</CardTitle>
                <CardDescription>모니터링 및 분석 설정을 조정하세요.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">샘플링 속도</label>
                      <select className="w-full p-2 border rounded-md" defaultValue="500 Hz">
                        <option>250 Hz</option>
                        <option>500 Hz</option>
                        <option>1000 Hz</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">필터 설정</label>
                      <select className="w-full p-2 border rounded-md" defaultValue="기본 필터">
                        <option>없음</option>
                        <option>기본 필터</option>
                        <option>고급 필터</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">AI 분석 민감도</label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value="7"
                      className="w-full"
                      onChange={(e) => console.log(e.target.value)}
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>낮음</span>
                      <span>중간</span>
                      <span>높음</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">알림 설정</label>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="alert-vbeat"
                          className="mr-2"
                          defaultChecked
                          onChange={(e) => console.log(e.target.checked)}
                        />
                        <label htmlFor="alert-vbeat">심실 조기 수축 (VPC) 감지 시 알림</label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="alert-sbeat"
                          className="mr-2"
                          checked
                          onChange={(e) => console.log(e.target.checked)}
                        />
                        <label htmlFor="alert-sbeat">심방 조기 수축 (APC) 감지 시 알림</label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="alert-other"
                          className="mr-2"
                          checked
                          onChange={(e) => console.log(e.target.checked)}
                        />
                        <label htmlFor="alert-other">기타 이상 감지 시 알림</label>
                      </div>
                    </div>
                  </div>

                  <Button className="w-full">설정 저장</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

