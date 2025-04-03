// 가짜 ECG 데이터 생성 함수
export function generateFakeECGData(length = 1000): Array<{
  time: string
  value: number
  abnormal: boolean
}> {
  const data = []
  let t = 0
  const dt = 0.01

  for (let i = 0; i < length; i++) {
    // 기본 사인파에 노이즈와 심장 박동 피크 추가
    const baseSignal = Math.sin(2 * Math.PI * 1.2 * t)

    // 심장 박동을 시뮬레이션하기 위한 피크 추가
    let peakSignal = 0
    if (Math.floor(t) % 1 >= 0.9 && Math.floor(t) % 1 <= 0.92) {
      peakSignal = 3.0
    }

    // 노이즈 추가
    const noise = (Math.random() - 0.5) * 0.2

    data.push({
      time: t.toFixed(2),
      value: baseSignal + peakSignal + noise,
      abnormal: Math.random() > 0.8 ? true : false, // 20%의 확률로 비정상 플래그 설정
    })

    t += dt
  }

  return data
}

// AI 모델 예측 결과 시뮬레이션 (실제로는 서버 호출로 대체될 예정)
export function simulateAIPrediction(
  data: Array<{
    time: string
    value: number
    abnormal: boolean
  }>,
  windowSize = 50,
): Array<{
  startIndex: number
  endIndex: number
  beatType: string
  confidence: string
}> {
  const predictions = []

  for (let i = 0; i < data.length - windowSize; i += windowSize / 2) {
    // 50% 확률로 정상, 25% 확률로 V beat, 25% 확률로 S beat
    const rand = Math.random()
    let beatType = "N" // Normal

    if (rand > 0.75) {
      beatType = "V" // V beat
    } else if (rand > 0.5) {
      beatType = "S" // S beat
    }

    predictions.push({
      startIndex: i,
      endIndex: i + windowSize,
      beatType: beatType,
      confidence: (0.7 + Math.random() * 0.3).toFixed(2), // 70~100% 신뢰도
    })
  }

  return predictions
}

// 기존 함수들은 유지
export function analyzeECGData(data: number[]): {
  hasAnomaly: boolean
  anomalyType: string
  confidence: number
} {
  // 실제로는 여기서 AI 모델을 호출하거나 데이터를 처리할 것입니다.
  // 지금은 간단한 시뮬레이션만 구현합니다.

  // 랜덤하게 이상 감지 시뮬레이션 (약 10% 확률)
  const hasAnomaly = Math.random() < 0.1

  // 이상이 감지되면 유형 결정
  let anomalyType = "N" // 정상
  let confidence = 0.0

  if (hasAnomaly) {
    // 랜덤하게 V 또는 S 유형 할당
    anomalyType = Math.random() < 0.5 ? "V" : "S"
    confidence = 0.7 + Math.random() * 0.3 // 70-100% 신뢰도
  }

  return {
    hasAnomaly,
    anomalyType,
    confidence,
  }
}

// 실제 AI 모델 호출 함수 (향후 구현)
export async function callAIModel(data: number[]): Promise<{
  prediction: string
  confidence: number
}> {
  // 실제로는 여기서 서버 API를 호출하여 AI 모델 예측을 받아올 것입니다.
  // 지금은 더미 응답만 반환합니다.

  // 서버 호출 시뮬레이션을 위한 지연
  await new Promise((resolve) => setTimeout(resolve, 500))

  return {
    prediction: Math.random() < 0.8 ? "N" : Math.random() < 0.5 ? "V" : "S",
    confidence: 0.7 + Math.random() * 0.3,
  }
}

