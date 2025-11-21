// Web Worker version of AI logic (migrated from original ai.js)
// NOTE: Core evaluation, search depth, difficulty parameters, and rules are unchanged.
// This file retains the original logic; only a message handler was added at the end.

import { ROWS, COLS, PLAYER, DIRECTIONS, AI as AI_IN } from "./constants.js";

/* -------------------------------------------------------------------------- */
/* Public API (internal to worker)                                            */
/* -------------------------------------------------------------------------- */

function chooseComputerMove({ grid, blockedCells, aiDifficulty }) {
  const AI = withDefaults(AI_IN);
  const { blockedMask, hashBase } = materializeState(grid, blockedCells);

  if (!aiDifficulty || aiDifficulty === "medium")
    return getBestMoveMedium(grid, blockedMask, hashBase, AI);
  if (aiDifficulty === "beginner")
    return getBestMoveBeginner(grid, blockedMask, hashBase, AI);
  if (aiDifficulty === "advanced")
    return getBestMoveAdvanced(grid, blockedMask, hashBase, AI);
  if (aiDifficulty === "impossible")
    return getBestMoveImpossible(grid, blockedMask, hashBase, AI);
  return getBestMoveMedium(grid, blockedMask, hashBase, AI);
}

/* -------------------------------------------------------------------------- */
/* Config & helpers                                                           */
/* -------------------------------------------------------------------------- */

function withDefaults(AI) {
  const out = {
    BEGINNER_BLOCK_PROB: 0.5,
    MEDIUM_DEPTH: 3,
    MEDIUM_TWO_BLOCK_PROB: 0.5,
    ADVANCED_DEPTH: 4,
    ADVANCED_TWO_BLOCK_PROB: 0.75,
    IMPOSSIBLE_DEPTH: 6,
    // Perf knobs
    ADVANCED_NODE_BUDGET: 90_000,
    IMPOSSIBLE_NODE_BUDGET: 140_000,
    ADVANCED_MS: 18,
    IMPOSSIBLE_MS: 32,
    CAND_LIMIT_MED: 8,
    CAND_LIMIT_ADV: 8,
    CAND_LIMIT_IMP: 9,
  };
  if (AI) Object.assign(out, AI);
  return out;
}

const now = () =>
  typeof performance !== "undefined" && performance.now
    ? performance.now()
    : Date.now();
const idxOf = (r, c) => r * COLS + c;
const rOf = (idx) => (idx / COLS) | 0;
const cOf = (idx) => idx % COLS;

function materializeState(grid, blockedCells) {
  const blockedMask = new Uint8Array(ROWS * COLS);
  if (blockedCells) {
    if (blockedCells instanceof Set) {
      for (const k of blockedCells) {
        const [r, c] = k.split("-");
        const ri = r | 0,
          ci = c | 0;
        if (ri >= 0 && ri < ROWS && ci >= 0 && ci < COLS)
          blockedMask[idxOf(ri, ci)] = 1;
      }
    } else if (Array.isArray(blockedCells)) {
      for (const k of blockedCells) {
        if (k && typeof k === "string") {
          const [r, c] = k.split("-");
          const ri = r | 0,
            ci = c | 0;
            if (ri >= 0 && ri < ROWS && ci >= 0 && ci < COLS)
              blockedMask[idxOf(ri, ci)] = 1;
        }
      }
    }
  }
  const hashBase = computeHashBase(grid, blockedMask);
  return { blockedMask, hashBase };
}

/* -------------------------------------------------------------------------- */
/* Core rules (gravity + closing sections)                                    */
/* -------------------------------------------------------------------------- */

function canDropInColumn(grid, blocked, col) {
  for (let r = ROWS - 1; r >= 0; r--)
    if (!blocked[idxOf(r, col)] && grid[r][col] === 0) return true;
  return false;
}
function getDropRow(grid, blocked, col) {
  for (let r = ROWS - 1; r >= 0; r--)
    if (!blocked[idxOf(r, col)] && grid[r][col] === 0) return r;
  return -1;
}
function isPlayableCell(grid, blocked, r, c) {
  if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return false;
  if (blocked[idxOf(r, c)]) return false;
  if (grid[r][c] !== 0) return false;
  return getDropRow(grid, blocked, c) === r;
}

