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
    <div className="fixed inset-0 flex items-center justify-center bg-retro-darker/95 z-50">
      <div className="text-center space-y-6 p-12 bg-retro-dark border-4 border-retro-yellow rounded-none retro-shadow max-w-lg">
        <div
          className={`text-3xl font-retro leading-tight ${
            isCleanersWin ? "text-retro-blue retro-glow-blue" : "text-retro-purple retro-glow-purple"
          }`}
        >
          {isCleanersWin ? "CLEANERS\nWIN!" : "CONTAMINATOR\nWINS!"}
        </div>

        <p className="text-xs font-retro text-retro-yellow leading-relaxed px-4">
          {isCleanersWin ? "CITY SAVED!\nGREAT TEAMWORK!" : "DUMP BLOCKED!\nCONTAMINATION SPREADS!"}
        </p>

        <div className="flex flex-col gap-4 pt-4">
          <Button
            onClick={onPlayAgain}
            className="w-full font-retro text-xs py-6 bg-retro-green hover:bg-retro-cyan text-black border-4 border-white rounded-none retro-shadow transition-all"
          >
            PLAY AGAIN
          </Button>
          <Button
            onClick={onMainMenu}
            className="w-full font-retro text-xs py-6 bg-retro-pink hover:bg-retro-orange text-white border-4 border-white rounded-none retro-shadow transition-all"
          >
            MAIN MENU
          </Button>
        </div>
      </div>
    </div>
  )
}
