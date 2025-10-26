"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { X } from "lucide-react"

interface WasteItem {
  id: string
  type: "carton" | "papel" | "metal" | "plastico" | "medico"
  image: string
  correctBin: string
}

interface RecyclingMinigameProps {
  onComplete: () => void
  onClose: () => void
}

const WASTE_ITEMS: WasteItem[] = [
  { id: "1", type: "carton", image: "/waste/carton.jpg", correctBin: "carton" },
  { id: "2", type: "papel", image: "/waste/papel.jpg", correctBin: "papel" },
  { id: "3", type: "metal", image: "/waste/metal.webp", correctBin: "metal" },
  { id: "4", type: "plastico", image: "/waste/plastico.png", correctBin: "plastico" },
  { id: "5", type: "carton", image: "/waste/carton.jpg", correctBin: "carton" },
  { id: "6", type: "plastico", image: "/waste/plastico.png", correctBin: "plastico" },
]

const BINS = [
  { id: "carton", name: "CARTÓN", color: "#8B4513" },
  { id: "papel", name: "PAPEL", color: "#4169E1" },
  { id: "metal", name: "METAL", color: "#C0C0C0" },
  { id: "plastico", name: "PLÁSTICO", color: "#FFD700" },
]

export function RecyclingMinigame({ onComplete, onClose }: RecyclingMinigameProps) {
  const [items, setItems] = useState<WasteItem[]>(WASTE_ITEMS)
  const [draggedItem, setDraggedItem] = useState<WasteItem | null>(null)
  const [sortedItems, setSortedItems] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (sortedItems.size === WASTE_ITEMS.length) {
      setTimeout(() => {
        onComplete()
      }, 500)
    }
  }, [sortedItems, onComplete])

  const handleDragStart = (item: WasteItem) => {
    setDraggedItem(item)
    setError(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (binId: string) => {
    if (!draggedItem) return

    if (draggedItem.correctBin === binId) {
      setSortedItems((prev) => new Set([...prev, draggedItem.id]))
      setItems((prev) => prev.filter((item) => item.id !== draggedItem.id))
      setError(null)
    } else {
      setError("¡Incorrecto! Intenta de nuevo.")
      setTimeout(() => setError(null), 2000)
    }

    setDraggedItem(null)
  }

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-gray-900 to-gray-800 rounded-lg p-8 max-w-4xl w-full border-4 border-green-500 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-4xl font-bold text-green-400" style={{ fontFamily: "monospace" }}>
            RECICLAJE AVANZADO
          </h2>
          <button onClick={onClose} className="text-red-500 hover:text-red-400 transition-colors" aria-label="Close">
            <X size={32} />
          </button>
        </div>

        <p className="text-white text-lg mb-6 text-center" style={{ fontFamily: "monospace" }}>
          Arrastra cada residuo al contenedor correcto
        </p>

        {error && (
          <div className="bg-red-600 text-white px-4 py-2 rounded mb-4 text-center font-bold animate-pulse">
            {error}
          </div>
        )}

        <div className="mb-8 min-h-[200px] bg-gray-700 rounded-lg p-4 border-2 border-gray-600">
          <h3 className="text-xl font-bold text-yellow-400 mb-4" style={{ fontFamily: "monospace" }}>
            BANDEJA DE RESIDUOS
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                draggable
                onDragStart={() => handleDragStart(item)}
                className="bg-gray-800 rounded-lg p-4 cursor-move hover:scale-105 transition-transform border-2 border-gray-600 hover:border-green-400"
              >
                <img src={item.image || "/placeholder.svg"} alt={item.type} className="w-full h-32 object-contain" />
              </div>
            ))}
          </div>
          {items.length === 0 && (
            <div className="text-center text-green-400 text-2xl font-bold py-8" style={{ fontFamily: "monospace" }}>
              ¡COMPLETADO!
            </div>
          )}
        </div>

        <div className="grid grid-cols-4 gap-4">
          {BINS.map((bin) => (
            <div
              key={bin.id}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(bin.id)}
              className="rounded-lg p-6 border-4 border-dashed transition-all hover:scale-105"
              style={{
                backgroundColor: bin.color + "40",
                borderColor: bin.color,
              }}
            >
              <div className="text-center">
                <div
                  className="text-2xl font-bold mb-2"
                  style={{
                    fontFamily: "monospace",
                    color: bin.color,
                    textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
                  }}
                >
                  {bin.name}
                </div>
                <div className="text-4xl">🗑️</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 text-center">
          <div className="text-green-400 text-lg font-bold" style={{ fontFamily: "monospace" }}>
            Progreso: {sortedItems.size}/{WASTE_ITEMS.length}
          </div>
        </div>
      </div>
    </div>
  )
}