function getLineForSim(grid, blocked, startRow, startCol, dRow, dCol, player) {
  const line = [{ row: startRow, col: startCol }];
  let r = startRow + dRow,
    c = startCol + dCol;
  while (
    r >= 0 &&
    r < ROWS &&
    c >= 0 &&
    c < COLS &&
    grid[r][c] === player &&
    !blocked[idxOf(r, c)]
  ) {
    line.push({ row: r, col: c });
    r += dRow;
    c += dCol;
  }
  r = startRow - dRow;
  c = startCol - dCol;
  while (
    r >= 0 &&
    r < ROWS &&
    c >= 0 &&
    c < COLS &&
    grid[r][c] === player &&
    !blocked[idxOf(r, c)]
  ) {
    line.unshift({ row: r, col: c });
    r -= dRow;
    c -= dCol;
  }
  return line;
}
function checkForWinSimulation(grid, blocked, row, col, player) {
  for (let [dr, dc] of DIRECTIONS)
    if (getLineForSim(grid, blocked, row, col, dr, dc, player).length >= 4)
      return true;
  return false;
}
function collectNewlyClosedIndices(grid, blocked, row, col, player) {
  const out = [];
  const seen = new Set();
  for (let [dr, dc] of DIRECTIONS) {
    const line = getLineForSim(grid, blocked, row, col, dr, dc, player);
    if (line.length >= 4) {
      for (const cell of line) {
        const idx = idxOf(cell.row, cell.col);
        if (!seen.has(idx)) {
          out.push(idx);
          seen.add(idx);
        }
      }
    }
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/* Zobrist hashing (incremental)                                              */
/* -------------------------------------------------------------------------- */

const Z_PIECE = (() => {
  const arr = new Array(ROWS);
  for (let r = 0; r < ROWS; r++) {
    arr[r] = new Array(COLS);
    for (let c = 0; c < COLS; c++) arr[r][c] = [rand32(), rand32()];
  }
  return arr;
})();
const Z_BLOCK = (() => {
  const arr = new Array(ROWS);
  for (let r = 0; r < ROWS; r++) {
    arr[r] = new Array(COLS);
    for (let c = 0; c < COLS; c++) arr[r][c] = rand32();
  }
  return arr;
})();
const Z_TURN = rand32();
function rand32() {
  let x = (Math.random() * 0xffffffff) >>> 0;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  return x >>> 0;
}
function computeHashBase(board, blocked) {
  let h = 0 >>> 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const v = board[r][c];
      if (v === PLAYER.RED) h ^= Z_PIECE[r][c][0];
      else if (v === PLAYER.BLUE) h ^= Z_PIECE[r][c][1];
      if (blocked[idxOf(r, c)]) h ^= Z_BLOCK[r][c];
    }
  }
  return h >>> 0;
}

/* -------------------------------------------------------------------------- */
/* Move application with incremental hash                                     */
/* -------------------------------------------------------------------------- */

function applyMove(grid, blocked, col, player, hash, toggleTurn) {
  const row = getDropRow(grid, blocked, col);
  if (row === -1) return null;
  grid[row][col] = player;
  let newHash = hash ^ Z_PIECE[row][col][player === PLAYER.RED ? 0 : 1];
  if (toggleTurn) newHash ^= Z_TURN;
  const newlyClosed = collectNewlyClosedIndices(
    grid,
    blocked,
    row,
    col,
    player
  );
  for (const id of newlyClosed) {
    const rr = rOf(id),
      cc = cOf(id);
    blocked[id] = 1;
    newHash ^= Z_BLOCK[rr][cc];
  }
  return { row, col, player, newlyClosed, hash: newHash };
}
function undoMove(grid, blocked, move, prevHash, toggleTurn) {
  if (!move) return prevHash;
  const { row, col, newlyClosed } = move;
  for (const id of newlyClosed) blocked[id] = 0;
  grid[row][col] = 0;
  return prevHash;
}

