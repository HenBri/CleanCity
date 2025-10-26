"use client"

import { useState } from "react"
import { GameCanvas } from "@/components/game-canvas"
import { MainMenu } from "@/components/main-menu"

export default function Home() {
  const [gameStarted, setGameStarted] = useState(false)

  if (!gameStarted) {
    return <MainMenu onPlay={() => setGameStarted(true)} />
  }

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">

        <GameCanvas onMainMenu={() => setGameStarted(false)} />
      </div>
    </main>
  )
}
