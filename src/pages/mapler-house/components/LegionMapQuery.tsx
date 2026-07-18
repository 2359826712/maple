import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { useVersion } from '@/hooks/VersionContext';

interface PieceDef {
  id: string;
  name: string;
  rows: number;
  cols: number;
  color: string;
  category: string;
}

const BASE: PieceDef[] = [
  { id: 'p1', name: 'Lvl 60', rows: 1, cols: 1, color: '#fca5a5', category: 'Any' },
  { id: 'p2', name: 'Lvl 100', rows: 1, cols: 2, color: '#fdba74', category: 'Any' },
  { id: 'p3', name: 'Lvl 140 W/P', rows: 2, cols: 2, color: '#86efac', category: 'Warrior/Pirate' },
  { id: 'p4', name: 'Lvl 140 M/T/A', rows: 1, cols: 3, color: '#93c5fd', category: 'Mage/Thief/Archer' },
  { id: 'p5', name: 'Lvl 200 W', rows: 2, cols: 2, color: '#a78bfa', category: 'Warrior' },
  { id: 'p6', name: 'Lvl 200 A', rows: 1, cols: 4, color: '#f472b6', category: 'Archer' },
  { id: 'p7', name: 'Lvl 200 T/Lab', rows: 2, cols: 3, color: '#c084fc', category: 'Thief/Lab' },
  { id: 'p8', name: 'Lvl 200 M', rows: 2, cols: 3, color: '#60a5fa', category: 'Mage' },
  { id: 'p9', name: 'Lvl 200 P', rows: 2, cols: 3, color: '#818cf8', category: 'Pirate' },
  { id: 'p10', name: 'Lvl 250 W', rows: 2, cols: 3, color: '#f87171', category: 'Warrior' },
  { id: 'p11', name: 'Lvl 250 A', rows: 1, cols: 5, color: '#34d399', category: 'Archer' },
  { id: 'p12', name: 'Lvl 250 T/R', rows: 3, cols: 3, color: '#e879f9', category: 'Thief/Ride' },
  { id: 'p13', name: 'Lvl 250 M', rows: 3, cols: 3, color: '#38bdf8', category: 'Mage' },
  { id: 'p14', name: 'Lvl 250 P/Aby', rows: 2, cols: 4, color: '#a5b4fc', category: 'Pirate/Abyssal' },
  { id: 'p15', name: 'Lvl 250 Xenon', rows: 3, cols: 3, color: '#c4b5fd', category: 'Xenon' },
];

const EXTRA: Record<string, PieceDef[]> = {
  gms: [
    { id: 'p16', name: 'Lvl 200 ELab', rows: 2, cols: 4, color: '#fb923c', category: 'Enhanced Lab' },
    { id: 'p17', name: 'Lvl 250 ELab', rows: 2, cols: 5, color: '#f97316', category: 'Enhanced Lab' },
    { id: 'p18', name: 'Lvl 250 Lab', rows: 2, cols: 3, color: '#fbbf24', category: 'Lab' },
  ],
  kms: [
    { id: 'p16', name: 'Lvl 200 Lab', rows: 2, cols: 4, color: '#fb923c', category: 'Lab' },
    { id: 'p17', name: 'Lvl 250 Lab', rows: 2, cols: 5, color: '#f97316', category: 'Lab' },
    { id: 'p18', name: 'Lvl 250 Lab+', rows: 2, cols: 3, color: '#fbbf24', category: 'Lab+' },
  ],
  tms: [
    { id: 'p16', name: 'Lvl 200 Training', rows: 2, cols: 4, color: '#fb923c', category: 'Training' },
    { id: 'p17', name: 'Lvl 250 Training', rows: 2, cols: 5, color: '#f97316', category: 'Training' },
  ],
  jms: [
    { id: 'p16', name: 'Lvl 200 Training', rows: 2, cols: 4, color: '#fb923c', category: 'Training' },
    { id: 'p17', name: 'Lvl 250 Training', rows: 2, cols: 5, color: '#f97316', category: 'Training' },
  ],
  msea: [
    { id: 'p16', name: 'Lvl 200 Lab', rows: 2, cols: 4, color: '#fb923c', category: 'Lab' },
    { id: 'p17', name: 'Lvl 250 Lab', rows: 2, cols: 5, color: '#f97316', category: 'Lab' },
  ],
};