/* -------------------------------------------------------------------------- */
/* Candidate generation & ordering                                            */
/* -------------------------------------------------------------------------- */

function getCandidateMovesOrdered(
  grid,
  blocked,
  limit = 12,
  pvMove = -1,
  history = null
) {
  const candidates = [];
  const center = Math.floor(COLS / 2);
  if (pvMove >= 0 && canDropInColumn(grid, blocked, pvMove))
    candidates.push(pvMove);
  const order = [];
  for (let delta = 0; delta < COLS; delta++) {
    const left = center - delta;
    const right = center + delta;
    if (left >= 0) order.push(left);
    if (right < COLS) order.push(right);
  }
  for (const c of order) {
    if (candidates.length >= limit) break;
    if (c === pvMove) continue;
    if (canDropInColumn(grid, blocked, c)) candidates.push(c);
  }
  return candidates;
}

function effectiveDepth(baseDepth, grid, blocked, hardMax = baseDepth) {
  let empties = 0;
  for (let c = 0; c < COLS; c++)
    for (let r = ROWS - 1; r >= 0; r--)
      if (!blocked[idxOf(r, c)] && grid[r][c] === 0) empties++;
  if (empties <= 12) return Math.min(hardMax, baseDepth + 1);
  if (empties <= 8) return Math.min(hardMax, baseDepth + 2);
  return baseDepth;
}

/* -------------------------------------------------------------------------- */
/* Threat utilities                                                           */
/* -------------------------------------------------------------------------- */

function findImmediateThreats(grid, blocked) {
  const out = [];
  for (let c = 0; c < COLS; c++) {
    const row = getDropRow(grid, blocked, c);
    if (row === -1) continue;
    grid[row][c] = PLAYER.RED;
    const win = checkForWinSimulation(grid, blocked, row, c, PLAYER.RED);
    grid[row][c] = 0;
    if (win) out.push(c);
  }
  return out;
}

function getOppImmediateWinsAfterOurMove(grid, blocked, col, hashBase = 0) {
  const row = getDropRow(grid, blocked, col);
  if (row === -1) return { wins: [] };
  grid[row][col] = PLAYER.BLUE;
  const wins = [];
  for (let c = 0; c < COLS; c++) {
    const rr = getDropRow(grid, blocked, c);
    if (rr === -1) continue;
    grid[rr][c] = PLAYER.RED;
    const win = checkForWinSimulation(grid, blocked, rr, c, PLAYER.RED);
    grid[rr][c] = 0;
    if (win) wins.push(c);
  }
  grid[row][col] = 0;
  return { wins };
}

function countImmediateClosesFor(board, blocked, player) {
  let cnt = 0;
  for (let c = 0; c < COLS; c++) {
    const row = getDropRow(board, blocked, c);
    if (row === -1) continue;
    board[row][c] = player;
    const ok = checkForWinSimulation(board, blocked, row, c, player);
    board[row][c] = 0;
    if (ok) cnt++;
  }
  return cnt;
}

function findOpenTwoThreatBlock(grid, blocked) {
  const threats = findImmediateThreats(grid, blocked);
  if (threats.length < 2) return -1;
  for (const col of threats) {
    const row = getDropRow(grid, blocked, col);
    if (row === -1) continue;
    grid[row][col] = PLAYER.BLUE;
    const res = findImmediateThreats(grid, blocked);
    grid[row][col] = 0;
    if (res.length === 0) return col;
  }
  return -1;
}

