import type { Segment } from "@/context/ecg-data-context"

/**
 * Extracts segments around R-peaks from an ECG signal
 *
 * @param signal The ECG signal data
 * @param rPeaks Array of R-peak indices
 * @param segmentLength Length of each segment in samples
 * @returns Array of segments
 */
export function extractSegments(signal: number[], rPeaks: number[], segmentLength: number): Segment[] {
  if (!signal || signal.length === 0 || !rPeaks || rPeaks.length === 0) {
    return []
  }

  const segments: Segment[] = []
  const halfSegment = Math.floor(segmentLength / 2)

  for (const peakIdx of rPeaks) {
    // Calculate segment boundaries
    const start = peakIdx - halfSegment
    const end = peakIdx + halfSegment + (segmentLength % 2) // Add 1 if odd length

    // Handle edge cases
    if (start < 0 || end >= signal.length) {
      // Option 1: Skip segments at the edges
      // continue;

      // Option 2: Pad with zeros
      const segmentData: number[] = new Array(segmentLength).fill(0)

      for (let i = 0; i < segmentLength; i++) {
        const signalIdx = start + i

        if (signalIdx >= 0 && signalIdx < signal.length) {
          segmentData[i] = signal[signalIdx]
        }
      }

      segments.push({
        data: segmentData,
        rPeakIndex: peakIdx,
      })
    } else {
      // Extract segment
      const segmentData = signal.slice(start, end)

      segments.push({
        data: segmentData,
        rPeakIndex: peakIdx,
      })
    }
  }

  return segments
}
