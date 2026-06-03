export type Cell = [number, number];

export interface Piece {
  id: string;
  label: string;
  color: string;
  cells: Cell[];
}

export interface PlacedPiece {
  pieceId: string;
  cells: Cell[]; // absolute board cells
}

export interface PuzzleRound {
  id: string;
  difficulty: string;
  pieceIds: string[];
}

export interface PuzzleConfig {
  boardRows: number;
  boardCols: number;
  blackCells: string[]; // "r,c"
  rounds: PuzzleRound[];
}

// All available pieces
export const ALL_PIECES: Piece[] = [
  {
    id: 'square-tail',
    label: 'Square Tail',
    color: '#2d8a4e',
    cells: [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0]],
  },
  {
    id: 'square-tail-mirr',
    label: 'Square Tail',
    color: '#2d8a4e',
    cells: [[0, 0], [0, 1], [1, 0], [1, 1], [2, 1]],
  },
  {
    id: 'bar-4',
    label: 'Bar 4',
    color: '#8b5e15',
    cells: [[0, 0], [1, 0], [2, 0], [3, 0]],
  },
  {
    id: 'bar-3',
    label: 'Bar 3',
    color: '#3da8d4',
    cells: [[0, 0], [1, 0], [2, 0]],
  },
  {
    id: 'bar-2',
    label: 'Bar 2',
    color: '#9b59b6',
    cells: [[0, 0], [1, 0]],
  },
  {
    id: 'zigzag-short',
    label: 'Zigzag Short',
    color: '#3a7fc1',
    cells: [[0, 0], [1, 0], [1, 1], [2, 1]],
  },
  {
    id: 'zigzag-short-mirr',
    label: 'Zigzag Short',
    color: '#3a7fc1',
    cells: [[0, 1], [1, 0], [1, 1], [2, 0]],
  },
  {
    id: 'zigzag-long',
    label: 'Zigzag Long',
    color: '#e8c019',
    cells: [[0, 0], [1, 0], [1, 1], [1, 2], [2, 2]],
  },
  {
    id: 'zigzag-long-mirr',
    label: 'Zigzag Long',
    color: '#f4d454',
    cells: [[2, 0], [1, 0], [1, 1], [1, 2], [0, 2]],
  },
  {
    id: 'hook',
    label: 'Hook',
    color: '#2c3e7a',
    cells: [[0, 0], [0, 1], [1, 1]]
  },
  {
    id: 'l-short',
    label: 'L Short',
    color: '#7a9a20',
    cells: [[0, 1], [1, 1], [2, 1], [2, 0]],
  },
  {
    id: 'l-short-mirr',
    label: 'L Short',
    color: '#7a9a20',
    cells: [[0, 0], [1, 0], [2, 0], [2, 1]],
  },
  {
    id: 'l-long',
    label: 'L Long',
    color: '#c0306a',
    cells: [[0, 1], [1, 1], [2, 1], [3, 1], [3, 0]],
  },
  {
    id: 'l-long-mirr',
    label: 'L Long',
    color: '#c0306a',
    cells: [[0, 0], [1, 0], [2, 0], [3, 0], [3, 1]],
  },
  {
    id: 'bar-tail',
    label: 'Bar Tail',
    color: '#d4641a',
    cells: [[0, 0], [1, 0], [2, 0], [3, 0], [1, 1]],
  },
  {
    id: 'bar-tail-mirr',
    label: 'Bar Tail',
    color: '#d4641a',
    cells: [[0, 1], [1, 1], [2, 1], [3, 1], [1, 0]],
  },
  {
    id: 't-short',
    label: 'T Short',
    color: '#e8c019',
    cells: [[0, 0], [1, 0], [1, 1], [2, 0]],
  }
];


export function rotateCells(cells: Cell[], times: number): Cell[] {
  let c: Cell[] = cells.map(([r, col]) => [r, col]);
  for (let i = 0; i < times; i++) {
    c = c.map(([r, col]) => [col, -r] as Cell);
  }
  const minR = Math.min(...c.map((x) => x[0]));
  const minC = Math.min(...c.map((x) => x[1]));
  return c.map(([r, col]) => [r - minR, col - minC]);
}

export function cellKey(r: number, c: number) {
  return `${r},${c}`;
}

export function totalActiveCells(config: PuzzleConfig) {
  return config.boardRows * config.boardCols - config.blackCells.length;
}

export function getPiecesForRound(config: PuzzleConfig, roundIndex: number): Piece[] {
  const round = config.rounds[roundIndex];
  if (!round) return [];
  return round.pieceIds
    .map((id) => ALL_PIECES.find((p) => p.id === id))
    .filter(Boolean) as Piece[];
}