const W = 22;
const H = 20;

type Cell = { isTarget: boolean; pieceId: string | null };

const emptyGrid = (): Cell[][] =>
  Array.from({ length: H }, () => Array.from({ length: W }, () => ({ isTarget: false, pieceId: null })));

const clone = (g: Cell[][]): Cell[][] => g.map((row) => row.map((c) => ({ ...c })));

const countTargets = (g: Cell[][]) => g.flat().filter((c) => c.isTarget).length;
const countFilled = (g: Cell[][]) => g.flat().filter((c) => c.pieceId !== null).length;

function canPlace(g: Cell[][], r: number, c: number, rows: number, cols: number) {
  if (r + rows > H || c + cols > W) return false;
  for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) {
    const cell = g[r + i][c + j];
    if (!cell.isTarget || cell.pieceId !== null) return false;
  }
  return true;
}

function place(g: Cell[][], r: number, c: number, rows: number, cols: number, pid: string) {
  for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) g[r + i][c + j].pieceId = pid;
}

function unplace(g: Cell[][], pid: string) {
  for (const row of g) for (const cell of row) if (cell.pieceId === pid) cell.pieceId = null;
}

function solve(g: Cell[][], pieces: { def: PieceDef; count: number }[]): Cell[][] | null {
  const targetCount = countTargets(g);
  const pieceCells = pieces.reduce((sum, p) => sum + p.count * p.def.rows * p.def.cols, 0);
  if (targetCount === 0 || pieceCells === 0 || pieceCells !== targetCount) return null;

  const result = clone(g);
  const sorted = [...pieces].filter((p) => p.count > 0).sort((a, b) => b.def.rows * b.def.cols - a.def.rows * a.def.cols);
  const remaining = sorted.map((p) => p.count);

  function backtrack(idx: number): boolean {
    if (idx >= sorted.length) return true;
    if (remaining[idx] === 0) return backtrack(idx + 1);

    const piece = sorted[idx];
    const oris = [{ rows: piece.def.rows, cols: piece.def.cols }];
    if (piece.def.rows !== piece.def.cols) oris.push({ rows: piece.def.cols, cols: piece.def.rows });

    for (const ori of oris) {
      for (let r = 0; r <= H - ori.rows; r++) {
        for (let c = 0; c <= W - ori.cols; c++) {
          if (canPlace(result, r, c, ori.rows, ori.cols)) {
            place(result, r, c, ori.rows, ori.cols, piece.def.id);
            remaining[idx]--;
            if (backtrack(idx)) return true;
            remaining[idx]++;
            unplace(result, piece.def.id);
          }
        }
      }
    }
    return false;
  }

  return backtrack(0) ? result : null;
}

function flood(g: Cell[][], sr: number, sc: number): Cell[][] {
  const out = clone(g);
  const target = !out[sr][sc].isTarget;
  const vis = Array.from({ length: H }, () => Array(W).fill(false));
  const stack: [number, number][] = [[sr, sc]];
  vis[sr][sc] = true;
  while (stack.length) {
    const [r, c] = stack.pop()!;
    out[r][c].isTarget = target;
    for (const [dr, dc] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < H && nc >= 0 && nc < W && !vis[nr][nc]) {
        vis[nr][nc] = true;
        stack.push([nr, nc]);
      }
    }
  }
  return out;
}

