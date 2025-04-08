"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export interface Segment {
  data: number[]
  rPeakIndex: number
}

export interface Classification {
  class: string
  confidence: number
  scores: Record<string, number>
}

export interface ECGDataType {
  rawData: number[]
  samplingRate: number
  fileName: string
  rPeaks: number[]
  segments: Segment[]
  classifications: Classification[]
}

interface ECGDataContextType {
  ecgData: ECGDataType | null
  setECGData: (data: ECGDataType | null) => void
}

const ECGDataContext = createContext<ECGDataContextType | undefined>(undefined)

// IndexedDB database name and store
const DB_NAME = "ecg-database"
const STORE_NAME = "ecg-data"
const DB_VERSION = 1

// Open IndexedDB connection
const openDatabase = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      console.error("Failed to open IndexedDB")
      reject(request.error)
    }

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onupgradeneeded = (event) => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" })
      }
    }
  })
}

// Save ECG data to IndexedDB
const saveToIndexedDB = async (data: ECGDataType): Promise<void> => {
  try {
    const db = await openDatabase()
    const transaction = db.transaction(STORE_NAME, "readwrite")
    const store = transaction.objectStore(STORE_NAME)

    // Use a fixed ID for simplicity
    const record = { id: "current-ecg-data", ...data }

    return new Promise((resolve, reject) => {
      const request = store.put(record)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)

      transaction.oncomplete = () => db.close()
    })
  } catch (error) {
    console.error("Error saving to IndexedDB:", error)
    throw error
  }
}

// Load ECG data from IndexedDB
const loadFromIndexedDB = async (): Promise<ECGDataType | null> => {
  try {
    const db = await openDatabase()
    const transaction = db.transaction(STORE_NAME, "readonly")
    const store = transaction.objectStore(STORE_NAME)

    return new Promise((resolve, reject) => {
      const request = store.get("current-ecg-data")

      request.onsuccess = () => {
        if (request.result) {
          // Remove the ID field before returning
          const { id, ...data } = request.result
          resolve(data as ECGDataType)
        } else {
          resolve(null)
        }
      }

      request.onerror = () => reject(request.error)

      transaction.oncomplete = () => db.close()
    })
  } catch (error) {
    console.error("Error loading from IndexedDB:", error)
    return null
  }
}

// Clear ECG data from IndexedDB
const clearFromIndexedDB = async (): Promise<void> => {
  try {
    const db = await openDatabase()
    const transaction = db.transaction(STORE_NAME, "readwrite")
    const store = transaction.objectStore(STORE_NAME)

    return new Promise((resolve, reject) => {
      const request = store.delete("current-ecg-data")

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)

      transaction.oncomplete = () => db.close()
    })
  } catch (error) {
    console.error("Error clearing IndexedDB:", error)
  }
}

export function ECGDataProvider({ children }: { children: ReactNode }) {
  const [ecgData, setECGDataState] = useState<ECGDataType | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load ECG data from IndexedDB on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        const data = await loadFromIndexedDB()
        if (data) {
          setECGDataState(data)
        }
      } catch (error) {
        console.error("Failed to load ECG data from IndexedDB:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // Wrapper for setECGData that also updates IndexedDB
  const setECGData = async (data: ECGDataType | null) => {
    setECGDataState(data)

    // Save to or clear from IndexedDB
    try {
      if (data) {
        await saveToIndexedDB(data)
      } else {
        await clearFromIndexedDB()
      }
    } catch (error) {
      console.error("Failed to update ECG data in IndexedDB:", error)
    }
  }

  return <ECGDataContext.Provider value={{ ecgData, setECGData }}>{!isLoading && children}</ECGDataContext.Provider>
}

export function useECGData() {
  const context = useContext(ECGDataContext)
  if (context === undefined) {
    throw new Error("useECGData must be used within an ECGDataProvider")
  }
  return context
}
