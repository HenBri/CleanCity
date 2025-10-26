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

const SECTION_6x5_START_X = 6
const SECTION_6x5_START_Y = 17
const SECTION_6x5_WIDTH_CELLS = 5
const SECTION_6x5_HEIGHT_CELLS = 6


const SECTION_3x4_START_X = 2
const SECTION_3x4_START_Y = 3
const SECTION_3x4_WIDTH_CELLS = 4
const SECTION_3x4_HEIGHT_CELLS = 3


const SECTION_3x3_START_X = 13
const SECTION_3x3_START_Y = 0
const SECTION_3x3_WIDTH_CELLS = 3
const SECTION_3x3_HEIGHT_CELLS = 3

const SECTION_3x2_START_X = 0
const SECTION_3x2_START_Y = 8
const SECTION_3x2_WIDTH_CELLS = 3
const SECTION_3x2_HEIGHT_CELLS = 2


const SECTION_2x2_START_X = 10
const SECTION_2x2_START_Y = 7
const SECTION_2x2_WIDTH_CELLS = 2
const SECTION_2x2_HEIGHT_CELLS = 3


const SECTION_4x4_START_X = 7
const SECTION_4x4_START_Y = 0 
const SECTION_4x4_WIDTH_CELLS = 4 
const SECTION_4x4_HEIGHT_CELLS = 3 


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
  const [section3x3Sprite, setSection3x3Sprite] = useState<HTMLImageElement | null>(null)
  const [section3x2Sprite, setSection3x2Sprite] = useState<HTMLImageElement | null>(null)
  const [section2x2Sprite, setSection2x2Sprite] = useState<HTMLImageElement | null>(null)
  const [walkableSprite, setWalkableSprite] = useState<HTMLImageElement | null>(null)
 
  const [section4x4Sprite, setSection4x4Sprite] = useState<HTMLImageElement | null>(null)


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

    cleanerImg.src = "/img/caminandoNormal.png"
    cleanerImg.onload = onImageLoad
    contaminatorImg.src = "/img/caminandoNormal.png" 
    contaminatorImg.onload = onImageLoad

    const onError = (e: Event | string) => console.error("Error al cargar la imagen de jugador:", e)
    cleanerImg.onerror = onError
    contaminatorImg.onerror = onError
  }, [])


  useEffect(() => {
    const img = new Image()
    img.src = "/img/edificio2.png"
    img.onload = () => setBuildingSprite(img)
    img.onerror = (e) => console.error("Error al cargar la imagen del edificio:", e)
  }, [])


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


  useEffect(() => {
    const img = new Image()
    img.src = "/img/karakara.jpg" 
    img.onload = () => setSection6x5Sprite(img)
    img.onerror = (e) => console.error("Error al cargar la imagen de la sección 6x5:", e)
  }, [])

  
  useEffect(() => {
    const img = new Image()
    img.src = "/img/hospital.png"
    img.onload = () => {
      console.log(" Imagen section-3x4 cargada correctamente!");
      setSection3x4Sprite(img);
    }
    img.onerror = (e) => console.error("Error al cargar la imagen de la sección 3x4:", e)
  }, [])


  useEffect(() => {
    const img = new Image()
    img.src = "/img/UMSS.png"
    img.onload = () => {
      console.log("Imagen section-3x3 cargada correctamente!");
      setSection3x3Sprite(img);
    }
    img.onerror = (e) => console.error("Error al cargar la imagen de la sección 3x3:", e)
  }, [])


  useEffect(() => {
    const img = new Image()
    img.src = "/img/hipermaxi.png"
    img.onload = () => {
      console.log("Imagen section-3x2 cargada correctamente!");
      setSection3x2Sprite(img);
    }
    img.onerror = (e) => console.error("Error al cargar la imagen de la sección 3x2:", e)
  }, [])

 
  useEffect(() => {
    const img = new Image()
    img.src = "/img/ic_norte.png"
    img.onload = () => {
      console.log("Imagen section-2x2 cargada correctamente!");
      setSection2x2Sprite(img);
    }
    img.onerror = (e) => console.error("Error al cargar la imagen de la sección 2x2:", e)
  }, [])

 
  useEffect(() => {
    const img = new Image()
    img.src = "/img/piso7.png"
    img.onload = () => {
      console.log("Imagen walkable-tile cargada correctamente!");
      setWalkableSprite(img);
    }
    img.onerror = (e) => console.error("Error al cargar la imagen walkable-tile:", e)
  }, [])

 
  useEffect(() => {
    const img = new Image()
    
    img.src = "/img/plaza.png" 
    img.onload = () => {
      console.log("Imagen section-4x4 cargada correctamente!");
      setSection4x4Sprite(img);
    }
    img.onerror = (e) => console.error("Error al cargar la imagen de la sección 4x4:", e)
  }, [])
 

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

     
        const isWithinSection4x4 =
          x >= SECTION_4x4_START_X &&
          x < SECTION_4x4_START_X + SECTION_4x4_WIDTH_CELLS &&
          y >= SECTION_4x4_START_Y &&
          y < SECTION_4x4_START_Y + SECTION_4x4_HEIGHT_CELLS

        if (isWithinSection4x4) {
          if (x === SECTION_4x4_START_X && y === SECTION_4x4_START_Y && section4x4Sprite) {
            ctx.drawImage(
              section4x4Sprite,
              SECTION_4x4_START_X * CELL_SIZE,
              SECTION_4x4_START_Y * CELL_SIZE,
              SECTION_4x4_WIDTH_CELLS * CELL_SIZE,
              SECTION_4x4_HEIGHT_CELLS * CELL_SIZE
            )
          }
          continue 
        }
        


        const isWithinSection2x2 =
          x >= SECTION_2x2_START_X &&
          x < SECTION_2x2_START_X + SECTION_2x2_WIDTH_CELLS &&
          y >= SECTION_2x2_START_Y &&
          y < SECTION_2x2_START_Y + SECTION_2x2_HEIGHT_CELLS

        if (isWithinSection2x2) {
          if (x === SECTION_2x2_START_X && y === SECTION_2x2_START_Y && section2x2Sprite) {
            ctx.drawImage(
              section2x2Sprite,
              SECTION_2x2_START_X * CELL_SIZE,
              SECTION_2x2_START_Y * CELL_SIZE,
              SECTION_2x2_WIDTH_CELLS * CELL_SIZE,
              SECTION_2x2_HEIGHT_CELLS * CELL_SIZE
            )
          }
          continue
        }

        
        const isWithinSection3x2 =
          x >= SECTION_3x2_START_X &&
          x < SECTION_3x2_START_X + SECTION_3x2_WIDTH_CELLS &&
          y >= SECTION_3x2_START_Y &&
          y < SECTION_3x2_START_Y + SECTION_3x2_HEIGHT_CELLS

        if (isWithinSection3x2) {
          if (x === SECTION_3x2_START_X && y === SECTION_3x2_START_Y && section3x2Sprite) {
            ctx.drawImage(
              section3x2Sprite,
              SECTION_3x2_START_X * CELL_SIZE,
              SECTION_3x2_START_Y * CELL_SIZE,
              SECTION_3x2_WIDTH_CELLS * CELL_SIZE,
              SECTION_3x2_HEIGHT_CELLS * CELL_SIZE
            )
          }
          continue
        }

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
          continue
        }

       
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
          continue
        }

       
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
          continue
        }

      
        if (cell === 1 && buildingSprite) {
          ctx.drawImage(buildingSprite, x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE)
        } else if (cell === 0 && walkableSprite) {
          ctx.drawImage(walkableSprite, x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE)
        } else {
          ctx.fillStyle = getCellColor(cell)
          ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE)
        }

   
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

      const spriteToDraw = trash.isDirty ? trashDirtySprite : trashCleanSprite

      if (spriteToDraw) {
        const drawX = centerX - TRASH_SPRITE_SIZE / 2
        const drawY = centerY - TRASH_SPRITE_SIZE / 2
        ctx.drawImage(spriteToDraw, drawX, drawY, TRASH_SPRITE_SIZE, TRASH_SPRITE_SIZE)
      } else {
   
        ctx.fillStyle = trash.isDirty ? "#d32f2f" : "#2e7d32"
        ctx.beginPath()
        ctx.arc(centerX, centerY, 8, 0, Math.PI * 2)
        ctx.fill()
      }

      if (trash.isKeyPOI) {
        ctx.strokeStyle = "#ffd700" 
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(centerX, centerY, TRASH_SPRITE_SIZE / 2 + 2, 0, Math.PI * 2) 
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


      if (playerSprites) {
        const img = player.role === "contaminator" ? playerSprites.contaminator : playerSprites.cleaner
        const drawX = centerX - PLAYER_SPRITE_SIZE / 2
        const drawY = centerY - PLAYER_SPRITE_SIZE / 2
        ctx.drawImage(img, drawX, drawY, PLAYER_SPRITE_SIZE, PLAYER_SPRITE_SIZE)
      } else {
       
        ctx.fillStyle = player.role === "contaminator" ? "#9c27b0" : "#2196f3"
        ctx.beginPath()
        ctx.arc(centerX, centerY, 12, 0, Math.PI * 2)
        ctx.fill()
      }

     
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
          -Math.PI / 2 + (currentAction.progress / currentAction.duration) * Math.PI * 2 
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
  }, [ 
    gameState,
    currentAction,
    selectedPlayer,
    playerSprites,
    buildingSprite,
    trashCleanSprite,
    trashDirtySprite,
    section6x5Sprite,
    section3x4Sprite,
    section3x3Sprite,
    section3x2Sprite,
    section2x2Sprite,
    walkableSprite,
    section4x4Sprite, 
  ])

 
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      keysPressed.current.add(key)

      if (gameState.gameOver) return

     
      if (!currentAction && e.repeat === false) { 
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
             
              if (playerToMove && isWalkable(newState.map, newPos)) {
                playerToMove.position = newPos
              }
              return newState
            })
          }
        }
      }
   


      if (key === " " && !currentAction) { 
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
          if (unblockAction) { 
            setCurrentAction(unblockAction)
            lastUpdateTime.current = Date.now()
          } else {
            const cleanTarget = canClean(gameState, selectedPlayer)
           
            if (cleanTarget && cleanTarget.x === 4 && cleanTarget.y === 0) {
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
  }, [gameState, selectedPlayer, currentAction]) 

  
  useEffect(() => {
    if (!currentAction) return

    const interval = setInterval(() => {
      const now = Date.now()
      const deltaTime = now - lastUpdateTime.current
      lastUpdateTime.current = now

      setCurrentAction((prevAction) => {
        if (!prevAction) return null

        const updatedAction = updateAction(prevAction, deltaTime)

       
        if (updatedAction.progress >= updatedAction.duration) {
         
          if (updatedAction.type === "contaminate") {
            setGameState((state) => completeContamination(state, updatedAction))
          } else if (updatedAction.type === "clean") {
            setGameState((state) => completeClean(state, updatedAction))
          } else if (updatedAction.type === "report") {
            setGameState((state) => completeReport(state, updatedAction))
          } else if (updatedAction.type === "unblock") {
            setGameState((state) => completeUnblock(state, updatedAction))
          }
          return null 
        }

        return updatedAction 
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
      const hospitalTrash = newState.trashCans.find((t) => t.position.x === 4 && t.position.y === 0)

      if (hospitalTrash) {
        hospitalTrash.isDirty = false
        hospitalTrash.dirtyTime = 0

     
        newState.map = newState.map.map((row, y) =>
          row.map((cell, x) => {
            if (x === 4 && y === 0 && cell === 3) { 
              return 2 
            }
            return cell
          })
        )
      }
      return newState
    })
  }


  const player = gameState.players.find((p) => p.id === selectedPlayer)
  const canDoContaminate = player?.role === "contaminator" && canContaminate(gameState, selectedPlayer)
  const canDoClean = player?.role === "cleaner" && canClean(gameState, selectedPlayer)
  const canDoReport = player?.role === "cleaner" && canReport(gameState, selectedPlayer)
  const canDoUnblock = player?.role === "cleaner" && canUnblock(gameState, selectedPlayer)
  const keyPOIsDirtied = getKeyPOIsDirtied(gameState)


  return (
    <div className="flex flex-col items-center gap-4 p-4 bg-retro-darker min-h-screen">
   
      {gameState.gameOver && (
        <EndGameScreen winner={gameState.winner!} onPlayAgain={resetGame} onMainMenu={onMainMenu} />
      )}

  
      {showMinigame && <RecyclingMinigame onComplete={handleMinigameComplete} onClose={() => setShowMinigame(false)} />}

   
      <div className="w-full max-w-4xl bg-retro-dark border-4 border-retro-cyan rounded-none retro-shadow p-4">
        <h1 className="text-2xl font-retro text-retro-yellow retro-glow-yellow text-center mb-4">CLEAN CITY</h1>

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


        <div className="flex flex-wrap gap-2 justify-center">
          {gameState.players.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPlayer(p.id)}
              className={`px-3 py-2 text-[10px] font-retro border-2 rounded-none retro-shadow-sm transition-all ${
                selectedPlayer === p.id
                  ? "bg-retro-green text-black border-retro-yellow" 
                  : "bg-retro-dark text-white border-white/50 hover:border-white" 
              }`}
            >
              {p.role === "contaminator" ? "CONTAM" : p.id.toUpperCase().slice(0, 6)} ({p.health}HP)
            </button>
          ))}
        </div>
      </div>

     
      <canvas
        ref={canvasRef}
        width={GAME_MAP[0].length * CELL_SIZE}
        height={GAME_MAP.length * CELL_SIZE}
        className="border-4 border-retro-cyan rounded-none retro-shadow"
      />

 
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

    
      <div className="text-[10px] font-retro text-center max-w-2xl bg-retro-dark border-2 border-white/30 rounded-none p-4 retro-shadow-sm">
        {player?.role === "contaminator" ? (
         
          <div className="space-y-2">
            <div className="text-retro-yellow">WASD / ARROWS = MOVE</div>
            <div className={canDoContaminate ? "text-retro-green" : "text-white/70"}>
              SPACE = CONTAMINATE {canDoContaminate && "(READY!)"}
            </div>
            <div className="text-retro-orange">CONTAMINATE 3 KEY POIs!</div>
          </div>
        ) : (
       
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