function createsOpponentForkAfterOurMove(
  grid,
  blocked,
  colAfterOurMove,
  hashBase = 0
) {
  const row = getDropRow(grid, blocked, colAfterOurMove);
  if (row === -1) return false;
  grid[row][colAfterOurMove] = PLAYER.BLUE;
  let forks = 0;
  for (let c = 0; c < COLS; c++) {
    const rr = getDropRow(grid, blocked, c);
    if (rr === -1) continue;
    grid[rr][c] = PLAYER.RED;
    const winMoves = findImmediateThreats(grid, blocked);
    grid[rr][c] = 0;
    if (winMoves.length >= 2) forks++;
    if (forks >= 1) break;
  }
  grid[row][colAfterOurMove] = 0;
  return forks >= 1;
}

function findBlockForOpponentOneMoveFork(grid, blocked, hashBase = 0) {
  for (let c = 0; c < COLS; c++) {
    const row = getDropRow(grid, blocked, c);
    if (row === -1) continue;
    grid[row][c] = PLAYER.RED;
    const threats = findImmediateThreats(grid, blocked);
    grid[row][c] = 0;
    if (threats.length >= 2) return c; // block setup before it happens
  }
  return -1;
}

function softPenaltyAfterMove(grid, blocked, col, hashBase = 0) {
  return createsOpponentForkAfterOurMove(grid, blocked, col, hashBase) ? -50 : 0;
}

/* -------------------------------------------------------------------------- */
/* Evaluation (fast + strong)                                                 */
/* -------------------------------------------------------------------------- */

function evaluateBoardSimple(board, blocked) {
  let score = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const v = board[r][c];
      if (v === PLAYER.RED) score -= getPositionalScoreSimple(r, c, v);
      else if (v === PLAYER.BLUE) score += getPositionalScoreSimple(r, c, v);
    }
  }
  return score;
}
function evaluateLineSimple(
  board,
  blocked,
  startRow,
  startCol,
  dRow,
  dCol,
  player
) {
  const cells = [];
  let r = startRow,
    c = startCol;
  let consecutive = 0;
  while (
    r >= 0 &&
    r < ROWS &&
    c >= 0 &&
    c < COLS &&
    board[r][c] === player &&
    !blocked[idxOf(r, c)] &&
    consecutive < 4
  ) {
    cells.push({ row: r, col: c });
    consecutive++;
    r += dRow;
    c += dCol;
  }
  if (consecutive >= 4) return 1000;
  return consecutive * 10 + cells.length;
}
function getPositionalScoreSimple(row, col, player) {
  const centerCol = COLS / 2;
  return 6 - Math.abs(centerCol - col);
}
function getConnectivityBonusSimple(board, blocked, row, col, player) {
  let bonus = 0;
  for (let [dr, dc] of DIRECTIONS) {
    const rr = row + dr,
      cc = col + dc;
    if (
      rr >= 0 &&
      rr < ROWS &&
      cc >= 0 &&
      cc < COLS &&
      board[rr][cc] === player &&
      !blocked[idxOf(rr, cc)]
    )
      bonus += 2;
  }
  return bonus;
}

function evaluateBoardAdvanced(board, blocked) {
  let score = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const v = board[r][c];
      if (v === PLAYER.RED) score -= getPositionalScoreAdvanced(r, c, v);
      else if (v === PLAYER.BLUE) score += getPositionalScoreAdvanced(r, c, v);
    }
  }
  return score;
}
function evalLineAdvanced(
  board,
  blocked,
  startRow,
  startCol,
  dRow,
  dCol,
  player
) {
  const cells = [];
  let r = startRow,
    c = startCol;
  let cnt = 0;
  while (
    r >= 0 &&
    r < ROWS &&
    c >= 0 &&
    c < COLS &&
    board[r][c] === player &&
    !blocked[idxOf(r, c)] &&
    cnt < 5
  ) {
    cells.push({ row: r, col: c });
    cnt++;
    r += dRow;
    c += dCol;
  }
  if (cnt >= 4) return 1200;
  return cnt * 14 + cells.length * 2;
}
function getConnectivityBonusAdvanced(board, blocked, row, col, player) {
  let bonus = 0;
  for (let [dr, dc] of DIRECTIONS) {
    const rr = row + dr,
      cc = col + dc;
    if (
      rr >= 0 &&
      rr < ROWS &&
      cc >= 0 &&
      cc < COLS &&
      board[rr][cc] === player &&
      !blocked[idxOf(rr, cc)]
    )
      bonus += 3;
  }
  return bonus;
}
function getPositionalScoreAdvanced(row, col, player) {
  const centerCol = COLS / 2;
  return 10 - Math.abs(centerCol - col);
}

