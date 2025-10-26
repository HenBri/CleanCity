import type { GameState, Action, Position } from "@/types/game"

export function canContaminate(gameState: GameState, playerId: string): Position | null {
  const player = gameState.players.find((p) => p.id === playerId)
  if (!player || player.role !== "contaminator") return null

 
  const adjacentPositions = [
    { x: player.position.x, y: player.position.y }, 
    { x: player.position.x + 1, y: player.position.y },
    { x: player.position.x - 1, y: player.position.y },
    { x: player.position.x, y: player.position.y + 1 },
    { x: player.position.x, y: player.position.y - 1 },
  ]

  for (const pos of adjacentPositions) {
    const trash = gameState.trashCans.find((t) => t.position.x === pos.x && t.position.y === pos.y)
    if (trash && !trash.isDirty) {
      return pos
    }
  }

  return null
}

export function canClean(gameState: GameState, playerId: string): Position | null {
  const player = gameState.players.find((p) => p.id === playerId)
  if (!player || player.role !== "cleaner") return null

  
  const adjacentPositions = [
    { x: player.position.x, y: player.position.y }, 
    { x: player.position.x + 1, y: player.position.y },
    { x: player.position.x - 1, y: player.position.y },
    { x: player.position.x, y: player.position.y + 1 },
    { x: player.position.x, y: player.position.y - 1 },
  ]

  for (const pos of adjacentPositions) {
    const trash = gameState.trashCans.find((t) => t.position.x === pos.x && t.position.y === pos.y)
    if (trash && trash.isDirty) {
      return pos
    }
  }

  return null
}

export function canReport(gameState: GameState, playerId: string): boolean {
  const player = gameState.players.find((p) => p.id === playerId)
  if (!player || player.role !== "cleaner") return false

 
  const contaminator = gameState.players.find((p) => p.role === "contaminator")
  if (!contaminator) return false


  const distance =
    Math.abs(player.position.x - contaminator.position.x) + Math.abs(player.position.y - contaminator.position.y)

  return distance <= 1
}

export function startContamination(gameState: GameState, playerId: string): Action | null {
  const target = canContaminate(gameState, playerId)
  if (!target) return null

  return {
    playerId,
    type: "contaminate",
    target,
    progress: 0,
    duration: 5000, 
  }
}

export function startClean(gameState: GameState, playerId: string): Action | null {
  const target = canClean(gameState, playerId)
  if (!target) return null

  return {
    playerId,
    type: "clean",
    target,
    progress: 0,
    duration: 5000, 
  }
}

export function startReport(gameState: GameState, playerId: string): Action | null {
  if (!canReport(gameState, playerId)) return null

  return {
    playerId,
    type: "report",
    progress: 0,
    duration: 2000, 
  }
}

export function startUnblock(gameState: GameState, playerId: string): Action | null {
  const target = canUnblock(gameState, playerId)
  if (!target) return null

  return {
    playerId,
    type: "unblock",
    target,
    progress: 0,
    duration: 10000, 
  }
}

export function updateAction(action: Action, deltaTime: number): Action {
  return {
    ...action,
    progress: Math.min(action.progress + deltaTime, action.duration),
  }
}

export function completeContamination(gameState: GameState, action: Action): GameState {
  if (!action.target) return gameState

  const newState = { ...gameState }
  const trash = newState.trashCans.find((t) => t.position.x === action.target!.x && t.position.y === action.target!.y)

  if (trash) {
    trash.isDirty = true
    trash.dirtyTime = Date.now()

   
    newState.map = newState.map.map((row, y) =>
      row.map((cell, x) => {
        if (x === action.target!.x && y === action.target!.y && cell === 2) {
          return 3
        }
        return cell
      }),
    )

    const pccPositions = [
      { x: 4, y: 0 },
      { x: 12, y: 2 },
      { x: 0, y: 7 },
    ]

    const allPCCsContaminated = pccPositions.every((pcc) => {
      const pccTrash = newState.trashCans.find((t) => t.position.x === pcc.x && t.position.y === pcc.y)
      return pccTrash && pccTrash.isDirty
    })

    if (allPCCsContaminated && !newState.criticalBlockActive) {
      newState.criticalBlockActive = true
      newState.dumpBlocked = true
      newState.blockTimer = 20 

      
      newState.map = newState.map.map((row, y) =>
        row.map((cell, x) => {
          if ((x === 14 && y === 0) || (x === 14 && y === 1)) {
            return 8 
          }
          return cell
        }),
      )

      newState.trashCans = newState.trashCans.map((t) => ({
        ...t,
        isDirty: true,
        dirtyTime: t.isDirty ? t.dirtyTime : Date.now(),
      }))

      newState.map = newState.map.map((row) => row.map((cell) => (cell === 2 ? 3 : cell)))
    }
  }

  return newState
}

export function completeClean(gameState: GameState, action: Action): GameState {
  if (!action.target) return gameState

  const newState = { ...gameState }
  const trash = newState.trashCans.find((t) => t.position.x === action.target!.x && t.position.y === action.target!.y)

  if (trash) {
    trash.isDirty = false
    trash.dirtyTime = 0

  
    newState.map = newState.map.map((row, y) =>
      row.map((cell, x) => {
        if (x === action.target!.x && y === action.target!.y && cell === 3) {
          return 2
        }
        return cell
      }),
    )
  }

  return newState
}

