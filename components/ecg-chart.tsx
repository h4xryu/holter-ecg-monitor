"use client"

import { useEffect, useRef } from "react"

interface ECGChartProps {
  data: number[]
  anomalies: { start: number; end: number; type: string }[]
  zoomLevel: number
}

export default function ECGChart({ data, anomalies, zoomLevel }: ECGChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // 캔버스 크기 설정
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()

    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr

    ctx.scale(dpr, dpr)

    // 캔버스 초기화
    ctx.clearRect(0, 0, rect.width, rect.height)

    // 그리드 그리기
    drawGrid(ctx, rect.width, rect.height)

    // 데이터가 없으면 종료
    if (data.length === 0) return

    // ECG 데이터 그리기
    drawECG(ctx, data, rect.width, rect.height, zoomLevel)

    // 이상 징후 하이라이트
    highlightAnomalies(ctx, anomalies, data, rect.width, rect.height, zoomLevel)
  }, [data, anomalies, zoomLevel])

  // 그리드 그리기 함수
  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = "#e5e7eb"
    ctx.lineWidth = 0.5

    // 수직 그리드
    const verticalSpacing = 50
    for (let x = 0; x < width; x += verticalSpacing) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }

    // 수평 그리드
    const horizontalSpacing = 50
    for (let y = 0; y < height; y += horizontalSpacing) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }
  }

  // ECG 데이터 그리기 함수
  const drawECG = (ctx: CanvasRenderingContext2D, data: number[], width: number, height: number, zoomLevel: number) => {
    const centerY = height / 2
    const amplitude = (height / 4) * zoomLevel

    // 데이터 포인트 간 간격 계산
    const pointSpacing = width / (data.length - 1)

    ctx.strokeStyle = "#000000"
    ctx.lineWidth = 1.5
    ctx.beginPath()

    // 첫 번째 포인트로 이동
    ctx.moveTo(0, centerY - data[0] * amplitude)

    // 나머지 포인트 연결
    for (let i = 1; i < data.length; i++) {
      const x = i * pointSpacing
      const y = centerY - data[i] * amplitude
      ctx.lineTo(x, y)
    }

    ctx.stroke()
  }

  // 이상 징후 하이라이트 함수
  const highlightAnomalies = (
    ctx: CanvasRenderingContext2D,
    anomalies: { start: number; end: number; type: string }[],
    data: number[],
    width: number,
    height: number,
    zoomLevel: number,
  ) => {
    if (anomalies.length === 0) return

    const pointSpacing = width / (data.length - 1)

    anomalies.forEach((anomaly) => {
      const startX = anomaly.start * pointSpacing
      const endX = anomaly.end * pointSpacing

      // 이상 유형에 따른 색상 설정
      if (anomaly.type === "V") {
        ctx.fillStyle = "rgba(59, 130, 246, 0.3)" // 파란색 (V beat)
      } else if (anomaly.type === "S") {
        ctx.fillStyle = "rgba(239, 68, 68, 0.3)" // 빨간색 (S beat)
      } else {
        ctx.fillStyle = "rgba(245, 158, 11, 0.3)" // 노란색 (기타)
      }

      // 이상 구간 하이라이트
      ctx.fillRect(startX, 0, endX - startX, height)
    })
  }

  return (
    <div className="w-full h-full relative">
      <canvas ref={canvasRef} className="w-full h-full" style={{ display: "block" }} />
    </div>
  )
}