/* -------------------------------------------------------------------------- */
/* Transposition table & search                                               */
/* -------------------------------------------------------------------------- */

const TT_FLAG = { EXACT: 0, LOWER: 1, UPPER: 2 };
const globalTT = new Map();
function probeTT(hash, depth, alpha, beta) {
  const e = globalTT.get(hash);
  if (!e || e.depth < depth) return null;
  if (e.flag === TT_FLAG.EXACT) return e;
  if (e.flag === TT_FLAG.LOWER && e.value <= alpha) return e;
  if (e.flag === TT_FLAG.UPPER && e.value >= beta) return e;
  return null;
}
function storeTT(hash, depth, value, flag, bestMove) {
  globalTT.set(hash, { hash, depth, value, flag, bestMove });
}
function noMovesRemain(board, blocked) {
  for (let c = 0; c < COLS; c++) if (canDropInColumn(board, blocked, c)) return false;
  return true;
}

function minimaxTT({
  board,
  blocked,
  depth,
  isMax,
  alpha,
  beta,
  evalFn,
  nodeBudget,
  timeBudget,
  startTime,
  hash,
  history,
  killers,
  ply = 0,
  pvMove = -1,
}) {
  if (nodeBudget.count++ > nodeBudget.max) return { value: evalFn(board, blocked) };
  if (now() - startTime > timeBudget) return { value: evalFn(board, blocked) };
  if (depth <= 0 || noMovesRemain(board, blocked)) return { value: evalFn(board, blocked) };
  const tt = probeTT(hash, depth, alpha, beta);
  if (tt) return { value: tt.value, bestMove: tt.bestMove };

  let bestMove = -1;
  if (isMax) {
    let value = -Infinity;
    const cand = getCandidateMovesOrdered(board, blocked, 12, pvMove, history);
    for (const col of cand) {
      const move = applyMove(board, blocked, col, PLAYER.BLUE, hash, true);
      if (!move) continue;
      const child = minimaxTT({
        board,
        blocked,
        depth: depth - 1,
        isMax: false,
        alpha,
        beta,
        evalFn,
        nodeBudget,
        timeBudget,
        startTime,
        hash: move.hash,
        history,
        killers,
        ply: ply + 1,
        pvMove: -1,
      });
      undoMove(board, blocked, move, hash, true);
      if (child.value > value) {
        value = child.value;
        bestMove = col;
      }
      alpha = Math.max(alpha, value);
      if (beta <= alpha) break;
    }
    storeTT(hash, depth, value, TT_FLAG.EXACT, bestMove);
    return { value, bestMove };
  } else {
    let value = Infinity;
    const cand = getCandidateMovesOrdered(board, blocked, 12, pvMove, history);
    for (const col of cand) {
      const move = applyMove(board, blocked, col, PLAYER.RED, hash, true);
      if (!move) continue;
      const child = minimaxTT({
        board,
        blocked,
        depth: depth - 1,
        isMax: true,
        alpha,
        beta,
        evalFn,
        nodeBudget,
        timeBudget,
        startTime,
        hash: move.hash,
        history,
        killers,
        ply: ply + 1,
        pvMove: -1,
      });
      undoMove(board, blocked, move, hash, true);
      if (child.value < value) {
        value = child.value;
        bestMove = col;
      }
      beta = Math.min(beta, value);
      if (beta <= alpha) break;
    }
    storeTT(hash, depth, value, TT_FLAG.EXACT, bestMove);
    return { value, bestMove };
  }
}

