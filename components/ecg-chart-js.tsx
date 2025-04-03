"use client"

import { useEffect, useState } from "react"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"
import { Line } from "react-chartjs-2"

// Chart.js 등록
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

interface ECGChartJSProps {
  data: Array<{
    time: string
    value: number
    abnormal: boolean
  }>
  predictions: Array<{
    startIndex: number
    endIndex: number
    beatType: string
    confidence: string
  }>
  sliceSize?: number
}

export default function ECGChartJS({ data, predictions, sliceSize = 300 }: ECGChartJSProps) {
  const [chartData, setChartData] = useState<any>({
    labels: [],
    datasets: [],
  })

  useEffect(() => {
    if (data.length === 0) return

    const slicedData = data.slice(-sliceSize)
    const timeLabels = slicedData.map((point) => point.time)
    const values = slicedData.map((point, index) => {
      // 예측 결과로 데이터 포인트 식별
      const dataIndex = data.length - sliceSize + index
      let abnormalType = null
      predictions.forEach((pred) => {
        if (dataIndex >= pred.startIndex && dataIndex <= pred.endIndex) {
          abnormalType = pred.beatType
        }
      })

      return {
        y: point.value,
        abnormalType,
      }
    })

    // Chart.js에 맞는 데이터 형식으로 변환
    setChartData({
      labels: timeLabels,
      datasets: [
        {
          label: "심전도",
          data: values.map((v) => v.y),
          borderColor: "rgb(59, 130, 246)",
          backgroundColor: "rgba(59, 130, 246, 0.5)",
          borderWidth: 2,
          tension: 0.2,
          pointRadius: 0,
        },
      ],
    })
  }, [data, predictions, sliceSize])

  // Chart.js 옵션
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: "시간",
        },
        ticks: {
          maxTicksLimit: 10,
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: "진폭",
        },
        min: -2,
        max: 4,
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
      },
    },
  }

  return (
    <div className="w-full h-full">
      <Line data={chartData} options={chartOptions} />
    </div>
  )
}