export function completeReport(gameState: GameState, action: Action): GameState {
  const newState = { ...gameState }

  
  const player = newState.players.find((p) => p.id === action.playerId)
  if (!player) return gameState

  if (canReport(newState, action.playerId)) {
    newState.reports += 1
  }

  return newState
}

export function completeUnblock(gameState: GameState, action: Action): GameState {
  if (!action.target) return gameState

  const newState = { ...gameState }

 
  newState.map = newState.map.map((row, y) =>
    row.map((cell, x) => {
      if (x === action.target!.x && y === action.target!.y && cell === 8) {
        return 7 
      }
      return cell
    }),
  )

  const entrance1Blocked = newState.map[0][14] === 8
  const entrance2Blocked = newState.map[1][14] === 8

  if (!entrance1Blocked || !entrance2Blocked) {
    
    newState.criticalBlockActive = false
    newState.dumpBlocked = false
    newState.blockTimer = 0
  }

  return newState
}

export function getKeyPOIsDirtied(gameState: GameState): number {
  return gameState.trashCans.filter((t) => t.isKeyPOI && t.isDirty).length
}

export function canBlockDump(gameState: GameState, playerId: string): boolean {
  const player = gameState.players.find((p) => p.id === playerId)
  if (!player || player.role !== "contaminator") return false

 
  const keyPOIsDirtied = getKeyPOIsDirtied(gameState)
  return keyPOIsDirtied >= 3 && !gameState.dumpBlocked
}

export function startBlockDump(gameState: GameState, playerId: string): Action | null {
  if (!canBlockDump(gameState, playerId)) return null

  return {
    playerId,
    type: "block",
    progress: 0,
    duration: 7000, 
  }
}

export function updateGameState(gameState: GameState, deltaTime: number): GameState {
  const newState = { ...gameState }
  const now = Date.now()

  if (newState.criticalBlockActive && newState.dumpBlocked) {
    newState.blockTimer = Math.max(0, newState.blockTimer - deltaTime / 1000)


    if (newState.blockTimer <= 0) {
      newState.gameOver = true
      newState.winner = "contaminator"
      return newState
    }
  }

 
  newState.trashCans.forEach((trash) => {
    if (trash.isDirty && trash.dirtyTime > 0) {
      const timeDirty = (now - trash.dirtyTime) / 1000

      if (timeDirty >= 15) {
        newState.players.forEach((player) => {
          if (player.role === "cleaner") {
            const distance =
              Math.abs(player.position.x - trash.position.x) + Math.abs(player.position.y - trash.position.y)

            if (distance <= 2) {
              if (!player.isContaminated) {
                player.isContaminated = true
                player.contaminatedTime = now
              }
            }
          }
        })
      }
    }
  })


  newState.players.forEach((player) => {
    if (player.isContaminated && player.contaminatedTime > 0) {
      const timeContaminated = (now - player.contaminatedTime) / 1000

    
      if (timeContaminated >= 8) {
        const healthLoss = Math.floor(timeContaminated - 8)
        player.health = Math.max(0, 10 - healthLoss)
      }
    }

    
    if (isAtHospital(newState, player.id) && player.health < 10) {
      player.health = Math.min(10, player.health + deltaTime / 1000) 
      player.isContaminated = false
      player.contaminatedTime = 0
    }

   
    let nearDirtyTrash = false
    newState.trashCans.forEach((trash) => {
      if (trash.isDirty && trash.dirtyTime > 0) {
        const timeDirty = (now - trash.dirtyTime) / 1000
        const distance = Math.abs(player.position.x - trash.position.x) + Math.abs(player.position.y - trash.position.y)

        if (timeDirty >= 15 && distance <= 2) {
          nearDirtyTrash = true
        }
      }
    })

    if (!nearDirtyTrash && player.isContaminated) {
      player.isContaminated = false
      player.contaminatedTime = 0
    }
  })

  const aliveCleaner = newState.players.find((p) => p.role === "cleaner" && p.health > 0)
  if (!aliveCleaner) {
    newState.gameOver = true
    newState.winner = "contaminator"
    return newState
  }

  
  if (newState.reports >= 5) {
    newState.gameOver = true
    newState.winner = "cleaners"
    return newState
  }

  return newState
}

export function canUnblock(gameState: GameState, playerId: string): Position | null {
  const player = gameState.players.find((p) => p.id === playerId)
  if (!player || player.role !== "cleaner") return null
  if (!gameState.criticalBlockActive) return null


  const dumpEntrances = [
    { x: 14, y: 0 },
    { x: 14, y: 1 },
  ]

  const adjacentPositions = [
    { x: player.position.x, y: player.position.y },
    { x: player.position.x + 1, y: player.position.y },
    { x: player.position.x - 1, y: player.position.y },
    { x: player.position.x, y: player.position.y + 1 },
    { x: player.position.x, y: player.position.y - 1 },
  ]

  for (const pos of adjacentPositions) {
    if (dumpEntrances.some((entrance) => entrance.x === pos.x && entrance.y === pos.y)) {
     
      if (gameState.map[pos.y][pos.x] === 8) {
        return pos
      }
    }
  }

  return null
}

export function isAtHospital(gameState: GameState, playerId: string): boolean {
  const player = gameState.players.find((p) => p.id === playerId)
  if (!player) return false


  const hospitalPos = { x: 4, y: 0 }
  return player.position.x === hospitalPos.x && player.position.y === hospitalPos.y
}
