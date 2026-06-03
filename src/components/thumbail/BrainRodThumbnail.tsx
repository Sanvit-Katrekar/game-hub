'use client';

const CELL = 10;
const GAP = 1;
const BOARD_ROWS = 4;
const BOARD_COLS = 5;
const BLACK_CELLS = new Set(['0,0', '0,4', '1,4']);

// Preview pieces shown in thumbnail
const PREVIEW_FILLS: Record<string, string> = {
                      '0,1': '#d4641a', '0,2': '#2d8a4e', '0,3': '#2d8a4e',
  '1,0': '#3a7fc1', '1,1': '#d4641a', '1,2': '#2d8a4e', '1,3': '#2d8a4e',
  '2,0': '#3a7fc1', '2,1': '#d4641a', '2,2': '#d4641a', '2,3': '#2d8a4e', '2,4': '#7a9a20',
  '3,0': '#3a7fc1', '3,1': '#d4641a', '3,2': '#7a9a20', '3,3': '#7a9a20', '3,4': '#7a9a20',
};

// green: 2d8a4e
// orange: d4641a
// green: 2d8a4e
// lime: 7a9a20

export function BrainRodThumbnail({ size = 64 }: { size?: number }) {
  const W = BOARD_COLS * (CELL + GAP) - GAP;
  const H = BOARD_ROWS * (CELL + GAP) - GAP;
  const scale = size / Math.max(W, H);

  return (
    <svg
      width={W * scale}
      height={H * scale}
      viewBox={`0 0 ${W} ${H}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {Array.from({ length: BOARD_ROWS }, (_, r) =>
        Array.from({ length: BOARD_COLS }, (_, c) => {
          const key = `${r},${c}`;
          const isBlack = BLACK_CELLS.has(key);
          const fill = isBlack ? '#1a1a22' : (PREVIEW_FILLS[key] ?? '#2a2a35');
          return (
            <rect
              key={key}
              x={c * (CELL + GAP)}
              y={r * (CELL + GAP)}
              width={CELL}
              height={CELL}
              rx={1.5}
              fill={fill}
            />
          );
        })
      )}
    </svg>
  );
}
