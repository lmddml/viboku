const size = 9
const boxSize = 3

interface Coordinates {
  row: number
  col: number
}

type Difficulty = 'easy' | 'medium' | 'hard' | 'expert'
type Board = number[][]

type DifficultyConfig = {
  minClues: number
  maxClues: number
}

const difficultyConfigs: Record<Difficulty, DifficultyConfig> = {
  easy: { minClues: 36, maxClues: 49 },
  medium: { minClues: 32, maxClues: 35 },
  hard: { minClues: 26, maxClues: 31 },
  expert: { minClues: 17, maxClues: 25 }
}

const digits = Array.from({ length: size }, (_, index) => index + 1)

const createEmptyBoard = (): Board => Array.from({ length: size }, () => Array<number>(size).fill(0))

const cloneBoard = (board: Board): Board => board.map(row => [...row])

const shuffle = <T>(input: T[]): T[] => {
  const array = [...input]
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = array[i]
    array[i] = array[j]
    array[j] = temp
  }
  return array
}

const isSafe = (board: Board, row: number, col: number, value: number): boolean => {
  for (let i = 0; i < size; i += 1) {
    if (board[row][i] === value || board[i][col] === value) {
      return false
    }
  }

  const boxRowStart = Math.floor(row / boxSize) * boxSize
  const boxColStart = Math.floor(col / boxSize) * boxSize

  for (let r = 0; r < boxSize; r += 1) {
    for (let c = 0; c < boxSize; c += 1) {
      if (board[boxRowStart + r][boxColStart + c] === value) {
        return false
      }
    }
  }

  return true
}

const fillBoard = (board: Board, cellIndex = 0): boolean => {
  if (cellIndex >= size * size) {
    return true
  }

  const row = Math.floor(cellIndex / size)
  const col = cellIndex % size

  if (board[row][col] !== 0) {
    return fillBoard(board, cellIndex + 1)
  }

  for (const value of shuffle(digits)) {
    if (isSafe(board, row, col, value)) {
      board[row][col] = value
      if (fillBoard(board, cellIndex + 1)) {
        return true
      }
    }
  }

  board[row][col] = 0
  return false
}

const generateCompleteBoard = (): Board => {
  const board = createEmptyBoard()
  const success = fillBoard(board)
  if (!success) {
    throw new Error('Failed to generate a complete Sudoku board')
  }
  return board
}

const findEmptyCell = (board: Board): Coordinates | null => {
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (board[row][col] === 0) {
        return { row, col }
      }
    }
  }
  return null
}

const countSolutions = (board: Board, limit = 2): number => {
  const emptyCell = findEmptyCell(board)
  if (!emptyCell) {
    return 1
  }

  const { row, col } = emptyCell
  let solutions = 0

  for (const value of digits) {
    if (!isSafe(board, row, col, value)) {
      continue
    }

    board[row][col] = value
    solutions += countSolutions(board, limit)
    board[row][col] = 0

    if (solutions >= limit) {
      break
    }
  }

  return solutions
}

const determineTargetClueCount = (config: DifficultyConfig): number => {
  if (config.maxClues <= config.minClues) {
    return config.minClues
  }
  const span = config.maxClues - config.minClues + 1
  return config.minClues + Math.floor(Math.random() * span)
}

const generatePuzzle = (difficulty: Difficulty): { puzzle: Board; solution: Board } => {
  const solution = generateCompleteBoard()
  const puzzle = cloneBoard(solution)
  const config = difficultyConfigs[difficulty]
  const desiredClues = determineTargetClueCount(config)
  let currentClues = size * size

  const positions = shuffle(Array.from({ length: size * size }, (_, index) => index))

  for (const position of positions) {
    if (currentClues <= desiredClues) {
      break
    }

    const row = Math.floor(position / size)
    const col = position % size
    const value = puzzle[row][col]

    if (value === 0) {
      continue
    }

    if (currentClues - 1 < config.minClues) {
      continue
    }

    puzzle[row][col] = 0

    const puzzleCopy = cloneBoard(puzzle)
    const solutionCount = countSolutions(puzzleCopy, 2)

    if (solutionCount === 1) {
      currentClues -= 1
      continue
    }

    puzzle[row][col] = value
  }

  return { puzzle, solution }
}

const formatBoard = (board: Board): string => board
  .map(row => row.map(value => (value === 0 ? '.' : value.toString())).join(' '))
  .join('\n')

const isDifficulty = (value: string): value is Difficulty => value in difficultyConfigs

const parseDifficulty = (raw?: string): Difficulty => {
  if (!raw) {
    return 'medium'
  }

  const candidate = raw.toLowerCase()
  if (isDifficulty(candidate)) {
    return candidate
  }

  throw new Error(`Unsupported difficulty: ${raw}`)
}

const run = () => {
  const [, , difficultyArg] = process.argv

  let difficulty: Difficulty
  try {
    difficulty = parseDifficulty(difficultyArg)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error(message)
    console.error('Valid difficulties: easy, medium, hard, expert')
    process.exitCode = 1
    return
  }

  const { puzzle, solution } = generatePuzzle(difficulty)
  const clueCount = puzzle.flat().filter(value => value !== 0).length

  console.log(`Difficulty: ${difficulty}`)
  console.log(`Clues: ${clueCount}`)
  console.log('\nPuzzle:')
  console.log(formatBoard(puzzle))
  console.log('\nSolution:')
  console.log(formatBoard(solution))
}

run()
