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
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Clean City</h1>
          <p className="text-muted-foreground">Asymmetric 2D Game - Cleaners vs Contaminator</p>
        </div>

        <GameCanvas onMainMenu={() => setGameStarted(false)} />

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
          <div className="p-4 bg-card rounded-lg border">
            <h3 className="font-semibold mb-2 text-blue-600">Cleaners (Team)</h3>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Clean dirty trash cans (5s)</li>
              <li>• Report contaminator when adjacent (during contamination)</li>
              <li>• Unblock dump entrance when critical block active (10s)</li>
              <li>• Win by reporting 5 times</li>
              <li>• Health: 10 HP per cleaner</li>
            </ul>
          </div>

          <div className="p-4 bg-card rounded-lg border">
            <h3 className="font-semibold mb-2 text-purple-600">Contaminator (Solo)</h3>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Contaminate trash cans (5s charge)</li>
              <li>• Contaminate all 3 KEY POIs to trigger critical block</li>
              <li>• Critical block: All trash contaminated, dump blocked</li>
              <li>• Win by keeping dump blocked for 20s</li>
              <li>• Or eliminate all cleaners</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  )
}