export interface PuzzleMeta {
  id: string;
  name: string;
  description: string;
  config: PuzzleConfig;
}

export const ALL_PUZZLES: PuzzleMeta[] = [
  {
    id: 'friend-and-found',
    name: 'Fried and Found ',
    description: 'Lost pieces, found solutions · 5 rounds',
    config: {
      boardRows: 4,
      boardCols: 5,
      blackCells: ['0,0', '0,4', '1,4'],
      rounds: [
        {
          id: 'round-1',
          difficulty: 'Easy',
          pieceIds: ['bar-3', 'square-tail-mirr', 'zigzag-long-mirr', 'bar-4'],
        },
        {
          id: 'round-2',
          difficulty: 'Easy',
          pieceIds: ['t-short', 'l-short', 'square-tail', 'zigzag-short']
        },
        {
          id: 'round-3',
          difficulty: 'Easy',
          pieceIds: ['bar-3', 'square-tail', 'l-long', 'bar-4'],
        },
        {
          id: 'round-4',
          difficulty: 'Medium',
          pieceIds: ['zigzag-short-mirr', 'square-tail', 'hook', 'bar-tail'],
        },
        {
          id: 'round-5',
          difficulty: 'Hard',
          pieceIds: ['square-tail', 'bar-3', 'zigzag-long', 'l-short']
        }
      ],
    }
  },
  {
    id: 'glazed-puzzles',
    name: 'Glazed Puzzles',
    description: 'Smooth on the surface, tricky underneath · 1 round',
    config: {
      boardRows: 4,
      boardCols: 5,
      blackCells: ['0,4', '1,0', '2,0','2,1', '2,4', '3,0', '3,4'],
      rounds: [
        {
          id: 'round-1',
          difficulty: 'Easy',
          pieceIds: ['t-short', 'zigzag-short-mirr', 'hook', 'bar-2'],
        },
        {
          id: 'round-2',
          difficulty: 'Easy',
          pieceIds: ['bar-3', 'bar-2', 'hook', 'bar-tail'],         
        }
      ],
    }
  },
  {
    id: 'cooked-clues',
    name: 'Cooked Clues',
    description: 'The hints are in the heat · 1 round',
    config: {
      boardRows: 5,
      boardCols: 5,
      blackCells: ['0,0', '0,3', '0,4', '1,0', '1,3', '1,4', '2,0', '3,4', '4,4'],
      rounds: [
        {
          id: 'round-1',
          difficulty: 'Easy',
          pieceIds: ['square-tail-mirr', 'zigzag-long', 'l-short', 'bar-2'],
        },
        {
          id: 'round-2',
          difficulty: 'Medium',
          pieceIds: ['square-tail', 'l-short', 'bar-2', 'bar-tail'],
        },
        {
          id: 'round-3',
          difficulty: 'Medium',
          pieceIds: ['t-short', 'zigzag-long', 'bar-tail', 'bar-2'],
        },
        {
          id: 'round-4',
          difficulty: 'Medium',
          pieceIds: ['square-tail-mirr', 'bar-4', 'hook', 'zigzag-short'],
        },
        {
          id: 'round-5',
          difficulty: 'Hard',
          pieceIds: ['l-long', 'zigzag-short', 'l-short', 'bar-3'],
        },
      ],
    }
  },
  {
    id: '404-brain-not-found',
    name: '404: Brain Not Found',
    description: 'Error: logic.exe has stopped responding · 1 round',
    config: {
      boardRows: 5,
      boardCols: 4,
      blackCells: ['0,0', '0,1', '0,2', '2,0', '3,0', '4,0', '4,3'],
      rounds: [
        {
          id: 'round-1',
          difficulty: 'Easy',
          pieceIds: ['square-tail', 'bar-3', 'hook', 'bar-2'],
        },
      ],
    }
  },
  {
    id: 'fully-cooked',
    name: 'Fully Cooked',
    description: 'No half measures, go all the way · 1 round',
    config: {
      boardRows: 5,
      boardCols: 5,
      blackCells: ['1,4', '2,4', '3,4','4,0', '4,2', '4,3', '4,4'],
      rounds: [
        {
          id: 'round-1',
          difficulty: 'Medium',
          pieceIds: ['bar-4', 'square-tail', 'zigzag-short-mirr', 'l-long'],
        },
        {
          id: 'round-2',
          difficulty: 'Hard',
          pieceIds: ['bar-tail-mirr', 'zigzag-long-mirr', 't-short', 'bar-4'],
        },
      ],
    }
  },
];
