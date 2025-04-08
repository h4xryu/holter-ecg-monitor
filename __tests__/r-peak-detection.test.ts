import { detectRPeaks } from "@/lib/r-peak-detection"
import { waveletDenoise } from "@/lib/wavelet-filter"
import { it, describe, expect } from "vitest"

describe("R-Peak Detection", () => {
  // Sample ECG data (simplified for testing)
  const sampleECG = [
    0.1, 0.2, 0.3, 0.5, 0.8, 1.2, 1.5, 1.2, 0.8, 0.5, 0.3, 0.2, 0.1, 0.1, 0.2, 0.3, 0.5, 0.8, 1.2, 1.5, 1.2, 0.8, 0.5,
    0.3, 0.2, 0.1, 0.1, 0.2, 0.3, 0.5, 0.8, 1.2, 1.5, 1.2, 0.8, 0.5, 0.3, 0.2, 0.1,
  ]

  const samplingRate = 250 // Hz

  it("should detect R-peaks in sample ECG data", () => {
    const peaks = detectRPeaks(sampleECG, samplingRate, 0.5, 30)

    // We expect 3 peaks at indices 6, 19, and 32
    expect(peaks).toHaveLength(3)
    expect(peaks).toContain(6)
    expect(peaks).toContain(19)
    expect(peaks).toContain(32)
  })

  it("should adjust sensitivity based on threshold", () => {
    // Lower threshold should detect more peaks
    const lowThresholdPeaks = detectRPeaks(sampleECG, samplingRate, 0.3, 30)

    // Higher threshold should detect fewer peaks
    const highThresholdPeaks = detectRPeaks(sampleECG, samplingRate, 0.7, 30)

    expect(lowThresholdPeaks.length).toBeGreaterThanOrEqual(highThresholdPeaks.length)
  })

  it("should handle empty input", () => {
    const peaks = detectRPeaks([], samplingRate, 0.5, 30)
    expect(peaks).toHaveLength(0)
  })

  it("wavelet denoising should preserve signal shape", () => {
    const denoisedSignal = waveletDenoise(sampleECG, 2)

    // Denoised signal should have the same length
    expect(denoisedSignal.length).toBe(sampleECG.length)

    // Peaks should still be present (though values may change)
    const originalPeakIndices = [6, 19, 32]

    for (const peakIdx of originalPeakIndices) {
      // Check if there's still a local maximum at or near the original peak
      const isLocalMax =
        denoisedSignal[peakIdx] > denoisedSignal[peakIdx - 1] && denoisedSignal[peakIdx] > denoisedSignal[peakIdx + 1]

      expect(isLocalMax).toBe(true)
    }
  })
})
