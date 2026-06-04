'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, RotateCcw, Settings, Star, ChevronRight, Plus, Trash2, X, Check, Timer } from 'lucide-react';
import {
  ALL_PIECES, Piece, PuzzleConfig, PuzzleRound,
  rotateCells, cellKey, getPiecesForRound,
  ALL_PUZZLES, PuzzleMeta,
} from '@/lib/brainrod';
import { useRouter } from 'next/navigation';

// ── Timer hook ─────────────────────────────────────────────────────────────
// All mutable state lives in a single ref object so every function always
// reads the latest values regardless of when the function was created.
// The returned start/stop/reset functions have stable identity — safe to use
// in useCallback/useEffect dep arrays without causing re-renders.

function useTimer() {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);

  // All mutable timer state in one place
  const s = useRef({ startedAt: null as number | null, raf: null as number | null });

  const tick = useRef(function loop() {
    if (s.current.startedAt !== null) {
      setElapsed(Date.now() - s.current.startedAt);
      s.current.raf = requestAnimationFrame(loop);
    }
  });

  const start = useRef(() => {
    if (s.current.raf) cancelAnimationFrame(s.current.raf);
    s.current.startedAt = Date.now();
    s.current.raf = requestAnimationFrame(tick.current);
    setElapsed(0);
    setRunning(true);
  });

  // stop() returns the final elapsed milliseconds
  const stop = useRef((): number => {
    if (s.current.raf) cancelAnimationFrame(s.current.raf);
    s.current.raf = null;
    const finalMs = s.current.startedAt !== null ? Date.now() - s.current.startedAt : 0;
    s.current.startedAt = null;
    setRunning(false);
    return finalMs;
  });

  const reset = useRef(() => {
    if (s.current.raf) cancelAnimationFrame(s.current.raf);
    s.current.raf = null;
    s.current.startedAt = null;
    setElapsed(0);
    setRunning(false);
  });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => { if (s.current.raf) cancelAnimationFrame(s.current.raf); };
  }, []);

  return { elapsed, running, start: start.current, stop: stop.current, reset: reset.current };
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const centiseconds = Math.floor((ms % 1000) / 10);
  if (minutes > 0) {
    return `${minutes}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
  }
  return `${seconds}.${String(centiseconds).padStart(2, '0')}s`;
}

// ── Board ──────────────────────────────────────────────────────────────────

function PieceSvg({ piece, scale = 1 }: { piece: Piece; scale?: number }) {
  const cells = piece.cells;
  const maxR = Math.max(...cells.map(x => x[0]));
  const maxC = Math.max(...cells.map(x => x[1]));
  const cs = 16 * scale, g = 2 * scale;
  const W = (maxC + 1) * (cs + g) - g;
  const H = (maxR + 1) * (cs + g) - g;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      {cells.map(([r, c], i) => (
        <rect key={i} x={c*(cs+g)} y={r*(cs+g)} width={cs} height={cs} rx={2} fill={piece.color} />
      ))}
    </svg>
  );
}

interface BoardState {
  [key: string]: string | null;
}

function Board({
  config,
  boardState,
  selectedPiece,
  selectedRot,
  onCellClick,
  onCellRightClick,
  onCellTouchStart,
  onCellTouchEnd,
  cellSize,
  previewCells,
  previewValid,
  onHoverCell
}: {
  config: PuzzleConfig;
  boardState: BoardState;
  selectedPiece: Piece | null;
  selectedRot: number;
  onCellClick: (r: number, c: number) => void;
  onCellRightClick: (r: number, c: number) => void;
  onCellTouchStart?: (r: number, c: number) => void;
  onCellTouchEnd?: () => void;
  cellSize?: number;
  previewCells: Set<string>;
  previewValid: boolean;
  onHoverCell: (key: string | null) => void;
}) {
  const blackSet = new Set(config.blackCells);
  const CELL_PX = cellSize ?? 32;
  const GAP = 2;

  const pieceColors: Record<string, string> = {};
  ALL_PIECES.forEach(p => { pieceColors[p.id] = p.color; });

  const W = config.boardCols * (CELL_PX + GAP) - GAP;
  const H = config.boardRows * (CELL_PX + GAP) - GAP;

  return (
    <div
      style={{ position: 'relative', width: W, height: H }}
      onMouseLeave={() => onHoverCell(null)}
    >
      {Array.from({ length: config.boardRows }, (_, r) =>
        Array.from({ length: config.boardCols }, (_, c) => {
          const key = cellKey(r, c);
          const isBlack = blackSet.has(key);
          const filledBy = boardState[key];
          const isPreview = previewCells.has(key);

          let bg = '#4a4a62' // '#22222c';
          if (isBlack) bg = '#0e0e12';
          else if (filledBy) bg = pieceColors[filledBy] ?? '#555';
          else if (isPreview && previewValid) bg = (selectedPiece?.color ?? '#555') + 'aa';
          else if (isPreview && !previewValid) bg = '#ff4444aa';

          return (
            <motion.div
              key={key}
              layout
              style={{
                position: 'absolute',
                left: c * (CELL_PX + GAP),
                top: r * (CELL_PX + GAP),
                width: CELL_PX,
                height: CELL_PX,
                borderRadius: 6,
                background: bg,
                border: isBlack ? 'none' : `1px solid ${filledBy ? 'transparent' : '#2e2e3d'}`,
                cursor: isBlack ? 'default' : filledBy ? 'context-menu' : selectedPiece ? 'crosshair' : 'default',
                touchAction: 'none',
              }}
              onMouseEnter={() => !isBlack && onHoverCell(key)}
              onClick={() => !isBlack && onCellClick(r, c)}
              onContextMenu={e => { e.preventDefault(); !isBlack && onCellRightClick(r, c); }}
              onTouchStart={e => {
                if (isBlack) return;
                e.preventDefault();
                onHoverCell(key);
                onCellTouchStart?.(r, c);
              }}
              onTouchEnd={() => onCellTouchEnd?.()}
              onTouchCancel={() => onCellTouchEnd?.()}
              onTouchMove={() => onCellTouchEnd?.()}
            />
          );
        })
      )}
    </div>
  );
}

// ── Puzzle Picker ──────────────────────────────────────────────────────────

function BoardPreview({ config, size = 80 }: { config: PuzzleConfig; size?: number }) {
  const { boardRows, boardCols, blackCells } = config;
  const blackSet = new Set(blackCells);
  const cellPx = Math.floor((size - (boardCols - 1) * 2) / boardCols);
  const gap = 2;
  const W = boardCols * (cellPx + gap) - gap;
  const H = boardRows * (cellPx + gap) - gap;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      {Array.from({ length: boardRows }, (_, r) =>
        Array.from({ length: boardCols }, (_, c) => {
          const key = cellKey(r, c);
          const isBlack = blackSet.has(key);
          return (
            <rect
              key={key}
              x={c * (cellPx + gap)}
              y={r * (cellPx + gap)}
              width={cellPx}
              height={cellPx}
              rx={2}
              fill={isBlack ? '#080809' : '#4a4a62'}
            />
          );
        })
      )}
    </svg>
  );
}

function PuzzlePicker({ onSelect }: { onSelect: (meta: PuzzleMeta) => void }) {
  const router = useRouter();
  const handleBack = () => router.push("/");

  return (
    <div className="flex flex-col select-none my-auto" style={{ background: 'var(--bg)' }}>
      <header
        className="sticky top-0 z-40 backdrop-blur-xl"
        style={{ background: 'rgba(14,14,18,0.9)', borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center px-4 sm:px-6 py-3">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 min-h-[44px] pr-6 touch-manipulation cursor-pointer"
            style={{ color: 'var(--muted)' }}
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="font-display font-800 text-xl" style={{ color: 'var(--text)' }}>
            BrainRod
          </h1>
        </div>
      </header>

      <main className="flex flex-col items-center justify-center px-16 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <p className="text-xs uppercase tracking-widest mb-6 text-center" style={{ color: 'var(--muted)' }}>
            Choose a puzzle
          </p>
          <div className="flex flex-col gap-4">
            {ALL_PUZZLES.map((meta, i) => (
              <motion.button
                key={meta.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onSelect(meta)}
                className="flex items-center gap-5 w-full rounded-2xl p-5 text-left"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <div className="shrink-0 flex items-center justify-center" style={{ width: 72 }}>
                  <BoardPreview config={meta.config} size={72} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-700 text-base mb-1" style={{ color: 'var(--text)' }}>
                    {meta.name}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>
                    {meta.description}
                  </p>
                  <div className="flex items-center gap-1.5 mt-3">
                    {meta.config.rounds.map((_, ri) => (
                      <div key={ri} className="w-2 h-2 rounded-full bg-[#4a4a62]" />
                    ))}
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: 'var(--muted)', flexShrink: 0 }} />
              </motion.button>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
}

// ── Round Editor Modal ─────────────────────────────────────────────────────

function RoundEditor({ config, onSave, onClose }: {
  config: PuzzleConfig;
  onSave: (cfg: PuzzleConfig) => void;
  onClose: () => void;
}) {
  const [rounds, setRounds] = useState<PuzzleRound[]>(JSON.parse(JSON.stringify(config.rounds)));
  const [activeRound, setActiveRound] = useState(0);

  const togglePiece = (pid: string) => {
    setRounds(prev => prev.map((r, i) => {
      if (i !== activeRound) return r;
      const has = r.pieceIds.includes(pid);
      return { ...r, pieceIds: has ? r.pieceIds.filter(x => x !== pid) : [...r.pieceIds, pid] };
    }));
  };

  const addRound = () => {
    const newRound: PuzzleRound = { id: `round-${Date.now()}`, difficulty: `Round ${rounds.length + 1}`, pieceIds: [] };
    setRounds(prev => [...prev, newRound]);
    setActiveRound(rounds.length);
  };

  const removeRound = (i: number) => {
    if (rounds.length <= 1) return;
    setRounds(prev => prev.filter((_, j) => j !== i));
    setActiveRound(Math.max(0, activeRound - 1));
  };

  const activePieceIds = rounds[activeRound]?.pieceIds ?? [];

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-2xl rounded-2xl overflow-hidden"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="font-display font-700 text-lg" style={{ color: 'var(--text)' }}>Configure Rounds</h2>
          <button onClick={onClose} style={{ color: 'var(--muted)' }}><X size={18} /></button>
        </div>
        <div className="flex" style={{ flex: 1, overflow: 'hidden' }}>
          <div className="flex flex-col py-4 px-3 gap-1" style={{ width: 160, borderRight: '1px solid var(--border)', overflowY: 'auto' }}>
            {rounds.map((r, i) => (
              <div
                key={r.id}
                className="flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-sm"
                style={{
                  background: i === activeRound ? 'var(--surface2)' : 'transparent',
                  color: i === activeRound ? 'var(--text)' : 'var(--muted)',
                  fontFamily: 'Syne, sans-serif', fontWeight: 600,
                }}
                onClick={() => setActiveRound(i)}
              >
                <span>{r.difficulty}</span>
                {rounds.length > 1 && (
                  <button onClick={e => { e.stopPropagation(); removeRound(i); }} style={{ color: 'var(--muted)', opacity: 0.6 }}>
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={addRound}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm mt-1"
              style={{ color: 'var(--muted)', background: 'transparent', border: '1px dashed var(--border)' }}
            >
              <Plus size={12} /> Round
            </button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto">
            <p className="text-xs mb-3 uppercase tracking-widest font-500" style={{ color: 'var(--muted)' }}>
              {rounds[activeRound]?.difficulty} — select pieces ({activePieceIds.length} selected)
            </p>
            <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))' }}>
              {ALL_PIECES.map(piece => {
                const selected = activePieceIds.includes(piece.id);
                return (
                  <div
                    key={piece.id}
                    onClick={() => togglePiece(piece.id)}
                    className="rounded-xl p-3 flex flex-col items-center gap-2 cursor-pointer transition-all"
                    style={{
                      background: selected ? piece.color + '22' : 'var(--surface2)',
                      border: `1.5px solid ${selected ? piece.color : 'var(--border)'}`,
                    }}
                  >
                    <PieceSvg piece={piece} scale={1.1} />
                    <span className="text-xs text-center" style={{ color: selected ? piece.color : 'var(--muted)', fontWeight: 500 }}>
                      {piece.label}
                    </span>
                    {selected && <Check size={10} color={piece.color} />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4" style={{ borderTop: '1px solid var(--border)' }}>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm" style={{ color: 'var(--muted)', background: 'var(--surface2)' }}>
            Cancel
          </button>
          <button
            onClick={() => { onSave({ ...config, rounds }); onClose(); }}
            className="px-4 py-2 rounded-lg text-sm font-display font-700"
            style={{ background: 'var(--accent)', color: '#0e0e12' }}
          >
            Save Rounds
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Star Celebration ───────────────────────────────────────────────────────

function StarCelebration({
  onNext,
  isLast,
  solveTimeMs,
}: {
  onNext: () => void;
  isLast: boolean;
  solveTimeMs: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 flex flex-col items-center justify-center"
      style={{ background: 'rgba(14,14,18,0.92)' }}
    >
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: [0, 1.4, 1], rotate: [0, 10, 0] }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="mb-6"
      >
        <Star size={96} fill="#f5c842" color="#f5c842" />
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="font-display font-800 text-4xl mb-2"
        style={{ color: 'var(--accent)' }}
      >
        Solved!
      </motion.h2>

      {/* Solve time */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.45, type: 'spring', stiffness: 200 }}
        className="flex items-center gap-2 px-5 py-2.5 rounded-2xl mb-4"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <Timer size={16} style={{ color: 'var(--muted)' }} />
        <span className="font-display font-700 text-2xl tabular-nums" style={{ color: 'var(--text)' }}>
          {formatTime(solveTimeMs)}
        </span>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55 }}
        className="mb-8 text-sm"
        style={{ color: 'var(--muted)' }}
      >
        {isLast ? 'All rounds complete — amazing!' : 'Get ready for the next round…'}
      </motion.p>

      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65 }}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        onClick={onNext}
        className="flex items-center gap-2 px-6 py-3 rounded-xl font-display font-700 text-sm uppercase tracking-widest"
        style={{ background: 'var(--accent)', color: '#0e0e12' }}
      >
        {isLast ? 'Pick Another Puzzle' : (<>Next Round <ChevronRight size={16} /></>)}
      </motion.button>
    </motion.div>
  );
}

// ── Live Timer Display ─────────────────────────────────────────────────────

function LiveTimer({ elapsed, running }: { elapsed: number; running: boolean }) {
  return (
    <motion.div
      animate={{ opacity: running ? 1 : 0.45 }}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl tabular-nums"
      style={{
        background: 'var(--surface2)',
        border: '1px solid var(--border)',
        minWidth: 80,
      }}
    >
      <Timer size={13} style={{ color: 'var(--muted)', flexShrink: 0 }} />
      <span
        className="font-display font-700 text-sm"
        style={{ color: running ? 'var(--text)' : 'var(--muted)', letterSpacing: '0.02em' }}
      >
        {formatTime(elapsed)}
      </span>
    </motion.div>
  );
}

// ── Game Screen ────────────────────────────────────────────────────────────

function GameScreen({ meta, onBack }: { meta: PuzzleMeta; onBack: () => void }) {
  const [config, setConfig] = useState<PuzzleConfig>(() => JSON.parse(JSON.stringify(meta.config)));
  const [roundIndex, setRoundIndex] = useState(0);
  const [boardState, setBoardState] = useState<BoardState>({});
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);
  const [selectedRot, setSelectedRot] = useState(0);
  const [usedPieces, setUsedPieces] = useState<Set<string>>(new Set());
  const [showEditor, setShowEditor] = useState(false);
  const [showStar, setShowStar] = useState(false);
  const [completedRounds, setCompletedRounds] = useState<number[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [previewCells, setPreviewCells] = useState<Set<string>>(new Set());
  const [previewValid, setPreviewValid] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [solveTimeMs, setSolveTimeMs] = useState(0);

  const timer = useTimer();

  const previewRef = useRef<{ cells: Set<string>; valid: boolean }>({ cells: new Set(), valid: false });
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  // Track whether the timer has been started for this round (starts on first piece placement)
  const timerStarted = useRef(false);

  const pieces = getPiecesForRound(config, roundIndex);
  const selectedPiece = pieces.find(p => p.id === selectedPieceId) ?? null;
  const totalActive = config.boardRows * config.boardCols - config.blackCells.length;
  const isLast = roundIndex === config.rounds.length - 1;

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const resetRound = useCallback(() => {
    setBoardState({});
    setUsedPieces(new Set());
    setSelectedPieceId(null);
    setSelectedRot(0);
    previewRef.current = { cells: new Set(), valid: false };
    setPreviewCells(new Set());
    setPreviewValid(false);
  }, []); // timer.reset is a stable ref — safe without listing in deps

  useEffect(() => { resetRound(); }, [roundIndex, resetRound]);

  const computePlacement = useCallback((hr: number, hc: number): { cells: Set<string>; valid: boolean } => {
    if (!selectedPiece) return { cells: new Set(), valid: false };
    const rotated = rotateCells(selectedPiece.cells, selectedRot);
    const blackSet = new Set(config.blackCells);

    for (const [anchorDr, anchorDc] of rotated) {
      const coords = rotated.map(([dr, dc]) => [hr + (dr - anchorDr), hc + (dc - anchorDc)]);
      const allInBounds = coords.every(([r, c]) => r >= 0 && r < config.boardRows && c >= 0 && c < config.boardCols);
      if (!allInBounds) continue;
      const keys = new Set(coords.map(([r, c]) => cellKey(r, c)));
      const allFree = [...keys].every(k => !blackSet.has(k) && !boardState[k]);
      if (!allFree) continue;
      return { cells: keys, valid: true };
    }
    return { cells: new Set(), valid: false };
  }, [selectedPiece, selectedRot, config, boardState]);

  useEffect(() => {
    const filled = Object.values(boardState).filter(Boolean).length;
    if (filled === totalActive && totalActive > 0) {
      const finalTime = timer.stop();
      setSolveTimeMs(finalTime);
      navigator.vibrate?.(100);
      setTimeout(() => setShowStar(true), 300);
    }
  }, [boardState, totalActive]); // timer.stop is a stable ref

  const handleHoverCell = useCallback((key: string | null) => {
    if (!key) {
      previewRef.current = { cells: new Set(), valid: false };
      setPreviewCells(new Set());
      setPreviewValid(false);
      return;
    }
    const [r, c] = key.split(',').map(Number);
    const result = computePlacement(r, c);
    previewRef.current = result;
    setPreviewCells(result.cells);
    setPreviewValid(result.valid);
  }, [computePlacement]);

  const handleCellClick = useCallback((r: number, c: number) => {
    if (!selectedPiece) return;
    const { cells, valid } = previewRef.current.cells.size > 0 ? previewRef.current : computePlacement(r, c);
    if (!valid || cells.size === 0) return;

    // Start timer on first successful placement
    if (!timerStarted.current) {
      timer.start();
      timerStarted.current = true;
    }

    const next = { ...boardState };
    cells.forEach(k => { next[k] = selectedPiece.id; });
    navigator.vibrate?.(20);
    setBoardState(next);
    setUsedPieces(prev => new Set([...prev, selectedPiece.id]));
    setSelectedPieceId(null);
    setSelectedRot(0);
    previewRef.current = { cells: new Set(), valid: false };
    setPreviewCells(new Set());
    setPreviewValid(false);
  }, [selectedPiece, computePlacement, boardState]); // timer.start is a stable ref

  const removePiece = (pid: string) => {
    const next = { ...boardState };
    Object.keys(next).forEach(k => { if (next[k] === pid) next[k] = null; });
    navigator.vibrate?.(40);
    setBoardState(next);
    setUsedPieces(prev => { const s = new Set(prev); s.delete(pid); return s; });
  };

  const handleReset = () => { setResetKey(k => k + 1); resetRound(); };

  const handleCellRightClick = (r: number, c: number) => {
    const pid = boardState[cellKey(r, c)];
    if (!pid) return;
    removePiece(pid);
  };

  const startLongPress = (r: number, c: number) => {
    longPressTimer.current = setTimeout(() => { handleCellRightClick(r, c); }, 450);
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  const handleNextRound = () => {
    setShowStar(false);
    if (!completedRounds.includes(roundIndex)) {
      setCompletedRounds(prev => [...prev, roundIndex]);
    }
    if (isLast) {
      onBack();
    } else {
      setRoundIndex(prev => prev + 1);
    }
    timer.reset();
    timerStarted.current = false;
  };

  const handleSaveConfig = (newConfig: PuzzleConfig) => {
    setConfig(newConfig);
    setRoundIndex(0);
    setCompletedRounds([]);
    resetRound();
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Space') { e.preventDefault(); setSelectedRot(prev => (prev + 1) % 4); }
      if (e.key === 'Escape') { setSelectedPieceId(null); setSelectedRot(0); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div
      className="flex flex-col select-none"
      style={{ background: 'var(--bg)', WebkitTapHighlightColor: 'transparent' }}
    >
      {/* HEADER */}
      <header
        className="sticky top-0 z-40 backdrop-blur-xl"
        style={{ background: 'rgba(14,14,18,0.9)', borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-between px-4 sm:px-6 py-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 min-h-[44px] px-2 touch-manipulation cursor-pointer"
            style={{ color: 'var(--muted)' }}
          >
            <ArrowLeft size={18} />
            <span className="hidden sm:inline text-sm">Puzzles</span>
          </button>

          {/* Live Timer — centre of header */}
          <LiveTimer elapsed={timer.elapsed} running={timer.running} />

          <div className="flex items-center gap-2">
            {/* Round progress dots */}
            <div className="hidden sm:flex items-center gap-2 mr-2">
              {config.rounds.map((round, i) => (
                <div
                  key={round.id}
                  className="w-2.5 h-2.5 rounded-full transition-all"
                  style={{
                    background: completedRounds.includes(i)
                      ? 'var(--accent)'
                      : i === roundIndex
                      ? 'var(--text)'
                      : 'var(--border)',
                  }}
                />
              ))}
            </div>
            <button
              onClick={() => setShowEditor(true)}
              className="h-10 px-3 rounded-xl touch-manipulation"
              style={{ border: '1px solid var(--border)', color: 'var(--muted)' }}
            >
              <Settings size={16} />
            </button>
          </div>
        </div>

        {/* Mobile round dots — below header row */}
        <div className="flex sm:hidden items-center justify-center gap-2 pb-2">
          {config.rounds.map((round, i) => (
            <div
              key={round.id}
              className="w-2 h-2 rounded-full transition-all"
              style={{
                background: completedRounds.includes(i)
                  ? 'var(--accent)'
                  : i === roundIndex
                  ? 'var(--text)'
                  : 'var(--border)',
              }}
            />
          ))}
        </div>
      </header>

      {/* MAIN */}
      <main className="flex-1 mx-auto py-4 lg:py-6 lg:mx-10 px-4">
        <div className="grid grid-cols-1 gap-6">
          {/* BOARD AREA */}
          <div className="min-w-0">
            <div className="mb-4">
              <div className="flex justify-between items-center gap-3 mb-2 flex-wrap">
                <div className="flex justify-center items-center gap-3 mb-2 flex-wrap">
                  <h1 className="font-display font-800 text-2xl sm:text-3xl" style={{ color: 'var(--text)' }}>
                    {meta.name}
                  </h1>
                  <span
                    className="text-[10px] sm:text-xs px-2 py-1 rounded-md uppercase tracking-widest"
                    style={{ background: 'var(--surface2)', color: 'var(--muted)' }}
                  >
                    {config.rounds[roundIndex]?.difficulty}
                  </span>
                </div>
                <motion.button
                  onClick={handleReset}
                  className="h-10 px-3 rounded-xl touch-manipulation cursor-pointer"
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <motion.div
                    key={resetKey}
                    animate={{ rotate: -360 }}
                    transition={{ duration: 0.4, ease: 'easeInOut' }}
                  >
                    <RotateCcw size={16} />
                  </motion.div>
                </motion.button>
              </div>

              <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
                {selectedPiece
                  ? (isMobile ? 'Tap board to place • Long press to remove' : 'Click to place • Right-click to remove')
                  : timerStarted.current ? 'Select a piece below' : 'Select a piece to start the timer'
                }
              </p>
            </div>

            <div className="pb-2 touch-none">
              <div className="flex justify-center items-center mt-12">
                <motion.div layout whileTap={{ scale: 0.995 }}>
                  <Board
                    config={config}
                    boardState={boardState}
                    selectedPiece={selectedPiece}
                    selectedRot={selectedRot}
                    onCellClick={handleCellClick}
                    onCellRightClick={handleCellRightClick}
                    onCellTouchStart={startLongPress}
                    onCellTouchEnd={cancelLongPress}
                    cellSize={60}
                    previewCells={previewCells}
                    previewValid={previewValid}
                    onHoverCell={handleHoverCell}
                  />
                </motion.div>
              </div>
            </div>
          </div>

          {/* ROTATION HINT */}
          {selectedPiece && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-center items-center gap-3"
            >
              <span className="text-xs" style={{ color: 'var(--muted)' }}>Rotation:</span>
              {[0, 1, 2, 3].map(rot => (
                <button
                  key={rot}
                  onClick={() => setSelectedRot(rot)}
                  className="p-1.5 rounded-lg"
                  style={{
                    background: selectedRot === rot ? selectedPiece.color + '33' : 'var(--surface2)',
                    border: `1.5px solid ${selectedRot === rot ? selectedPiece.color : 'var(--border)'}`,
                  }}
                >
                  <svg width={20} height={20} viewBox="0 0 25 25">
                    {rotateCells(selectedPiece.cells, rot).map(([r, c], i) => (
                      <rect key={i} x={c * 6 + 1} y={r * 6 + 1} width={5} height={5} rx={1} fill={selectedPiece.color} />
                    ))}
                  </svg>
                </button>
              ))}
            </motion.div>
          )}

          {/* PIECES PANEL */}
          <aside className="min-w-0">
            <div
              className="sticky top-[76px] rounded-2xl p-4"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
                  Pieces
                </p>
                <span className="text-xs px-2 py-1 rounded-lg" style={{ background: 'var(--surface2)', color: 'var(--text)' }}>
                  {pieces.length - usedPieces.size} left
                </span>
              </div>

              <div className="overflow-x-auto pb-4">
                <div className="flex gap-3 min-w-max">
                  {pieces.map(piece => {
                    const used = usedPieces.has(piece.id);
                    const active = selectedPieceId === piece.id;
                    return (
                      <motion.button
                        key={piece.id}
                        whileTap={{ scale: 0.94 }}
                        whileHover={{ scale: 0.94 }}
                        onClick={() => {
                          if (used) return;
                          navigator.vibrate?.(10);
                          if (active) { setSelectedPieceId(null); setSelectedRot(0); }
                          else { setSelectedPieceId(piece.id); setSelectedRot(0); }
                        }}
                        className="w-32 min-h-[110px] shrink-0 rounded-2xl p-3 touch-manipulation"
                        style={{
                          background: active ? piece.color + '22' : 'var(--surface2)',
                          border: `1.5px solid ${active ? piece.color : 'var(--border)'}`,
                          opacity: used ? 0.35 : 1,
                        }}
                      >
                        <div className="mb-2 flex justify-center">
                          <PieceSvg piece={piece} scale={1.2} />
                        </div>
                        <p className="text-xs font-medium text-center" style={{ color: active ? piece.color : 'var(--text)' }}>
                          {piece.label}
                        </p>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* EDITOR MODAL */}
      <AnimatePresence>
        {showEditor && (
          <RoundEditor
            config={config}
            onSave={handleSaveConfig}
            onClose={() => setShowEditor(false)}
          />
        )}
      </AnimatePresence>

      {/* STAR CELEBRATION */}
      <AnimatePresence>
        {showStar && (
          <StarCelebration onNext={handleNextRound} isLast={isLast} solveTimeMs={solveTimeMs} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Root export ────────────────────────────────────────────────────────────

export default function BrainRod() {
  const [activePuzzle, setActivePuzzle] = useState<PuzzleMeta | null>(null);

  if (!activePuzzle) {
    return <PuzzlePicker onSelect={setActivePuzzle} />;
  }

  return (
    <GameScreen
      key={activePuzzle.id}
      meta={activePuzzle}
      onBack={() => setActivePuzzle(null)}
    />
  );
}