"use client"

import { Button } from "@/components/ui/button"

interface MainMenuProps {
  onPlay: () => void
}

export function MainMenu({ onPlay }: MainMenuProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-green-100 to-green-300">
      <div className="text-center space-y-8 p-8 bg-white rounded-2xl shadow-2xl max-w-md">
        <h1 className="text-6xl font-bold text-green-700">Clean City</h1>
        <p className="text-xl text-gray-600">Asymmetric 2D Multiplayer Game</p>

        <div className="space-y-4 text-left">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-700 mb-2">Cleaners (3 players)</h3>
            <p className="text-sm text-gray-600">Clean trash and report the contaminator 5 times to win!</p>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg">
            <h3 className="font-semibold text-purple-700 mb-2">Contaminator (1 player)</h3>
            <p className="text-sm text-gray-600">Contaminate 3 key points and block the dump for 20 seconds to win!</p>
          </div>
        </div>

        <Button onClick={onPlay} size="lg" className="w-full text-xl py-6 bg-green-600 hover:bg-green-700">
          Play Game
        </Button>
      </div>
    </div>
  )
}
