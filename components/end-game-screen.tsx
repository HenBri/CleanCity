"use client"

import { Button } from "@/components/ui/button"

interface EndGameScreenProps {
  winner: "cleaners" | "contaminator"
  onPlayAgain: () => void
  onMainMenu: () => void
}

export function EndGameScreen({ winner, onPlayAgain, onMainMenu }: EndGameScreenProps) {
  const isCleanersWin = winner === "cleaners"

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-50">
      <div className="text-center space-y-6 p-12 bg-white rounded-2xl shadow-2xl max-w-lg">
        <div className={`text-7xl font-bold ${isCleanersWin ? "text-blue-600" : "text-purple-600"}`}>
          {isCleanersWin ? "Cleaners Win!" : "Contaminator Wins!"}
        </div>

        <p className="text-2xl text-gray-600">
          {isCleanersWin ? "The city is saved! Great teamwork!" : "The dump is blocked! Contamination spreads!"}
        </p>

        <div className="flex gap-4 pt-4">
          <Button onClick={onPlayAgain} size="lg" className="flex-1 text-lg py-6">
            Play Again
          </Button>
          <Button onClick={onMainMenu} size="lg" variant="outline" className="flex-1 text-lg py-6 bg-transparent">
            Main Menu
          </Button>
        </div>
      </div>
    </div>
  )
}