/* -------------------------------------------------------------------------- */
/* Difficulty entry points                                                    */
/* -------------------------------------------------------------------------- */

function getBestMoveBeginner(grid, blocked, hashBase, AI) {
  const moves = [];
  for (let c = 0; c < COLS; c++) if (canDropInColumn(grid, blocked, c)) moves.push(c);
  if (!moves.length) return -1;
  const threat = findImmediateThreats(grid, blocked);
  if (threat.length && Math.random() < AI.BEGINNER_BLOCK_PROB)
    return threat[Math.floor(Math.random() * threat.length)];
  return moves[Math.floor(Math.random() * moves.length)];
}

function getBestMoveMedium(grid, blocked, hashBase, AI) {
  const depth = effectiveDepth(AI.MEDIUM_DEPTH, grid, blocked);
  const nodeBudget = { count: 0, max: 50_000 };
  const startTime = now();
  const res = minimaxTT({
    board: grid,
    blocked,
    depth,
    isMax: true,
    alpha: -Infinity,
    beta: Infinity,
    evalFn: (b, bl) => evaluateBoardSimple(b, bl),
    nodeBudget,
    timeBudget: 20,
    startTime,
    hash: hashBase,
    history: null,
    killers: null,
    pvMove: -1,
  });
  return res.bestMove ?? -1;
}

function getBestMoveAdvanced(grid, blocked, hashBase, AI) {
  const depth = effectiveDepth(AI.ADVANCED_DEPTH, grid, blocked);
  const nodeBudget = { count: 0, max: AI.ADVANCED_NODE_BUDGET };
  const startTime = now();
  const res = minimaxTT({
    board: grid,
    blocked,
    depth,
    isMax: true,
    alpha: -Infinity,
    beta: Infinity,
    evalFn: (b, bl) => evaluateBoardAdvanced(b, bl),
    nodeBudget,
    timeBudget: AI.ADVANCED_MS,
    startTime,
    hash: hashBase,
    history: null,
    killers: null,
    pvMove: -1,
  });
  return res.bestMove ?? -1;
}

function getBestMoveImpossible(grid, blocked, hashBase, AI) {
  const depth = effectiveDepth(AI.IMPOSSIBLE_DEPTH, grid, blocked);
  const nodeBudget = { count: 0, max: AI.IMPOSSIBLE_NODE_BUDGET };
  const startTime = now();
  const res = minimaxTT({
    board: grid,
    blocked,
    depth,
    isMax: true,
    alpha: -Infinity,
    beta: Infinity,
    evalFn: (b, bl) => evaluateBoardAdvanced(b, bl),
    nodeBudget,
    timeBudget: AI.IMPOSSIBLE_MS,
    startTime,
    hash: hashBase,
    history: null,
    killers: null,
    pvMove: -1,
  });
  return res.bestMove ?? -1;
}

function isHandingImmediateClose(grid, blocked, colAfterOurMove, hashBase = 0) {
  const row = getDropRow(grid, blocked, colAfterOurMove);
  if (row === -1) return false;
  grid[row][colAfterOurMove] = PLAYER.BLUE;
  const threats = findImmediateThreats(grid, blocked);
  grid[row][colAfterOurMove] = 0;
  return threats.length > 0;
}

/* -------------------------------------------------------------------------- */
/* Worker message handling                                                    */
/* -------------------------------------------------------------------------- */

self.onmessage = (e) => {
  const data = e.data;
  if (!data) return;
  if (data.type === "choose") {
    try {
      const col = chooseComputerMove(data.args);
      self.postMessage({ type: "chooseResult", id: data.id, col });
    } catch (err) {
      self.postMessage({
        type: "chooseError",
        id: data.id,
        error: err && err.message ? err.message : String(err),
      });
    }
  }
};
