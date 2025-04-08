import { classifySegments } from "@/lib/classification"
import type { Segment } from "@/context/ecg-data-context"
import type { Model } from "@/context/model-context"

// Mock the ONNX runtime since we can't actually run it in tests
jest.mock("onnxruntime-web", () => ({
  InferenceSession: {
    create: jest.fn().mockResolvedValue({
      run: jest.fn().mockResolvedValue({
        output: new Float32Array([0.8, 0.05, 0.1, 0.03, 0.02]),
      }),
    }),
  },
}))

describe("ECG Classification", () => {
  // Sample segments for testing
  const sampleSegments: Segment[] = [
    {
      data: new Array(360).fill(0).map((_, i) => Math.sin(i / 10)),
      rPeakIndex: 100,
    },
    {
      data: new Array(360).fill(0).map((_, i) => Math.cos(i / 10)),
      rPeakIndex: 200,
    },
  ]

  // Mock model
  const mockModel: Model = {
    id: "test-model",
    name: "Test Model",
    version: "1.0.0",
    description: "Test model for unit tests",
    type: "onnx",
    originalType: "onnx",
    data: new ArrayBuffer(0),
    dateAdded: new Date().toISOString(),
    isFavorite: false,
    metadata: {},
  }

  test("should classify segments and return results", async () => {
    const classifications = await classifySegments(sampleSegments, mockModel)

    expect(classifications).toHaveLength(2)

    // Check structure of classification results
    classifications.forEach((classification) => {
      expect(classification).toHaveProperty("class")
      expect(classification).toHaveProperty("confidence")
      expect(classification).toHaveProperty("scores")

      // Check that confidence is between 0 and 1
      expect(classification.confidence).toBeGreaterThanOrEqual(0)
      expect(classification.confidence).toBeLessThanOrEqual(1)

      // Check that class is one of the expected values
      expect(["N", "S", "V", "F", "Q"]).toContain(classification.class)

      // Check that scores object has all expected classes
      expect(classification.scores).toHaveProperty("N")
      expect(classification.scores).toHaveProperty("S")
      expect(classification.scores).toHaveProperty("V")
      expect(classification.scores).toHaveProperty("F")
      expect(classification.scores).toHaveProperty("Q")

      // Check that scores sum to approximately 1
      const sum = Object.values(classification.scores).reduce((a, b) => a + b, 0)
      expect(sum).toBeCloseTo(1, 1) // Allow some floating point error
    })
  })

  test("should handle empty input", async () => {
    const classifications = await classifySegments([], mockModel)
    expect(classifications).toHaveLength(0)
  })

  test("should throw error with invalid model", async () => {
    const invalidModel = { ...mockModel, data: null }

    await expect(classifySegments(sampleSegments, invalidModel as any)).rejects.toThrow()
  })
})
