export type CellType = 0 | 1 | 2 | 3 | 7 | 8

export interface Position {
  x: number
  y: number
}

export interface Player {
  id: string
  position: Position
  role: "cleaner" | "contaminator"
  health: number
  isContaminated: boolean
  contaminatedTime: number
}

export interface TrashCan {
  position: Position
  isDirty: boolean
  dirtyTime: number
  isKeyPOI: boolean
}

export interface GameState {
  map: CellType[][]
  players: Player[]
  trashCans: TrashCan[]
  reports: number
  dumpBlocked: boolean
  blockTimer: number
  gameOver: boolean
  winner: "cleaners" | "contaminator" | null
  criticalBlockActive: boolean
}

export interface Action {
  playerId: string
  type: "contaminate" | "clean" | "report" | "block" | "unblock"
  target?: Position
  progress: number
  duration: number
}
