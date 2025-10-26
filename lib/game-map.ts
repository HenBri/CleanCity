import type { CellType, Position, TrashCan } from "@/types/game"

export const GAME_MAP: CellType[][] = [
  [1, 1, 0, 0, 2, 1, 0, 1, 1, 1, 1, 0, 1, 1, 7, 1],
  [0, 0, 0, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 7, 1],
  [1, 0, 0, 0, 1, 1, 0, 1, 1, 1, 1, 0, 2, 1, 1, 1],
  [1, 0, 0, 0, 1, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0],
  [1, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 1],
  [1, 0, 1, 1, 1, 1, 0, 2, 1, 0, 1, 1, 1, 1, 0, 1],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [2, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1],
  [1, 1, 1, 0, 1, 0, 0, 0, 0, 0, 1, 1, 2, 0, 1, 1],
  [1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 1, 0, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1],
  [0, 0, 1, 0, 2, 1, 1, 2, 0, 0, 0, 0, 2, 0, 0, 1],
  [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1],
  [0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1],
]

export const CELL_SIZE = 32

export function isWalkable(map: CellType[][], pos: Position): boolean {
  if (pos.y < 0 || pos.y >= map.length || pos.x < 0 || pos.x >= map[0].length) {
    return false
  }
  const cell = map[pos.y][pos.x]
  return cell === 0 || cell === 2 || cell === 3 || cell === 7
}

export function getTrashCans(map: CellType[][]): TrashCan[] {
  const trashCans: TrashCan[] = []

  const keyPOIs = [
    { x: 4, y: 0 }, // [0, 4]
    { x: 12, y: 2 }, // [2, 12]
    { x: 0, y: 7 }, // [7, 0]
  ]

  for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[y].length; x++) {
      if (map[y][x] === 2 || map[y][x] === 3) {
        const isKey = keyPOIs.some((poi) => poi.x === x && poi.y === y)
        trashCans.push({
          position: { x, y },
          isDirty: map[y][x] === 3,
          dirtyTime: 0,
          isKeyPOI: isKey,
        })
      }
    }
  }

  return trashCans
}

export function getCellColor(cell: CellType): string {
  switch (cell) {
    case 0:
      return "#a8d5ba" // Walkable - light green
    case 1:
      return "#5a5a5a" // Building - gray
    case 2:
      return "#4caf50" // Clean trash - green
    case 3:
      return "#f44336" // Dirty trash - red
    case 7:
      return "#90ee90" // Dump entrance - light green
    case 8:
      return "#8b0000" // Blocked entrance - dark red
    default:
      return "#ffffff"
  }
}
