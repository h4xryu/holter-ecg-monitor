"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export interface Model {
  id: string
  name: string
  description: string
  type: string
  originalType: string
  data: ArrayBuffer
  dateAdded: string
}

interface ModelContextType {
  models: Model[]
  activeModelId: string | null
  activeModel: Model | null
  addModel: (model: Omit<Model, "id">) => Promise<string>
  deleteModel: (id: string) => Promise<void>
  setActiveModel: (id: string) => void
}

const ModelContext = createContext<ModelContextType | undefined>(undefined)

export function ModelProvider({ children }: { children: ReactNode }) {
  const [models, setModels] = useState<Model[]>([])
  const [activeModelId, setActiveModelId] = useState<string | null>(null)
  const [activeModel, setActiveModelObj] = useState<Model | null>(null)

  // Load models from IndexedDB on mount
  useEffect(() => {
    const loadModels = async () => {
      try {
        // In a real implementation, this would load from IndexedDB
        // For this demo, we'll use localStorage for simplicity
        const storedModels = localStorage.getItem("ecg-models")
        if (storedModels) {
          // Note: In a real implementation, we'd need to handle ArrayBuffer serialization
          // This is simplified for the demo
          setModels(JSON.parse(storedModels))
        }

        const activeId = localStorage.getItem("ecg-active-model")
        if (activeId) {
          setActiveModelId(activeId)
        }
      } catch (err) {
        console.error("Failed to load models:", err)
      }
    }

    loadModels()
  }, [])

  // Update active model when activeModelId changes
  useEffect(() => {
    if (activeModelId) {
      const model = models.find((m) => m.id === activeModelId) || null
      setActiveModelObj(model)
    } else {
      setActiveModelObj(null)
    }
  }, [activeModelId, models])

  // Save models to IndexedDB when they change
  useEffect(() => {
    const saveModels = async () => {
      try {
        // In a real implementation, this would save to IndexedDB
        // For this demo, we'll use localStorage for simplicity
        localStorage.setItem("ecg-models", JSON.stringify(models))

        if (activeModelId) {
          localStorage.setItem("ecg-active-model", activeModelId)
        }
      } catch (err) {
        console.error("Failed to save models:", err)
      }
    }

    if (models.length > 0) {
      saveModels()
    }
  }, [models, activeModelId])

  const addModel = async (model: Omit<Model, "id">): Promise<string> => {
    const id = `model-${Date.now()}`
    const newModel = { ...model, id }

    setModels((prevModels) => [...prevModels, newModel])

    return id
  }

  const deleteModel = async (id: string): Promise<void> => {
    setModels((prevModels) => prevModels.filter((model) => model.id !== id))

    if (activeModelId === id) {
      setActiveModelId(null)
    }
  }

  const setActiveModel = (id: string) => {
    setActiveModelId(id)
  }

  return (
    <ModelContext.Provider
      value={{
        models,
        activeModelId,
        activeModel,
        addModel,
        deleteModel,
        setActiveModel,
      }}
    >
      {children}
    </ModelContext.Provider>
  )
}

export function useModel() {
  const context = useContext(ModelContext)
  if (context === undefined) {
    throw new Error("useModel must be used within a ModelProvider")
  }
  return context
}
