"use client"

import { Button } from "@/components/ui/button"

interface MainMenuProps {
  onPlay: () => void
}

export function MainMenu({ onPlay }: MainMenuProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-retro-darker to-retro-dark">
      <div className="text-center space-y-8 p-8 bg-retro-dark border-4 border-retro-cyan rounded-none retro-shadow max-w-md">
        <h1 className="text-4xl font-retro text-retro-cyan retro-glow-blue leading-tight">
          CLEAN
          <br />
          CITY
        </h1>

        <p className="text-sm font-retro text-retro-yellow leading-relaxed">2D MULTIPLAYER</p>

        <div className="space-y-4 text-left">
          <div className="p-4 bg-retro-blue/20 border-2 border-retro-blue rounded-none retro-shadow-sm">
            <h3 className="font-retro text-xs text-retro-blue mb-3 leading-relaxed">CLEANERS (3)</h3>
            <p className="text-[10px] font-retro text-white/90 leading-relaxed">CLEAN TRASH AND REPORT 5 TIMES!</p>
          </div>

          <div className="p-4 bg-retro-purple/20 border-2 border-retro-purple rounded-none retro-shadow-sm">
            <h3 className="font-retro text-xs text-retro-purple mb-3 leading-relaxed">CONTAMINATOR (1)</h3>
            <p className="text-[10px] font-retro text-white/90 leading-relaxed">BLOCK DUMP FOR 20 SECONDS!</p>
          </div>
        </div>

        <Button
          onClick={onPlay}
          className="w-full font-retro text-sm py-6 bg-retro-green hover:bg-retro-cyan text-black border-4 border-white rounded-none retro-shadow retro-pulse transition-all"
        >
          PLAY
        </Button>
      </div>
    </div>
  )
}