function MiniPreview({ rows, cols, color }: { rows: number; cols: number; color: string }) {
  return (
    <div className="grid gap-[1px] bg-background-300 rounded" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {Array.from({ length: rows * cols }).map((_, i) => (
        <div key={i} className="w-2.5 h-2.5 rounded-[1px]" style={{ backgroundColor: color }} />
      ))}
    </div>
  );
}

export default function LegionMapQuery() {
  const { t } = useTranslation();
  const { version } = useVersion();
  const [grid, setGrid] = useState<Cell[][]>(emptyGrid);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [solved, setSolved] = useState<Cell[][] | null>(null);
  const [region, setRegion] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [solving, setSolving] = useState(false);

  const defs = useMemo(() => [...BASE, ...(EXTRA[version] || EXTRA.gms)], [version]);

  const targets = useMemo(() => countTargets(grid), [grid]);
  const filled = useMemo(() => (solved ? countFilled(solved) : 0), [solved]);
  const pieceCells = useMemo(() => defs.reduce((s, d) => s + (counts[d.id] || 0) * d.rows * d.cols, 0), [defs, counts]);
  const chars = useMemo(() => defs.reduce((s, d) => s + (counts[d.id] || 0), 0), [defs, counts]);
  const display = solved || grid;

  const onCell = useCallback((r: number, c: number) => {
    setSolved(null);
    setErr(null);
    setGrid((prev) => (region ? flood(prev, r, c) : clone(prev).map((row, ri) => row.map((cell, ci) =>
      ri === r && ci === c ? { ...cell, isTarget: !cell.isTarget } : cell
    ))));
  }, [region]);

  const onCount = useCallback((id: string, v: number) => {
    setSolved(null);
    setErr(null);
    setCounts((p) => ({ ...p, [id]: Math.max(0, Math.min(40, v)) }));
  }, []);

  const onSolve = useCallback(() => {
    setSolving(true);
    setErr(null);
    const pieces = defs.map((def) => ({ def, count: counts[def.id] || 0 })).filter((p) => p.count > 0);
    if (!pieces.length) { setErr(t('mh_legion_err_no_pieces')); setSolving(false); return; }
    if (targets === 0) { setErr(t('mh_legion_err_no_targets')); setSolving(false); return; }
    setTimeout(() => {
      const res = solve(grid, pieces);
      if (res) { setSolved(res); setErr(null); }
      else { setErr(t('mh_legion_err_no_solution')); }
      setSolving(false);
    }, 50);
  }, [grid, defs, counts, targets, t]);

  const clearBoard = useCallback(() => { setGrid(emptyGrid()); setSolved(null); setErr(null); }, []);
  const clearPieces = useCallback(() => { setCounts({}); setSolved(null); setErr(null); }, []);
  const resetSol = useCallback(() => { setSolved(null); setErr(null); }, []);

  return (
    <div className="space-y-8">
      <div>
        <h4 className="text-sm font-semibold text-foreground-900 mb-1 flex items-center gap-2">
          <i className="ri-layout-grid-line text-primary-600"></i>
          {t('mh_legion_solver')}
        </h4>
        <p className="text-xs text-foreground-500 mb-4">
          {t('mh_legion_solver_hint')}
        </p>

        <div className="flex flex-col xl:flex-row gap-5">
          {/* Pieces panel */}
          <div className="xl:w-72 shrink-0">
            <div className="bg-background-100 border border-background-200 rounded-xl p-3 max-h-[600px] overflow-y-auto">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-foreground-700">{t('mh_legion_pieces')}</span>
                <button onClick={clearPieces} className="text-[10px] px-2 py-1 rounded-md bg-secondary-100 text-secondary-700 hover:bg-secondary-200 transition-colors whitespace-nowrap">
                  {t('mh_clear_pieces')}
                </button>
              </div>
              <div className="space-y-1.5">
                {defs.map((p) => (
                  <div key={p.id} className="flex items-center gap-2 p-2 rounded-lg bg-background-50 border border-background-200">
                    <div className="shrink-0"><MiniPreview rows={p.rows} cols={p.cols} color={p.color} /></div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-semibold text-foreground-800 truncate">{p.name}</div>
                      <div className="text-[10px] text-foreground-500">{p.category}</div>
                    </div>
                    <input type="number" min={0} max={40} value={counts[p.id] || 0}
                      onChange={(e) => onCount(p.id, Number(e.target.value))}
                      className="w-12 h-7 rounded-md border border-background-300 bg-background-50 text-center text-xs outline-none focus:border-primary-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Board */}
          <div className="flex-1 min-w-0">
            <div className="bg-background-100 border border-background-200 rounded-xl p-3 md:p-4">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div className="flex items-center gap-3 text-xs flex-wrap">
                  <span className="text-foreground-600">{t('mh_legion_targets')}: <strong className="text-foreground-900">{targets}</strong></span>
                  <span className="text-foreground-600">{t('mh_legion_pieces_total')}: <strong className={pieceCells === targets && targets > 0 ? 'text-accent-600' : 'text-foreground-900'}>{pieceCells}</strong></span>
                  <span className="text-foreground-600">{t('mh_legion_filled')}: <strong className="text-primary-600">{filled}</strong></span>
                  <span className="text-foreground-600">{t('mh_legion_chars')}: <strong className="text-foreground-900">{chars}</strong></span>
                </div>
                <label className="flex items-center gap-1.5 text-xs text-foreground-600 cursor-pointer select-none">
                  <input type="checkbox" checked={region} onChange={(e) => setRegion(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-background-300 accent-primary-500"
                  />
                  {t('mh_legion_region_click')}
                </label>
              </div>

              <div className="overflow-x-auto pb-1">
                <div className="inline-grid gap-[1px] bg-background-300 rounded-lg p-[2px]"
                  style={{ gridTemplateColumns: `repeat(${W}, minmax(14px, 1fr))` }}
                >
                  {display.map((row, r) => row.map((cell, c) => {
                    const piece = cell.pieceId ? defs.find((d) => d.id === cell.pieceId) : null;
                    return (
                      <button key={`${r}-${c}`} onClick={() => onCell(r, c)}
                        className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 rounded-[1px] transition-colors"
                        style={{
                          backgroundColor: cell.pieceId ? piece?.color || '#d1d5db'
                            : cell.isTarget ? 'oklch(var(--accent-400))' : 'oklch(var(--background-200))',
                          opacity: cell.isTarget || cell.pieceId ? 1 : 0.55,
                        }}
                        title={cell.pieceId ? piece?.name : cell.isTarget ? t('mh_legion_target') : t('mh_legion_empty')}
                      />
                    );
                  }))}
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4 flex-wrap">
                <button onClick={onSolve} disabled={solving || targets === 0}
                  className="px-4 py-2 rounded-lg bg-primary-500 text-background-50 text-xs font-semibold hover:bg-primary-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                >{solving ? t('mh_legion_solving') : t('mh_legion_solve')}</button>
                <button onClick={resetSol} className="px-3 py-2 rounded-lg bg-secondary-100 text-secondary-700 text-xs font-medium hover:bg-secondary-200 transition-colors whitespace-nowrap">{t('mh_legion_reset')}</button>
                <button onClick={clearBoard} className="px-3 py-2 rounded-lg bg-background-200 text-foreground-600 text-xs font-medium hover:bg-background-300 transition-colors whitespace-nowrap">{t('mh_legion_clear_board')}</button>
              </div>

              {err && (
                <div className="mt-3 flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <i className="ri-error-warning-line"></i>{err}
                </div>
              )}
              {solved && !err && (
                <div className="mt-3 flex items-center gap-2 text-xs text-accent-700 bg-accent-50 border border-accent-200 rounded-lg px-3 py-2">
                  <i className="ri-check-line"></i>{t('mh_legion_solution_found')}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
