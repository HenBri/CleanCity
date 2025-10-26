import type { GameState, Action, Position } from "@/types/game"

export function canContaminate(gameState: GameState, playerId: string): Position | null {
  const player = gameState.players.find((p) => p.id === playerId)
  if (!player || player.role !== "contaminator") return null

  // Check adjacent cells for clean trash cans
  const adjacentPositions = [
    { x: player.position.x, y: player.position.y }, // Same cell
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

  // Check adjacent cells for dirty trash cans
  const adjacentPositions = [
    { x: player.position.x, y: player.position.y }, // Same cell
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

  // Find the contaminator
  const contaminator = gameState.players.find((p) => p.role === "contaminator")
  if (!contaminator) return false

  // Check if contaminator is adjacent
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
    duration: 5000, // 5 seconds
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
    duration: 5000, // 5 seconds
  }
}

export function startReport(gameState: GameState, playerId: string): Action | null {
  if (!canReport(gameState, playerId)) return null

  return {
    playerId,
    type: "report",
    progress: 0,
    duration: 2000, // 2 seconds to take photo
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
    duration: 10000, // 10 seconds
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

    // Update map
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
      newState.blockTimer = 20 // 20 seconds to win

      // Block dump entrances [14, 0] and [14, 1]
      newState.map = newState.map.map((row, y) =>
        row.map((cell, x) => {
          if ((x === 14 && y === 0) || (x === 14 && y === 1)) {
            return 8 // Blocked
          }
          return cell
        }),
      )

      // Contaminate ALL trash cans
      newState.trashCans = newState.trashCans.map((t) => ({
        ...t,
        isDirty: true,
        dirtyTime: t.isDirty ? t.dirtyTime : Date.now(),
      }))

      // Update map to show all trash as dirty
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

    // Update map
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

  // Check if contaminator is still adjacent and performing contamination action
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

  // Unblock the dump entrance
  newState.map = newState.map.map((row, y) =>
    row.map((cell, x) => {
      if (x === action.target!.x && y === action.target!.y && cell === 8) {
        return 7 // Change back to path
      }
      return cell
    }),
  )

  // Check if at least one entrance is unblocked
  const entrance1Blocked = newState.map[0][14] === 8
  const entrance2Blocked = newState.map[1][14] === 8

  if (!entrance1Blocked || !entrance2Blocked) {
    // Stop critical blocking
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

  // Check if 3 key POIs are dirtied
  const keyPOIsDirtied = getKeyPOIsDirtied(gameState)
  return keyPOIsDirtied >= 3 && !gameState.dumpBlocked
}

export function startBlockDump(gameState: GameState, playerId: string): Action | null {
  if (!canBlockDump(gameState, playerId)) return null

  return {
    playerId,
    type: "block",
    progress: 0,
    duration: 7000, // 7 seconds
  }
}

export function updateGameState(gameState: GameState, deltaTime: number): GameState {
  const newState = { ...gameState }
  const now = Date.now()

  if (newState.criticalBlockActive && newState.dumpBlocked) {
    newState.blockTimer = Math.max(0, newState.blockTimer - deltaTime / 1000)

    // Check if contaminator wins
    if (newState.blockTimer <= 0) {
      newState.gameOver = true
      newState.winner = "contaminator"
      return newState
    }
  }

  // Update passive contamination
  newState.trashCans.forEach((trash) => {
    if (trash.isDirty && trash.dirtyTime > 0) {
      const timeDirty = (now - trash.dirtyTime) / 1000

      // After 15 seconds, start contaminating nearby players
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

  // Update contaminated players health
  newState.players.forEach((player) => {
    if (player.isContaminated && player.contaminatedTime > 0) {
      const timeContaminated = (now - player.contaminatedTime) / 1000

      // After 8 seconds of being contaminated, start losing health
      if (timeContaminated >= 8) {
        const healthLoss = Math.floor(timeContaminated - 8)
        player.health = Math.max(0, 10 - healthLoss)
      }
    }

    // Check if at hospital and heal
    if (isAtHospital(newState, player.id) && player.health < 10) {
      player.health = Math.min(10, player.health + deltaTime / 1000) // Heal 1 HP per second (5 HP in 5 seconds)
      player.isContaminated = false
      player.contaminatedTime = 0
    }

    // Remove contamination if not near dirty trash
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

  // Check if all cleaners are dead
  const aliveCleaner = newState.players.find((p) => p.role === "cleaner" && p.health > 0)
  if (!aliveCleaner) {
    newState.gameOver = true
    newState.winner = "contaminator"
    return newState
  }

  // Check if cleaners win (5 reports)
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

  // Check if adjacent to blocked dump entrance [14, 0] or [14, 1]
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
      // Check if this entrance is blocked (value 8)
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

  // Hospital is at position (4, 0) - one of the key POIs
  const hospitalPos = { x: 4, y: 0 }
  return player.position.x === hospitalPos.x && player.position.y === hospitalPos.y
}
