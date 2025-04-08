import { waveletDenoise } from "./wavelet-filter"

/**
 * Detects R-peaks in an ECG signal using a sliding window approach
 * with an enhanced Pan-Tompkins algorithm
 *
 * @param signal The ECG signal data
 * @param samplingRate The sampling rate of the ECG signal in Hz
 * @param threshold Detection threshold (0.0-1.0)
 * @param windowSize Size of the sliding window in samples (default: 500)
 * @returns Array of indices where R-peaks were detected
 */
export function detectRPeaksWithSlidingWindow(
  signal: number[],
  samplingRate: number,
  windowSize = 500,
  threshold = 0.5,
): number[] {
  if (!signal || signal.length === 0) {
    return []
  }

  const allRPeaks: number[] = []

  // Process the entire signal with sliding windows
  for (let windowStart = 0; windowStart < signal.length; windowStart += windowSize) {
    const windowEnd = Math.min(windowStart + windowSize, signal.length)
    const windowData = signal.slice(windowStart, windowEnd)

    // Detect R-peaks in this window
    const localPeaks = detectRPeaksInWindow(windowData, samplingRate, threshold)

    // Adjust peak indices to global positions
    const globalPeaks = localPeaks.map((idx) => idx + windowStart)
    allRPeaks.push(...globalPeaks)
  }

  // Post-process to remove duplicates at window boundaries
  const uniquePeaks = removeDuplicatePeaks(allRPeaks, samplingRate)

  return uniquePeaks
}

/**
 * Detects R-peaks in a window of ECG data
 */
function detectRPeaksInWindow(windowData: number[], samplingRate: number, threshold: number): number[] {
  // Apply wavelet denoising to reduce noise
  const denoisedSignal = waveletDenoise(windowData, 4)

  // Apply a simple high-pass filter to remove baseline wander
  const filteredSignal = highPassFilter(denoisedSignal, samplingRate)

  // Apply a simple derivative to emphasize QRS complexes
  const derivative = computeDerivative(filteredSignal)

  // Square the signal to make all values positive and emphasize large differences
  const squared = derivative.map((val) => val * val)

  // Apply moving window integration
  const windowMs = 30 // 30ms window
  const windowSamples = Math.round((windowMs / 1000) * samplingRate)
  const integrated = movingWindowIntegration(squared, windowSamples)

  // Find the maximum value for threshold calculation
  const max = Math.max(...integrated)

  // Calculate adaptive threshold
  const adaptiveThreshold = max * threshold

  // Find peaks above threshold
  const peaks: number[] = []
  const minDistance = Math.round(0.2 * samplingRate) // Minimum 200ms between peaks

  for (let i = 1; i < integrated.length - 1; i++) {
    if (integrated[i] > adaptiveThreshold && integrated[i] > integrated[i - 1] && integrated[i] >= integrated[i + 1]) {
      // Check if this is the first peak or if it's far enough from the last peak
      if (peaks.length === 0 || i - peaks[peaks.length - 1] >= minDistance) {
        // Find the exact R-peak in the original signal
        // Look in a small window around the detected peak
        const searchWindowSize = windowSamples
        const windowStart = Math.max(0, i - searchWindowSize)
        const windowEnd = Math.min(windowData.length - 1, i + searchWindowSize)

        let maxVal = windowData[i]
        let maxIdx = i

        for (let j = windowStart; j <= windowEnd; j++) {
          if (windowData[j] > maxVal) {
            maxVal = windowData[j]
            maxIdx = j
          }
        }

        peaks.push(maxIdx)
      }
    }
  }

  return peaks
}

/**
 * Removes duplicate peaks that might occur at window boundaries
 */
function removeDuplicatePeaks(peaks: number[], samplingRate: number): number[] {
  if (peaks.length <= 1) return peaks

  // Sort peaks by index
  const sortedPeaks = [...peaks].sort((a, b) => a - b)

  // Minimum distance between peaks (in samples)
  const minDistance = Math.round(0.2 * samplingRate) // 200ms

  // Filter out duplicates
  const uniquePeaks: number[] = [sortedPeaks[0]]

  for (let i = 1; i < sortedPeaks.length; i++) {
    if (sortedPeaks[i] - uniquePeaks[uniquePeaks.length - 1] >= minDistance) {
      uniquePeaks.push(sortedPeaks[i])
    }
  }

  return uniquePeaks
}

/**
 * Applies a simple high-pass filter to remove baseline wander
 */
function highPassFilter(signal: number[], samplingRate: number): number[] {
  const filtered = new Array(signal.length).fill(0)
  const alpha = 0.995 // Filter coefficient

  for (let i = 1; i < signal.length; i++) {
    filtered[i] = alpha * filtered[i - 1] + alpha * (signal[i] - signal[i - 1])
  }

  return filtered
}

/**
 * Computes the derivative of the signal
 */
function computeDerivative(signal: number[]): number[] {
  const derivative = new Array(signal.length).fill(0)

  for (let i = 1; i < signal.length - 1; i++) {
    derivative[i] = (signal[i + 1] - signal[i - 1]) / 2
  }

  return derivative
}

/**
 * Applies moving window integration
 */
function movingWindowIntegration(signal: number[], windowSize: number): number[] {
  const integrated = new Array(signal.length).fill(0)

  for (let i = 0; i < signal.length; i++) {
    let sum = 0
    let count = 0

    for (let j = Math.max(0, i - windowSize); j <= i; j++) {
      sum += signal[j]
      count++
    }

    integrated[i] = sum / count
  }

  return integrated
}

/**
 * Detects R-peaks in an ECG signal using an enhanced Pan-Tompkins algorithm
 *
 * @param signal The ECG signal data
 * @param samplingRate The sampling rate of the ECG signal in Hz
 * @param threshold Detection threshold (0.0-1.0)
 * @param windowSize Size of the analysis window in milliseconds
 * @returns Array of indices where R-peaks were detected
 */
export function detectRPeaks(signal: number[], samplingRate: number, threshold: number, windowSize: number): number[] {
  // Convert window size from milliseconds to samples
  const windowSamples = Math.round((windowSize / 1000) * samplingRate)

  return detectRPeaksWithSlidingWindow(signal, samplingRate, windowSamples, threshold)
}
