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

interface PlayerSprites {
  cleaner: HTMLImageElement
  contaminator: HTMLImageElement
}
const PLAYER_SPRITE_SIZE = 32
const TRASH_SPRITE_SIZE = 16

// Definición del área 6x5
const SECTION_6x5_START_X = 6 // Columna inicial (en la matriz)
const SECTION_6x5_START_Y = 17 // Fila inicial (en la matriz)
const SECTION_6x5_WIDTH_CELLS = 5 // Ancho en número de celdas
const SECTION_6x5_HEIGHT_CELLS = 6 // Alto en número de celdas

// Definición del área 3x4
const SECTION_3x4_START_X = 2 // Columna inicial (en la matriz)
const SECTION_3x4_START_Y = 3 // Fila inicial (en la matriz)
const SECTION_3x4_WIDTH_CELLS = 4 // Ancho en número de celdas
const SECTION_3x4_HEIGHT_CELLS = 3 // Alto en número de celdas

// --- NUEVAS CONSTANTES PARA EL ÁREA 3x3 ---
const SECTION_3x3_START_X = 13 // Columna inicial (en la matriz)
const SECTION_3x3_START_Y = 0 // Fila inicial (en la matriz)
const SECTION_3x3_WIDTH_CELLS = 3 // Ancho en número de celdas
const SECTION_3x3_HEIGHT_CELLS = 3 // Alto en número de celdas
// ------------------------------------------

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

  const [playerSprites, setPlayerSprites] = useState<PlayerSprites | null>(null)
  const [buildingSprite, setBuildingSprite] = useState<HTMLImageElement | null>(null)
  const [trashCleanSprite, setTrashCleanSprite] = useState<HTMLImageElement | null>(null)
  const [trashDirtySprite, setTrashDirtySprite] = useState<HTMLImageElement | null>(null)
  const [section6x5Sprite, setSection6x5Sprite] = useState<HTMLImageElement | null>(null)
  const [section3x4Sprite, setSection3x4Sprite] = useState<HTMLImageElement | null>(null)
  // --- NUEVO ESTADO PARA LA IMAGEN 3x3 ---
  const [section3x3Sprite, setSection3x3Sprite] = useState<HTMLImageElement | null>(null)
  // ---------------------------------------

  // useEffect para cargar GIFs de jugadores
  useEffect(() => {
    let loadedCount = 0
    const totalImages = 2
    const cleanerImg = new Image()
    const contaminatorImg = new Image()

    const onImageLoad = () => {
      loadedCount++
      if (loadedCount === totalImages) {
        setPlayerSprites({
          cleaner: cleanerImg,
          contaminator: contaminatorImg,
        })
      }
    }

    cleanerImg.src = "/img/caminandoNormal.gif"
    cleanerImg.onload = onImageLoad
    contaminatorImg.src = "/img/caminandoNormal.gif" // Cambia si tienes otro GIF
    contaminatorImg.onload = onImageLoad

    const onError = (e: Event | string) => console.error("Error al cargar la imagen de jugador:", e)
    cleanerImg.onerror = onError
    contaminatorImg.onerror = onError
  }, [])

  // useEffect para cargar imagen de edificio
  useEffect(() => {
    const img = new Image()
    img.src = "/img/edificio2.jpeg"
    img.onload = () => setBuildingSprite(img)
    img.onerror = (e) => console.error("Error al cargar la imagen del edificio:", e)
  }, [])

  // useEffect para cargar sprites de basura
  useEffect(() => {
    const cleanImg = new Image()
    const dirtyImg = new Image()

    let loadedCount = 0
    const onImageLoad = () => {
      loadedCount++
      if (loadedCount === 2) {
        setTrashCleanSprite(cleanImg)
        setTrashDirtySprite(dirtyImg)
      }
    }

    cleanImg.src = "/img/basurero_verde_p.png"
    cleanImg.onload = onImageLoad
    cleanImg.onerror = (e) => console.error("Error al cargar trash-clean.png:", e)

    dirtyImg.src = "/img/basurero_negro_p.png"
    dirtyImg.onload = onImageLoad
    dirtyImg.onerror = (e) => console.error("Error al cargar trash-dirty.png:", e)
  }, [])

  // useEffect para cargar la imagen de la sección 6x5
  useEffect(() => {
    const img = new Image()
    img.src = "/img/karakara.jpg" // Ruta a tu imagen
    img.onload = () => setSection6x5Sprite(img)
    img.onerror = (e) => console.error("Error al cargar la imagen de la sección 6x5:", e)
  }, [])

  // useEffect para cargar la imagen de la sección 3x4
  useEffect(() => {
    const img = new Image()
    img.src = "/img/hospital.png"
    img.onload = () => {
      console.log("✅ Imagen section-3x4 cargada correctamente!");
      setSection3x4Sprite(img);
    }
    img.onerror = (e) => console.error("❌ Error al cargar la imagen de la sección 3x4:", e)
  }, [])

  // --- NUEVO useEffect para cargar la imagen de la sección 3x3 ---
  useEffect(() => {
    const img = new Image()
    // Asegúrate de que esta imagen tenga las dimensiones correctas:
    // width = SECTION_3x3_WIDTH_CELLS * CELL_SIZE
    // height = SECTION_3x3_HEIGHT_CELLS * CELL_SIZE
    img.src = "/img/UMSS.png" // <--- ASEGÚRATE DE QUE ESTA RUTA Y NOMBRE SEAN CORRECTOS
    img.onload = () => {
      console.log("✅ Imagen section-3x3 cargada correctamente!");
      setSection3x3Sprite(img);
    }
    img.onerror = (e) => console.error("❌ Error al cargar la imagen de la sección 3x3:", e)
  }, [])
  // ---------------------------------------------------------------

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

  // Render game
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw map
    for (let y = 0; y < gameState.map.length; y++) {
      for (let x = 0; x < gameState.map[y].length; x++) {
        const cell = gameState.map[y][x]

        // Lógica para dibujar el área 3x3 (PRIORIDAD MÁS ALTA)
        const isWithinSection3x3 =
          x >= SECTION_3x3_START_X &&
          x < SECTION_3x3_START_X + SECTION_3x3_WIDTH_CELLS &&
          y >= SECTION_3x3_START_Y &&
          y < SECTION_3x3_START_Y + SECTION_3x3_HEIGHT_CELLS

        if (isWithinSection3x3) {
          if (x === SECTION_3x3_START_X && y === SECTION_3x3_START_Y && section3x3Sprite) {
            ctx.drawImage(
              section3x3Sprite,
              SECTION_3x3_START_X * CELL_SIZE,
              SECTION_3x3_START_Y * CELL_SIZE,
              SECTION_3x3_WIDTH_CELLS * CELL_SIZE,
              SECTION_3x3_HEIGHT_CELLS * CELL_SIZE
            )
          }
          continue // Saltamos el dibujo individual para las celdas de esta sección
        }

        // Lógica para dibujar el área 3x4 (Alta prioridad)
        const isWithinSection3x4 =
          x >= SECTION_3x4_START_X &&
          x < SECTION_3x4_START_X + SECTION_3x4_WIDTH_CELLS &&
          y >= SECTION_3x4_START_Y &&
          y < SECTION_3x4_START_Y + SECTION_3x4_HEIGHT_CELLS

        if (isWithinSection3x4) {
          if (x === SECTION_3x4_START_X && y === SECTION_3x4_START_Y && section3x4Sprite) {
            ctx.drawImage(
              section3x4Sprite,
              SECTION_3x4_START_X * CELL_SIZE,
              SECTION_3x4_START_Y * CELL_SIZE,
              SECTION_3x4_WIDTH_CELLS * CELL_SIZE,
              SECTION_3x4_HEIGHT_CELLS * CELL_SIZE
            )
          }
          continue // Saltamos el dibujo individual para las celdas de esta sección
        }

        // Lógica para dibujar el área 6x5 (menor prioridad)
        const isWithinSection6x5 =
          x >= SECTION_6x5_START_X &&
          x < SECTION_6x5_START_X + SECTION_6x5_WIDTH_CELLS &&
          y >= SECTION_6x5_START_Y &&
          y < SECTION_6x5_START_Y + SECTION_6x5_HEIGHT_CELLS

        if (isWithinSection6x5) {
          if (x === SECTION_6x5_START_X && y === SECTION_6x5_START_Y && section6x5Sprite) {
            ctx.drawImage(
              section6x5Sprite,
              SECTION_6x5_START_X * CELL_SIZE,
              SECTION_6x5_START_Y * CELL_SIZE,
              SECTION_6x5_WIDTH_CELLS * CELL_SIZE,
              SECTION_6x5_HEIGHT_CELLS * CELL_SIZE
            )
          }
          continue // Saltamos el dibujo individual para las celdas de esta sección
        }

        // Lógica de renderizado de celdas individuales (si no está dentro de ninguna sección de imagen grande)
        if (cell === 1 && buildingSprite) {
          ctx.drawImage(buildingSprite, x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE)
        } else {
          // Dibuja el color por defecto (para celdas 0, 2, 3, 4, 5, etc.)
          ctx.fillStyle = getCellColor(cell)
          ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE)
        }

        // Draw grid
        ctx.strokeStyle = "#00000020"
        ctx.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE)

        // Draw DUMP text
        if ((x === 14 && y === 0) || (x === 14 && y === 1)) {
          ctx.fillStyle = "#ffffff"
          ctx.font = "10px sans-serif"
          ctx.textAlign = "center"
          ctx.fillText("DUMP", x * CELL_SIZE + CELL_SIZE / 2, y * CELL_SIZE + CELL_SIZE / 2 + 3)
        }
      }
    }

    // Draw Hospital
    const hospitalPos = { x: 4, y: 0 }
    ctx.fillStyle = "#ff000040" // Semi-transparent red background
    ctx.fillRect(hospitalPos.x * CELL_SIZE, hospitalPos.y * CELL_SIZE, CELL_SIZE, CELL_SIZE)
    ctx.fillStyle = "#ffffff"
    ctx.font = "12px sans-serif"
    ctx.textAlign = "center"
    ctx.fillText("H", hospitalPos.x * CELL_SIZE + CELL_SIZE / 2, hospitalPos.y * CELL_SIZE + CELL_SIZE / 2 + 4)

    // Draw trash cans with images
    gameState.trashCans.forEach((trash) => {
      const centerX = trash.position.x * CELL_SIZE + CELL_SIZE / 2
      const centerY = trash.position.y * CELL_SIZE + CELL_SIZE / 2

      const spriteToDraw = trash.isDirty ? trashDirtySprite : trashCleanSprite

      if (spriteToDraw) {
        const drawX = centerX - TRASH_SPRITE_SIZE / 2
        const drawY = centerY - TRASH_SPRITE_SIZE / 2
        ctx.drawImage(spriteToDraw, drawX, drawY, TRASH_SPRITE_SIZE, TRASH_SPRITE_SIZE)
      } else {
        // Fallback drawing if images haven't loaded
        ctx.fillStyle = trash.isDirty ? "#d32f2f" : "#2e7d32"
        ctx.beginPath()
        ctx.arc(centerX, centerY, 8, 0, Math.PI * 2)
        ctx.fill()
      }

      if (trash.isKeyPOI) {
        ctx.strokeStyle = "#ffd700" // Gold outline for Key POIs
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(centerX, centerY, TRASH_SPRITE_SIZE / 2 + 2, 0, Math.PI * 2) // Outline around the sprite
        ctx.stroke()
      }
    })

    // Draw players
    gameState.players.forEach((player) => {
      const centerX = player.position.x * CELL_SIZE + CELL_SIZE / 2
      const centerY = player.position.y * CELL_SIZE + CELL_SIZE / 2

      // Contamination effect (red halo)
      if (player.isContaminated) {
        ctx.fillStyle = "#ff000040" // Semi-transparent red
        ctx.beginPath()
        ctx.arc(centerX, centerY, 16, 0, Math.PI * 2) // Larger circle for effect
        ctx.fill()
      }

      // Player sprite
      if (playerSprites) {
        const img = player.role === "contaminator" ? playerSprites.contaminator : playerSprites.cleaner
        const drawX = centerX - PLAYER_SPRITE_SIZE / 2
        const drawY = centerY - PLAYER_SPRITE_SIZE / 2
        ctx.drawImage(img, drawX, drawY, PLAYER_SPRITE_SIZE, PLAYER_SPRITE_SIZE)
      } else {
        // Fallback drawing (colored circle)
        ctx.fillStyle = player.role === "contaminator" ? "#9c27b0" : "#2196f3"
        ctx.beginPath()
        ctx.arc(centerX, centerY, 12, 0, Math.PI * 2)
        ctx.fill()
      }

      // Selected player indicator (yellow outline)
      if (player.id === selectedPlayer) {
        ctx.strokeStyle = "#ffeb3b"
        ctx.lineWidth = 3
        ctx.strokeRect(
          centerX - PLAYER_SPRITE_SIZE / 2,
          centerY - PLAYER_SPRITE_SIZE / 2,
          PLAYER_SPRITE_SIZE,
          PLAYER_SPRITE_SIZE
        )
      }

      // Health bar
      const barWidth = 24
      const barHeight = 4
      const barX = centerX - barWidth / 2
      const barY = centerY - 20 // Positioned above the player

      ctx.fillStyle = "#000000" // Black background for health bar
      ctx.fillRect(barX, barY, barWidth, barHeight)
      ctx.fillStyle = "#4caf50" // Green for health
      ctx.fillRect(barX, barY, (player.health / 10) * barWidth, barHeight)
    })

    // Draw action progress (yellow circle filling up)
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
          18, // Radius of the progress circle
          -Math.PI / 2, // Start at the top
          -Math.PI / 2 + (currentAction.progress / currentAction.duration) * Math.PI * 2 // End angle based on progress
        )
        ctx.stroke()

        // Action type text below the player
        ctx.fillStyle = "#ffffff"
        ctx.font = "10px sans-serif"
        ctx.textAlign = "center"
        ctx.fillText(currentAction.type.toUpperCase(), centerX, centerY + 35)
      }
    }

    // Draw Critical Block Active banner
    if (gameState.criticalBlockActive) {
      ctx.fillStyle = "#ff000080" // Semi-transparent red banner
      ctx.fillRect(0, 0, canvas.width, 60) // Top banner

      ctx.fillStyle = "#ffffff"
      ctx.font = "bold 24px sans-serif"
      ctx.textAlign = "center"
      ctx.fillText("CRITICAL BLOCK ACTIVE!", canvas.width / 2, 30)
      ctx.font = "bold 18px sans-serif"
      ctx.fillText(`Time: ${Math.ceil(gameState.blockTimer)}s`, canvas.width / 2, 50)
    }
  }, [ // Dependencies for the render effect
    gameState,
    currentAction,
    selectedPlayer,
    playerSprites,
    buildingSprite,
    trashCleanSprite,
    trashDirtySprite,
    section6x5Sprite,
    section3x4Sprite,
    section3x3Sprite, // --- AGREGADO: Nueva imagen como dependencia ---
  ])

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      keysPressed.current.add(key)

      if (gameState.gameOver) return

      // --- Player Movement Logic ---
      if (!currentAction && e.repeat === false) { // Move only if no action and key is not held down
        const player = gameState.players.find((p) => p.id === selectedPlayer)
        if (player) {
          let newPos = { ...player.position }
          let moved = false

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
              const newState = { ...prev }
              const playerToMove = newState.players.find((p) => p.id === selectedPlayer)
              // Check if the new position is within map bounds and walkable
              if (playerToMove && isWalkable(newState.map, newPos)) {
                playerToMove.position = newPos
              }
              return newState
            })
          }
        }
      }
      // --- End Movement Logic ---

      // --- Action Logic ---
      if (key === " " && !currentAction) { // Space bar initiates actions
        const player = gameState.players.find((p) => p.id === selectedPlayer)
        if (!player) return;

        if (player.role === "contaminator") {
          const action = startContamination(gameState, selectedPlayer)
          if (action) {
            setCurrentAction(action)
            lastUpdateTime.current = Date.now()
          }
        } else if (player.role === "cleaner") {
          const unblockAction = startUnblock(gameState, selectedPlayer)
          if (unblockAction) { // Prioritize unblocking
            setCurrentAction(unblockAction)
            lastUpdateTime.current = Date.now()
          } else {
            const cleanTarget = canClean(gameState, selectedPlayer)
            // Special case for hospital minigame
            if (cleanTarget && cleanTarget.x === 4 && cleanTarget.y === 0) {
              setShowMinigame(true)
            } else { // Normal cleaning action
              const cleanAction = startClean(gameState, selectedPlayer)
              if (cleanAction) {
                setCurrentAction(cleanAction)
                lastUpdateTime.current = Date.now()
              }
            }
          }
        }
      }

      if (key === "r" && !currentAction) { // 'R' key for reporting
        const player = gameState.players.find((p) => p.id === selectedPlayer)
        if (player?.role === "cleaner") {
          const reportAction = startReport(gameState, selectedPlayer)
          if (reportAction) {
            setCurrentAction(reportAction)
            lastUpdateTime.current = Date.now()
          }
        }
      }
      // --- End Action Logic ---
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key.toLowerCase())
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => { // Cleanup listeners on component unmount
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [gameState, selectedPlayer, currentAction]) // Dependencies for input effect

  // useEffect for updating action progress
  useEffect(() => {
    if (!currentAction) return

    const interval = setInterval(() => {
      const now = Date.now()
      const deltaTime = now - lastUpdateTime.current
      lastUpdateTime.current = now

      setCurrentAction((prevAction) => {
        if (!prevAction) return null

        const updatedAction = updateAction(prevAction, deltaTime)

        // Check if action is complete
        if (updatedAction.progress >= updatedAction.duration) {
          // Apply game state changes based on completed action type
          if (updatedAction.type === "contaminate") {
            setGameState((state) => completeContamination(state, updatedAction))
          } else if (updatedAction.type === "clean") {
            setGameState((state) => completeClean(state, updatedAction))
          } else if (updatedAction.type === "report") {
            setGameState((state) => completeReport(state, updatedAction))
          } else if (updatedAction.type === "unblock") {
            setGameState((state) => completeUnblock(state, updatedAction))
          }
          return null // Clear current action
        }

        return updatedAction // Update action progress
      })
    }, 50) // Update progress roughly 20 times per second

    return () => clearInterval(interval) // Cleanup interval on action change/completion
  }, [currentAction])

  // useEffect for general game state updates (like timers)
  useEffect(() => {
    if (gameState.gameOver) return

    const interval = setInterval(() => {
      const now = Date.now()
      const deltaTime = now - lastGameUpdateTime.current
      lastGameUpdateTime.current = now

      setGameState((prev) => updateGameState(prev, deltaTime)) // Apply time-based updates
    }, 100) // Update game state 10 times per second

    return () => clearInterval(interval) // Cleanup interval on game over
  }, [gameState.gameOver])

  // handleMinigameComplete - Called when the RecyclingMinigame finishes
  const handleMinigameComplete = () => {
    setShowMinigame(false)
    // Manually clean the hospital trash can after minigame success
    setGameState((state) => {
      const newState = { ...state }
      const hospitalTrash = newState.trashCans.find((t) => t.position.x === 4 && t.position.y === 0)

      if (hospitalTrash) {
        hospitalTrash.isDirty = false
        hospitalTrash.dirtyTime = 0

        // Also update the map representation if necessary
        newState.map = newState.map.map((row, y) =>
          row.map((cell, x) => {
            if (x === 4 && y === 0 && cell === 3) { // Assuming 3 means dirty trash cell
              return 2 // Change back to clean trash cell (assuming 2)
            }
            return cell
          })
        )
      }
      return newState
    })
  }

  // Get current player state for UI feedback
  const player = gameState.players.find((p) => p.id === selectedPlayer)
  const canDoContaminate = player?.role === "contaminator" && canContaminate(gameState, selectedPlayer)
  const canDoClean = player?.role === "cleaner" && canClean(gameState, selectedPlayer)
  const canDoReport = player?.role === "cleaner" && canReport(gameState, selectedPlayer)
  const canDoUnblock = player?.role === "cleaner" && canUnblock(gameState, selectedPlayer)
  const keyPOIsDirtied = getKeyPOIsDirtied(gameState)

  // --- JSX Rendering ---
  return (
    <div className="flex flex-col items-center gap-4 p-4 bg-retro-darker min-h-screen">
      {/* End Game Screen Overlay */}
      {gameState.gameOver && (
        <EndGameScreen winner={gameState.winner!} onPlayAgain={resetGame} onMainMenu={onMainMenu} />
      )}

      {/* Recycling Minigame Overlay */}
      {showMinigame && <RecyclingMinigame onComplete={handleMinigameComplete} onClose={() => setShowMinigame(false)} />}

      {/* Game Info Header */}
      <div className="w-full max-w-4xl bg-retro-dark border-4 border-retro-cyan rounded-none retro-shadow p-4">
        <h1 className="text-2xl font-retro text-retro-yellow retro-glow-yellow text-center mb-4">CLEAN CITY</h1>

        {/* Status Indicators */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-4">
          <div className="px-4 py-2 bg-retro-blue/30 border-2 border-retro-blue rounded-none retro-shadow-sm">
            <span className="text-xs font-retro text-retro-blue">REPORTS: {gameState.reports}/5</span>
          </div>
          <div className="px-4 py-2 bg-retro-purple/30 border-2 border-retro-purple rounded-none retro-shadow-sm">
            <span className="text-xs font-retro text-retro-purple">POIs: {keyPOIsDirtied}/3</span>
          </div>
          {gameState.criticalBlockActive && (
            <div className="px-4 py-2 bg-retro-red/30 border-2 border-retro-red rounded-none retro-shadow-sm animate-pulse">
              <span className="text-xs font-retro text-retro-red retro-glow-pink">
                BLOCK: {Math.ceil(gameState.blockTimer)}s
              </span>
            </div>
          )}
        </div>

        {/* Player Selection Buttons */}
        <div className="flex flex-wrap gap-2 justify-center">
          {gameState.players.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPlayer(p.id)}
              className={`px-3 py-2 text-[10px] font-retro border-2 rounded-none retro-shadow-sm transition-all ${
                selectedPlayer === p.id
                  ? "bg-retro-green text-black border-retro-yellow" // Active style
                  : "bg-retro-dark text-white border-white/50 hover:border-white" // Inactive style
              }`}
            >
              {p.role === "contaminator" ? "CONTAM" : p.id.toUpperCase().slice(0, 6)} ({p.health}HP)
            </button>
          ))}
        </div>
      </div>

      {/* Game Canvas */}
      <canvas
        ref={canvasRef}
        width={GAME_MAP[0].length * CELL_SIZE}
        height={GAME_MAP.length * CELL_SIZE}
        className="border-4 border-retro-cyan rounded-none retro-shadow"
      />

      {/* Map Legend */}
      <div className="flex flex-wrap gap-2 text-[10px] font-retro justify-center">
        <div className="flex items-center gap-1 px-2 py-1 bg-retro-dark border border-white/30 rounded-none">
          <div className="w-3 h-3 bg-[#a8d5ba] border border-gray-400"></div><span className="text-white">WALK</span>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 bg-retro-dark border border-white/30 rounded-none">
          <div className="w-3 h-3 bg-[#5a5a5a] border border-gray-400"></div><span className="text-white">BUILD</span>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 bg-retro-dark border border-white/30 rounded-none">
          <div className="w-3 h-3 bg-[#4caf50] border border-gray-400"></div><span className="text-white">CLEAN</span>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 bg-retro-dark border border-white/30 rounded-none">
          <div className="w-3 h-3 bg-[#f44336] border border-gray-400"></div><span className="text-white">DIRTY</span>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 bg-retro-dark border border-white/30 rounded-none">
          <div className="w-3 h-3 bg-[#90ee90] border border-gray-400"></div><span className="text-white">DUMP</span>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 bg-retro-dark border border-white/30 rounded-none">
          <div className="w-3 h-3 bg-[#8b0000] border border-gray-400"></div><span className="text-white">BLOCK</span>
        </div>
      </div>

      {/* Controls/Instructions Footer */}
      <div className="text-[10px] font-retro text-center max-w-2xl bg-retro-dark border-2 border-white/30 rounded-none p-4 retro-shadow-sm">
        {player?.role === "contaminator" ? (
          // Contaminator Controls
          <div className="space-y-2">
            <div className="text-retro-yellow">WASD / ARROWS = MOVE</div>
            <div className={canDoContaminate ? "text-retro-green" : "text-white/70"}>
              SPACE = CONTAMINATE {canDoContaminate && "(READY!)"}
            </div>
            <div className="text-retro-orange">CONTAMINATE 3 KEY POIs!</div>
          </div>
        ) : (
          // Cleaner Controls
          <div className="space-y-2">
            <div className="text-retro-yellow">WASD / ARROWS = MOVE</div>
            <div className={canDoUnblock ? "text-retro-red animate-pulse" : "text-white/70"}>
              {canDoUnblock && "SPACE = UNBLOCK (10s) URGENT!"}
            </div>
            <div className={canDoClean && !canDoUnblock ? "text-retro-green" : "text-white/70"}>
              {!canDoUnblock && `SPACE = CLEAN ${canDoClean ? "(READY!)" : ""}`}
            </div>
            <div className={canDoReport ? "text-retro-blue" : "text-white/70"}>
              R = REPORT {canDoReport && "(READY!)"}
            </div>
            <div className="text-retro-pink">H = HOSPITAL</div>
          </div>
        )}
      </div>
    </div>
  )
}