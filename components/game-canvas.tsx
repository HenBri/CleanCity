"use client"

import { useEffect, useRef, useState } from "react"
import type { GameState, Action } from "@/types/game"
import { GAME_MAP, CELL_SIZE, isWalkable, getTrashCans, getCellColor } from "@/lib/game-map"
import {
  canContaminate,
  startContamination,
  updateAction,
  completeContamination,
  getKeyPOIsDirtied,
  canClean,
  startClean,
  completeClean,
  canReport,
  startReport,
  completeReport,
  canUnblock,
  startUnblock,
  completeUnblock,
  updateGameState,
} from "@/lib/game-actions"
import { EndGameScreen } from "@/components/end-game-screen"
import { RecyclingMinigame } from "@/components/recycling-minigame"

interface GameCanvasProps {
  onMainMenu: () => void
}

export function GameCanvas({ onMainMenu }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameState, setGameState] = useState<GameState>({
    map: GAME_MAP,
    players: [
      {
        id: "player1",
        position: { x: 1, y: 1 },
        role: "cleaner",
        health: 10,
        isContaminated: false,
        contaminatedTime: 0,
      },
      {
        id: "player2",
        position: { x: 2, y: 1 },
        role: "cleaner",
        health: 10,
        isContaminated: false,
        contaminatedTime: 0,
      },
      {
        id: "player3",
        position: { x: 3, y: 1 },
        role: "cleaner",
        health: 10,
        isContaminated: false,
        contaminatedTime: 0,
      },
      {
        id: "contaminator",
        position: { x: 14, y: 3 },
        role: "contaminator",
        health: 10,
        isContaminated: false,
        contaminatedTime: 0,
      },
    ],
    trashCans: getTrashCans(GAME_MAP),
    reports: 0,
    dumpBlocked: false,
    blockTimer: 0,
    gameOver: false,
    winner: null,
    criticalBlockActive: false,
  })

  const [currentAction, setCurrentAction] = useState<Action | null>(null)
  const [selectedPlayer, setSelectedPlayer] = useState<string>("player1")
  const [showMinigame, setShowMinigame] = useState(false)
  const keysPressed = useRef<Set<string>>(new Set())
  const lastUpdateTime = useRef<number>(Date.now())
  const lastGameUpdateTime = useRef<number>(Date.now())

  const resetGame = () => {
    setGameState({
      map: GAME_MAP,
      players: [
        {
          id: "player1",
          position: { x: 1, y: 1 },
          role: "cleaner",
          health: 10,
          isContaminated: false,
          contaminatedTime: 0,
        },
        {
          id: "player2",
          position: { x: 2, y: 1 },
          role: "cleaner",
          health: 10,
          isContaminated: false,
          contaminatedTime: 0,
        },
        {
          id: "player3",
          position: { x: 3, y: 1 },
          role: "cleaner",
          health: 10,
          isContaminated: false,
          contaminatedTime: 0,
        },
        {
          id: "contaminator",
          position: { x: 14, y: 3 },
          role: "contaminator",
          health: 10,
          isContaminated: false,
          contaminatedTime: 0,
        },
      ],
      trashCans: getTrashCans(GAME_MAP),
      reports: 0,
      dumpBlocked: false,
      blockTimer: 0,
      gameOver: false,
      winner: null,
      criticalBlockActive: false,
    })
    setCurrentAction(null)
    setSelectedPlayer("player1")
    setShowMinigame(false)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

 
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    for (let y = 0; y < gameState.map.length; y++) {
      for (let x = 0; x < gameState.map[y].length; x++) {
        const cell = gameState.map[y][x]
        ctx.fillStyle = getCellColor(cell)
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE)


        ctx.strokeStyle = "#00000020"
        ctx.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE)

        if ((x === 14 && y === 0) || (x === 14 && y === 1)) {
          ctx.fillStyle = "#ffffff"
          ctx.font = "10px sans-serif"
          ctx.textAlign = "center"
          ctx.fillText("DUMP", x * CELL_SIZE + CELL_SIZE / 2, y * CELL_SIZE + CELL_SIZE / 2 + 3)
        }
      }
    }

    const hospitalPos = { x: 4, y: 0 }
    ctx.fillStyle = "#ff000040"
    ctx.fillRect(hospitalPos.x * CELL_SIZE, hospitalPos.y * CELL_SIZE, CELL_SIZE, CELL_SIZE)
    ctx.fillStyle = "#ffffff"
    ctx.font = "12px sans-serif"
    ctx.textAlign = "center"
    ctx.fillText("H", hospitalPos.x * CELL_SIZE + CELL_SIZE / 2, hospitalPos.y * CELL_SIZE + CELL_SIZE / 2 + 4)

    gameState.trashCans.forEach((trash) => {
      const centerX = trash.position.x * CELL_SIZE + CELL_SIZE / 2
      const centerY = trash.position.y * CELL_SIZE + CELL_SIZE / 2

      ctx.fillStyle = trash.isDirty ? "#d32f2f" : "#2e7d32"
      ctx.beginPath()
      ctx.arc(centerX, centerY, 8, 0, Math.PI * 2)
      ctx.fill()

      if (trash.isKeyPOI) {
        ctx.strokeStyle = "#ffd700"
        ctx.lineWidth = 2
        ctx.stroke()
      }
    })


    gameState.players.forEach((player) => {
      const centerX = player.position.x * CELL_SIZE + CELL_SIZE / 2
      const centerY = player.position.y * CELL_SIZE + CELL_SIZE / 2

      if (player.isContaminated) {
        ctx.fillStyle = "#ff000040"
        ctx.beginPath()
        ctx.arc(centerX, centerY, 16, 0, Math.PI * 2)
        ctx.fill()
      }


      ctx.fillStyle = player.role === "contaminator" ? "#9c27b0" : "#2196f3"
      ctx.beginPath()
      ctx.arc(centerX, centerY, 12, 0, Math.PI * 2)
      ctx.fill()


      if (player.id === selectedPlayer) {
        ctx.strokeStyle = "#ffeb3b"
        ctx.lineWidth = 3
        ctx.stroke()
      }

      const barWidth = 24
      const barHeight = 4
      const barX = centerX - barWidth / 2
      const barY = centerY - 20

      ctx.fillStyle = "#000000"
      ctx.fillRect(barX, barY, barWidth, barHeight)
      ctx.fillStyle = "#4caf50"
      ctx.fillRect(barX, barY, (player.health / 10) * barWidth, barHeight)
    })

  
    if (currentAction) {
      const player = gameState.players.find((p) => p.id === currentAction.playerId)
      if (player) {
        const centerX = player.position.x * CELL_SIZE + CELL_SIZE / 2
        const centerY = player.position.y * CELL_SIZE + CELL_SIZE / 2

 
        ctx.strokeStyle = "#ffeb3b"
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.arc(
          centerX,
          centerY,
          18,
          -Math.PI / 2,
          -Math.PI / 2 + (currentAction.progress / currentAction.duration) * Math.PI * 2,
        )
        ctx.stroke()

        ctx.fillStyle = "#ffffff"
        ctx.font = "10px sans-serif"
        ctx.textAlign = "center"
        ctx.fillText(currentAction.type.toUpperCase(), centerX, centerY + 35)
      }
    }

    if (gameState.criticalBlockActive) {
      ctx.fillStyle = "#ff000080"
      ctx.fillRect(0, 0, canvas.width, 60)

      ctx.fillStyle = "#ffffff"
      ctx.font = "bold 24px sans-serif"
      ctx.textAlign = "center"
      ctx.fillText("CRITICAL BLOCK ACTIVE!", canvas.width / 2, 30)
      ctx.font = "bold 18px sans-serif"
      ctx.fillText(`Time: ${Math.ceil(gameState.blockTimer)}s`, canvas.width / 2, 50)
    }
  }, [gameState, currentAction, selectedPlayer])


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysPressed.current.add(key) 


      if (gameState.gameOver || showMinigame) return


      if (!currentAction && e.repeat === false) {
        const player = gameState.players.find((p) => p.id === selectedPlayer)
        if (player) {
          let newPos = { ...player.position }
          let moved = false;

          if (key === "w" || key === "arrowup") {
            newPos.y -= 1; moved = true;
          } else if (key === "s" || key === "arrowdown") {
            newPos.y += 1; moved = true;
          } else if (key === "a" || key === "arrowleft") {
            newPos.x -= 1; moved = true;
          } else if (key === "d" || key === "arrowright") {
            newPos.x += 1; moved = true;
          }

          if (moved) {
            setGameState((prev) => {
              const newState = { ...prev };
              const playerToMove = newState.players.find((p) => p.id === selectedPlayer);
              
              if (playerToMove && isWalkable(newState.map, newPos)) {
                playerToMove.position = newPos;
              }
              return newState;
            });
          }
        }
      }

      if (key === " " && !currentAction) {
        const player = gameState.players.find((p) => p.id === selectedPlayer)
        if (!player) return

        if (player.role === "contaminator") {
          const action = startContamination(gameState, selectedPlayer)
          if (action) {
            setCurrentAction(action)
            lastUpdateTime.current = Date.now()
          }
        } else if (player.role === "cleaner") {
       
          const unblockAction = startUnblock(gameState, selectedPlayer)
          if (unblockAction) {
            setCurrentAction(unblockAction)
            lastUpdateTime.current = Date.now()
            return
          }

          
          const cleanTarget = canClean(gameState, selectedPlayer)
          if (cleanTarget) {
            
            if (cleanTarget.x === 4 && cleanTarget.y === 0) {
              setShowMinigame(true)
            } else {
      
              const cleanAction = startClean(gameState, selectedPlayer)
              if (cleanAction) {
                setCurrentAction(cleanAction)
                lastUpdateTime.current = Date.now()
              }
            }
          }
        }
      }

      if (key === "r" && !currentAction) {
        const player = gameState.players.find((p) => p.id === selectedPlayer)

        if (player?.role === "cleaner") {
          const reportAction = startReport(gameState, selectedPlayer)
          if (reportAction) {
            setCurrentAction(reportAction)
            lastUpdateTime.current = Date.now()
          }
        }
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key.toLowerCase())
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [gameState, selectedPlayer, currentAction, showMinigame])

 
  useEffect(() => {
    if (!currentAction) return

    const interval = setInterval(() => {
      const now = Date.now()
      const deltaTime = now - lastUpdateTime.current
      lastUpdateTime.current = now

      setCurrentAction((prev) => {
        if (!prev) return null

        const updated = updateAction(prev, deltaTime)

       
        if (updated.progress >= updated.duration) {
          if (updated.type === "contaminate") {
            setGameState((state) => completeContamination(state, updated))
          } else if (updated.type === "clean") {
            setGameState((state) => completeClean(state, updated))
          } else if (updated.type === "report") {
            setGameState((state) => completeReport(state, updated))
          } else if (updated.type === "unblock") {
            setGameState((state) => completeUnblock(state, updated))
          }
          return null
        }

        return updated
      })
    }, 50)

    return () => clearInterval(interval)
  }, [currentAction])


  useEffect(() => {
    if (gameState.gameOver) return

    const interval = setInterval(() => {
      const now = Date.now()
      const deltaTime = now - lastGameUpdateTime.current
      lastGameUpdateTime.current = now

      setGameState((prev) => updateGameState(prev, deltaTime))
    }, 100)

    return () => clearInterval(interval)
  }, [gameState.gameOver])

  const handleMinigameComplete = () => {
    setShowMinigame(false)
   
    setGameState((state) => {
      const newState = { ...state }
      const trash = newState.trashCans.find((t) => t.position.x === 4 && t.position.y === 0)

      if (trash) {
        trash.isDirty = false
        trash.dirtyTime = 0

        
        newState.map = newState.map.map((row, y) =>
          row.map((cell, x) => {
            if (x === 4 && y === 0 && cell === 3) {
              return 2
            }
            return cell
          }),
        )
      }

      return newState
    })
  }

  const player = gameState.players.find((p) => p.id === selectedPlayer)
  const canDoContaminate = player?.role === "contaminator" && canContaminate(gameState, selectedPlayer)
  const canDoCleanTarget = player?.role === "cleaner" && canClean(gameState, selectedPlayer)
  const canDoReport = player?.role === "cleaner" && canReport(gameState, selectedPlayer)
  const canDoUnblock = player?.role === "cleaner" && canUnblock(gameState, selectedPlayer)
  const keyPOIsDirtied = getKeyPOIsDirtied(gameState)

  if (gameState.gameOver) {
    return (
      <EndGameScreen winner={gameState.winner!} onPlayAgain={resetGame} onMainMenu={onMainMenu} />
    )
  }

 
  if (showMinigame) {
    return (
      <div className="flex flex-col items-center gap-4 p-4">
        <RecyclingMinigame onComplete={handleMinigameComplete} onClose={() => setShowMinigame(false)} />
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      {/* Ya no es necesario el condicional de gameState.gameOver aquí */}
      
      {/* No mostrar el minijuego aquí si showMinigame es el punto de salida. */}
      {/* {showMinigame && <RecyclingMinigame onComplete={handleMinigameComplete} onClose={() => setShowMinigame(false)} />} */}

      <div className="flex items-center justify-between w-full max-w-4xl">
        <div className="flex gap-2">
          <div className="text-sm font-medium">Reports: {gameState.reports}/5</div>
          <div className="text-sm font-medium text-purple-600">Key POIs Dirtied: {keyPOIsDirtied}/3</div>
          {gameState.criticalBlockActive && (
            <div className="text-sm font-medium text-red-600 animate-pulse">
              CRITICAL BLOCK: {Math.ceil(gameState.blockTimer)}s
            </div>
          )}
        </div>
        <div className="flex gap-2">
          {gameState.players.map((player) => (
            <button
              key={player.id}
              onClick={() => setSelectedPlayer(player.id)}
              className={`px-3 py-1 text-sm rounded ${
                selectedPlayer === player.id ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"
              }`}
            >
              {player.role === "contaminator" ? "Contaminator" : player.id} ({player.health} HP)
            </button>
          ))}
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={GAME_MAP[0].length * CELL_SIZE}
        height={GAME_MAP.length * CELL_SIZE}
        className="border-2 border-gray-800 rounded"
      />

      <div className="flex gap-2 text-sm">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-[#a8d5ba] border border-gray-400"></div>
          <span>Walkable</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-[#5a5a5a] border border-gray-400"></div>
          <span>Building</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-[#4caf50] border border-gray-400"></div>
          <span>Clean Trash</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-[#f44336] border border-gray-400"></div>
          <span>Dirty Trash</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-[#90ee90] border border-gray-400"></div>
          <span>Dump Entrance</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-[#8b0000] border border-gray-400"></div>
          <span>Blocked</span>
        </div>
      </div>

      <div className="text-sm text-gray-600 text-center">
        {player?.role === "contaminator" ? (
          <div>
            <div>Use WASD or Arrow Keys to move.</div>
            <div className={canDoContaminate ? "text-green-600 font-semibold" : ""}>
              Press SPACE to contaminate trash can {canDoContaminate && "(available!)"}
            </div>
            <div className="text-orange-600 font-semibold">
              Contaminate all 3 KEY POIs (gold outline) to trigger CRITICAL BLOCK!
            </div>
          </div>
        ) : (
          <div>
            <div>Use WASD or Arrow Keys to move.</div>
            <div className={canDoUnblock ? "text-red-600 font-semibold animate-pulse" : ""}>
              {canDoUnblock && "Press SPACE to UNBLOCK dump entrance (10s) - URGENT!"}
            </div>
            <div className={canDoCleanTarget && !canDoUnblock ? "text-green-600 font-semibold" : ""}>
              {!canDoUnblock && `Press SPACE to clean trash can ${canDoCleanTarget ? "(available!)" : ""}`}
            </div>
            <div className={canDoReport ? "text-blue-600 font-semibold" : ""}>
              Press R to report contaminator {canDoReport && "(available!)"}
            </div>
            <div>Go to Hospital (H) to recover health</div>
          </div>
        )}
      </div>
    </div>
  )
}