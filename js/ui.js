// ===== SQUARE WARS — ui.js =====
import {
  UI_IDS,
  CSS,
  CELL,
  GAP,
  GRID_PADDING,
  BORDER_WIDTH,
  PLAYER,
  SCORING_MODES,
} from "./constants.js";

// Responsive scale
let SCALE = 1;
export function getScale() {
  return SCALE;
}

/** Create/update the yellow column highlight overlay at the given column index */
export function updateColumnHighlight(selectedCol) {
  const layer = document.getElementById(UI_IDS.outlineLayer);
  const canvas = document.getElementById("boardCanvas") || ensureCanvas();
  if (!layer || !canvas || selectedCol == null) return;
  lastSelectedCol = selectedCol;

  const rows = (cachedGrid && cachedGrid.length) || 20;
  const cols = (cachedGrid && cachedGrid[0] && cachedGrid[0].length) || 30;
  const { cell, gap, step, height } = computeCanvasMetrics(rows, cols);

  // Compute offset between canvas and overlay layer
  const layerRect = layer.getBoundingClientRect();
  const canvasRect = canvas.getBoundingClientRect();
  const offsetX = canvasRect.left - layerRect.left;
  const offsetY = canvasRect.top - layerRect.top;

  const x = offsetX + selectedCol * step;
  const y = offsetY;
  const w = cell; // highlight only the cell width, not the gap
  const h = Math.round(height);

  let hi = document.getElementById(UI_IDS.highlightCol);
  if (!hi) {
    hi = document.createElement("div");
    hi.id = UI_IDS.highlightCol;
    hi.style.position = "absolute";
    hi.style.pointerEvents = "none";
    hi.style.zIndex = "3";
    hi.style.background = "rgba(255, 209, 102, 0.28)"; // yellow semi-transparent
    hi.style.boxShadow = "inset 0 0 0 2px rgba(255, 209, 102, 0.5)";
    layer.appendChild(hi);
  }
  hi.style.left = `${Math.round(x)}px`;
  hi.style.top = `${Math.round(y)}px`;
  hi.style.width = `${Math.max(0, Math.round(w))}px`;
  hi.style.height = `${Math.max(0, h)}px`;
  hi.style.borderRadius = "4px";
}

/** Remove the yellow column highlight overlay, if present */
export function hideColumnHighlight() {
  const hi = document.getElementById(UI_IDS.highlightCol);
  if (hi && hi.parentElement) {
    hi.parentElement.removeChild(hi);
  }
}

export function enablePressedFeedback() {
  if (enablePressedFeedback._bound) return;
  const add = (el) => { if (el) el.classList.add("is-pressed"); };
  const remove = (el) => { if (el) el.classList.remove("is-pressed"); };
  document.addEventListener(
    "touchstart",
    (e) => {
      const btn = e.target && (e.target.closest && e.target.closest("button"));
      if (btn) add(btn);
    },
    { passive: true }
  );
  const endHandler = (e) => {
    const pressed = document.querySelectorAll("button.is-pressed");
    pressed.forEach((b) => remove(b));
  };
  document.addEventListener("touchend", endHandler, { passive: true });
  document.addEventListener("touchcancel", endHandler, { passive: true });
  enablePressedFeedback._bound = true;
}

export function applyResponsiveScale() {
  const cols = 30,
    rows = 20;
  const CELL0 = 20,
    GAP0 = 2,
    PAD = 8,
    BORDER = 6;

  const intrinsicW = cols * CELL0 + (cols - 1) * GAP0 + PAD * 2 + BORDER * 2;
  const intrinsicH = rows * CELL0 + (rows - 1) * GAP0 + PAD * 2 + BORDER * 2;

  const vw = Math.max(
    320,
    (window.visualViewport && window.visualViewport.width) ||
      window.innerWidth ||
      document.documentElement.clientWidth ||
      360
  );
  const vh = Math.max(
    320,
    (window.visualViewport && window.visualViewport.height) ||
      window.innerHeight ||
      document.documentElement.clientHeight ||
      480
  );
  const pagePaddingX = 24;
  const pagePaddingY = 24;
  const wScale = (vw - pagePaddingX) / intrinsicW;
  const hScale = (vh - pagePaddingY) / intrinsicH;
  SCALE = Math.min(1, Math.max(0, Math.min(wScale, hScale)));

  const root = document.documentElement;
  root.style.setProperty("--scale", String(SCALE));

  const outer = document.getElementById("gridOuter");
  if (outer) {
    outer.style.width = Math.round(intrinsicW * SCALE) + "px";
    outer.style.height = Math.round(intrinsicH * SCALE) + "px";
  }

  // Keep overlay SVG viewBox in sync with scaled size
  const layer = document.getElementById(UI_IDS.outlineLayer);
  if (layer) {
    const svg = layer.querySelector("#boxesSvg");
    if (svg) {
      svg.setAttribute(
        "viewBox",
        `0 0 ${layer.clientWidth} ${layer.clientHeight}`
      );
    }
  }

  if (typeof redrawFromCache === "function") redrawFromCache();
}

function px(n) {
  return Math.round(n * SCALE);
}

let boardCanvas = null;
let boardCtx = null;
let cachedGrid = null;
let cachedBlocked = null;
let cachedLastMove = null;
let lastSelectedCol = null;
// Track cells currently animating a drop so we suppress static drawing
let animatingCells = new Set();

function ensureCanvas() {
  if (!boardCanvas) {
    boardCanvas = document.createElement("canvas");
    boardCanvas.id = "boardCanvas";
    boardCanvas.style.display = "block";
  }
  const host = document.getElementById(UI_IDS.gameGrid);
  if (host && boardCanvas.parentElement !== host) host.appendChild(boardCanvas);
  if (!boardCtx) boardCtx = boardCanvas.getContext("2d");
  return boardCanvas;
}

function computeCanvasMetrics(rows, cols) {
  // Prefer measuring the actual inner content size of the grid container
  const gridEl = document.getElementById(UI_IDS.gameGrid);
  if (gridEl) {
    const cs = getComputedStyle(gridEl);
    const padL = parseFloat(cs.paddingLeft) || 0;
    const padR = parseFloat(cs.paddingRight) || 0;
    const padT = parseFloat(cs.paddingTop) || 0;
    const padB = parseFloat(cs.paddingBottom) || 0;
    const contentW = Math.max(0, gridEl.clientWidth - padL - padR);
    const contentH = Math.max(0, gridEl.clientHeight - padT - padB);
    if (contentW > 0 && contentH > 0) {
      const baseW = cols * CELL + (cols - 1) * GAP;
      const baseH = rows * CELL + (rows - 1) * GAP;
      // Calculate scale from the measured content box; ensure square cells using min of both axes
      const sW = contentW / baseW;
      const sH = contentH / baseH;
      const s = Math.min(sW, sH);
      const cell = CELL * s;
      const gap = GAP * s;
      const step = cell + gap;
      // Use measured content size to ensure perfect edge fit (round to integers for CSS pixels)
      const width = Math.round(cols * step - gap);
      const height = Math.round(rows * step - gap);
      return { cell, gap, step, width, height };
    }
  }

  // Fallback: derive from global SCALE
  const s = getScale();
  const cell = CELL * s;
  const gap = GAP * s;
  const step = cell + gap;
  const width = cols * step - gap;
  const height = rows * step - gap;
  return { cell, gap, step, width, height };
}

function drawBoardFromState(grid, blockedCells, lastMove) {
  const rows = grid?.length || 20;
  const cols = grid?.[0]?.length || 30;
  const c = ensureCanvas();
  const ctx = boardCtx;
  const { cell, gap, step, width, height } = computeCanvasMetrics(rows, cols);

  // Ensure crisp drawing by matching canvas backing store to device pixels
  const dpr = (window.devicePixelRatio || 1);
  const targetW = Math.ceil(width * dpr);
  const targetH = Math.ceil(height * dpr);
  if (c.width !== targetW || c.height !== targetH) {
    c.width = targetW;
    c.height = targetH;
  }
  c.style.width = width + "px";
  c.style.height = height + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  ctx.clearRect(0, 0, width, height);

  const baseA = "#f8f9fa";
  const baseB = "#e9ecef";
  const redA = getComputedStyle(document.documentElement).getPropertyValue("--p1").trim() || "#ff6b6b";
  const redB = "#ff5252";
  const blueA = getComputedStyle(document.documentElement).getPropertyValue("--p2").trim() || "#4dabf7";
  const blueB = "#2796f3";
  const borderCol = "rgba(255,255,255,0.30)";
  const hl = getComputedStyle(document.documentElement).getPropertyValue("--highlight").trim() || "#ffd166";

  let hatchPattern = null;
  (function () {
    const p = document.createElement("canvas");
    p.width = 8;
    p.height = 8;
    const pctx = p.getContext("2d");
    pctx.fillStyle = "rgba(0,0,0,0.06)";
    pctx.fillRect(0, 0, 8, 8);
    pctx.strokeStyle = "rgba(255,255,255,0.12)";
    pctx.lineWidth = 2;
    pctx.beginPath();
    pctx.moveTo(-2, 8);
    pctx.lineTo(8, -2);
    pctx.stroke();
    hatchPattern = ctx.createPattern(p, "repeat");
  })();

  for (let r = 0; r < rows; r++) {
    const y = r * step;
    for (let col = 0; col < cols; col++) {
      const x = col * step;
      const cellKey = r + "-" + col;
      const val = grid ? grid[r][col] : 0;
      // If this cell is animating, visually treat it as empty for now
      const displayVal = animatingCells.has(cellKey) && (val === 1 || val === 2) ? 0 : val;

      let g;
      if (displayVal === 1) {
        g = ctx.createLinearGradient(x, y, x + cell, y + cell);
        g.addColorStop(0, redA);
        g.addColorStop(1, redB);
      } else if (displayVal === 2) {
        g = ctx.createLinearGradient(x, y, x + cell, y + cell);
        g.addColorStop(0, blueA);
        g.addColorStop(1, blueB);
      } else {
        g = ctx.createLinearGradient(x, y, x + cell, y + cell);
        g.addColorStop(0, baseA);
        g.addColorStop(1, baseB);
      }

      // Base fill with slight translucency to keep grid visible
      ctx.save();
      ctx.globalAlpha = displayVal ? 0.92 : 1.0;
      // Soft outer glow per piece color
      if (displayVal === 1) {
        ctx.shadowColor = "rgba(255, 80, 80, 0.45)";
        ctx.shadowBlur = Math.max(6, cell * 0.25);
      } else if (displayVal === 2) {
        ctx.shadowColor = "rgba(77, 171, 247, 0.45)";
        ctx.shadowBlur = Math.max(6, cell * 0.25);
      } else {
        ctx.shadowBlur = 0;
      }
      ctx.fillStyle = g;
      ctx.fillRect(x, y, cell, cell);
      ctx.restore();

      // Inner shadow for depth
      if (displayVal === 1 || displayVal === 2) {
        ctx.save();
        ctx.strokeStyle = "rgba(0,0,0,0.18)";
        ctx.lineWidth = Math.max(1, Math.round(cell * 0.04));
        ctx.strokeRect(x + ctx.lineWidth / 2, y + ctx.lineWidth / 2, cell - ctx.lineWidth, cell - ctx.lineWidth);
        ctx.restore();

        // Gloss highlight at the top-left as white curved gradient overlay
        ctx.save();
        const gloss = ctx.createRadialGradient(x + cell * 0.28, y + cell * 0.22, cell * 0.1, x + cell * 0.28, y + cell * 0.22, cell * 0.7);
        gloss.addColorStop(0, "rgba(255,255,255,0.35)");
        gloss.addColorStop(0.4, "rgba(255,255,255,0.15)");
        gloss.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = gloss;
        ctx.globalCompositeOperation = "lighter";
        ctx.fillRect(x, y, cell, cell);
        ctx.restore();

        // Specular highlight dot for a premium glossy feel
        ctx.save();
        const dot = ctx.createRadialGradient(
          x + cell * 0.22,
          y + cell * 0.18,
          0,
          x + cell * 0.22,
          y + cell * 0.18,
          cell * 0.12
        );
        dot.addColorStop(0, "rgba(255,255,255,0.9)");
        dot.addColorStop(0.5, "rgba(255,255,255,0.35)");
        dot.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = dot;
        ctx.globalCompositeOperation = "lighter";
        ctx.fillRect(x, y, cell, cell);
        ctx.restore();

        // Subtle brushed light streak to mimic material texture
        ctx.save();
        const streak = ctx.createLinearGradient(x, y + cell * 0.2, x + cell, y + cell * 0.3);
        streak.addColorStop(0, "rgba(255,255,255,0.06)");
        streak.addColorStop(0.5, "rgba(255,255,255,0.08)");
        streak.addColorStop(1, "rgba(255,255,255,0.02)");
        ctx.fillStyle = streak;
        ctx.globalCompositeOperation = "overlay";
        ctx.globalAlpha = 0.35;
        ctx.fillRect(x, y + cell * 0.12, cell, cell * 0.22);
        ctx.restore();
      }

      // Subtle border to separate cells
      ctx.strokeStyle = borderCol;
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, cell, cell);

      const key = r + "-" + col;
      if (blockedCells && blockedCells.has && blockedCells.has(key)) {
        ctx.fillStyle = hatchPattern;
        ctx.fillRect(x, y, cell, cell);
      }
    }
  }

  if (lastMove && (!blockedCells || !blockedCells.has(`${lastMove.row}-${lastMove.col}`))) {
    const x = lastMove.col * step;
    const y = lastMove.row * step;
    ctx.lineWidth = Math.max(2, Math.round(cell * 0.12));
    ctx.strokeStyle = hl;
    ctx.strokeRect(x + 1, y + 1, cell - 2, cell - 2);
  }
}

function redrawFromCache() {
  if (boardCanvas && cachedGrid) {
    drawBoardFromState(cachedGrid, cachedBlocked || new Set(), cachedLastMove || null);
  }
}

/** Create a transient pop overlay at a given cell position (row/col) */
function showPopAtCell(row, col, color) {
  try {
    const layer = document.getElementById(UI_IDS.outlineLayer);
    const canvas = document.getElementById("boardCanvas") || ensureCanvas();
    if (!layer || !canvas) return;

    const rows = (cachedGrid && cachedGrid.length) || 20;
    const cols = (cachedGrid && cachedGrid[0] && cachedGrid[0].length) || 30;
    const { cell, gap, step } = computeCanvasMetrics(rows, cols);

    const layerRect = layer.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    const offsetX = canvasRect.left - layerRect.left;
    const offsetY = canvasRect.top - layerRect.top;

    const x = offsetX + col * step;
    const y = offsetY + row * step;

    const el = document.createElement("div");
    el.className = `pop-cell ${color === "red" ? "red" : "blue"} drop-in`;
    el.style.left = `${Math.round(x)}px`;
    el.style.top = `${Math.round(y)}px`;
    el.style.width = `${Math.round(cell)}px`;
    el.style.height = `${Math.round(cell)}px`;
    // Full-column drop: distance from above canvas top to landing cell
    const startAbove = Math.max(20, Math.round(cell * 0.8));
    const dropY = Math.max(0, Math.round(row * step + startAbove));
    const bounceY = Math.max(4, Math.min(8, Math.round(cell * 0.18)));
    el.style.setProperty('--drop-y', `${dropY}px`);
    el.style.setProperty('--bounce-y', `${bounceY}px`);
    layer.appendChild(el);

    const remove = () => {
      if (el && el.parentElement) el.parentElement.removeChild(el);
      // Reveal the static piece now that animation is done
      animatingCells.delete(`${row}-${col}`);
      redrawFromCache();
    };
    el.addEventListener("animationend", remove, { once: true });
    // Fallback removal (longer than animation duration)
    setTimeout(remove, 900);
  } catch {}
}

// Observe grid container size and keep canvas perfectly fitted
let gridRO = null;
function ensureGridResizeObserver() {
  if (gridRO) return;
  const target = document.getElementById(UI_IDS.gridOuter) || document.getElementById(UI_IDS.gameGrid);
  if (!target) return;
  try {
    gridRO = new ResizeObserver(() => {
      // Keep CSS scale reactive and redraw the canvas to the new measured size
      applyResponsiveScale();
      redrawFromCache();
      // Only reposition highlight if it already exists (avoid recreating in Tap mode)
      const hi = document.getElementById(UI_IDS.highlightCol);
      if (hi && lastSelectedCol != null) updateColumnHighlight(lastSelectedCol);
    });
    gridRO.observe(target);
  } catch (e) {
    // ResizeObserver not available; rely on window resize listener
  }
}

/** Clear all board rendering state (canvas, overlay, and caches). UI-only. */
export function resetBoardUI() {
  // Clear caches used by redrawFromCache to prevent old state from reappearing
  cachedGrid = null;
  cachedBlocked = null;
  cachedLastMove = null;
  uiLastMoveToken = 0;
  lastSelectedCol = null;

  // Remove canvas so buildGrid can recreate a fresh one
  const host = document.getElementById(UI_IDS.gameGrid);
  if (host) host.innerHTML = "";
  boardCanvas = null;
  boardCtx = null;

  // Clear overlay layer (outlines, win strikes, etc.)
  const layer = document.getElementById(UI_IDS.outlineLayer);
  if (layer) layer.innerHTML = "";
}

/** Track which move is the real "last move" to avoid race conditions */
let uiLastMoveToken = 0;

/** Update header, scores, banner, and balance meter */
export function updateDisplay(
  currentPlayer,
  gameMode,
  aiDifficulty,
  scoringMode,
  redScore,
  blueScore
) {
  const redEl = document.getElementById(UI_IDS.redGames);
  const blueEl = document.getElementById(UI_IDS.blueGames);
  if (redEl) {
    const prev = redEl.textContent;
    if (prev !== String(redScore)) {
      redEl.textContent = redScore;
      redEl.classList.remove("bump");
      // restart animation
      void redEl.offsetWidth;
      redEl.classList.add("bump");
      setTimeout(() => redEl && redEl.classList.remove("bump"), 220);
    }
  }
  if (blueEl) {
    const prev = blueEl.textContent;
    if (prev !== String(blueScore)) {
      blueEl.textContent = blueScore;
      blueEl.classList.remove("bump");
      void blueEl.offsetWidth;
      blueEl.classList.add("bump");
      setTimeout(() => blueEl && blueEl.classList.remove("bump"), 220);
    }
  }

  const redScoreEl = document.getElementById(UI_IDS.redScore);
  const blueScoreEl = document.getElementById(UI_IDS.blueScore);
  if (redScoreEl && blueScoreEl) {
    redScoreEl.classList.remove(CSS.LEADING);
    blueScoreEl.classList.remove(CSS.LEADING);
    if (redScore > blueScore) redScoreEl.classList.add(CSS.LEADING);
    else if (blueScore > redScore) blueScoreEl.classList.add(CSS.LEADING);
  }

  const total = Math.max(1, redScore + blueScore);
  const pctR = (redScore / total) * 100;
  const pctB = 100 - pctR;
  const meterR = document.getElementById("scoreMeterRed");
  const meterB = document.getElementById("scoreMeterBlue");
  if (meterR && meterB) {
    meterR.style.width = pctR + "%";
    meterB.style.width = pctB + "%";
  }

  // Update thin bar left/right labels (no color names)
  const thinRed = document.getElementById(UI_IDS.thinRedLabel);
  if (thinRed) thinRed.textContent = "Player 1";

  const thinBlue = document.getElementById(UI_IDS.thinBlueLabel);
  if (thinBlue) {
    if (gameMode === "single") {
      const name = aiDifficulty
        ? aiDifficulty.charAt(0).toUpperCase() + aiDifficulty.slice(1)
        : null;
      thinBlue.textContent = name ? `${name} AI` : "AI";
    } else {
      thinBlue.textContent = "Player 2";
    }
  }

  const currentPlayerSpan = document.getElementById(UI_IDS.currentPlayer);
  const currentPlayerBanner = document.getElementById(UI_IDS.currentPlayerBanner);
  if (currentPlayerSpan && currentPlayerBanner) {
    currentPlayerBanner.classList.remove(CSS.PLAYER1_TURN, CSS.PLAYER2_TURN);

    if (currentPlayer === PLAYER.RED) {
      currentPlayerSpan.textContent =
        gameMode === "single" ? "You (Red)" : "Player 1 (Red)";
      currentPlayerSpan.className = CSS.PLAYER1;
      currentPlayerBanner.classList.add(CSS.PLAYER1_TURN);
    } else {
      if (gameMode === "single") {
        currentPlayerSpan.textContent = "Computer (Blue)";
        currentPlayerSpan.className = `${CSS.PLAYER2} ${CSS.COMPUTER_TURN}`;
      } else {
        currentPlayerSpan.textContent = "Player 2 (Blue)";
        currentPlayerSpan.className = CSS.PLAYER2;
      }
      currentPlayerBanner.classList.add(CSS.PLAYER2_TURN);
    }
  }
}

/** Build grid (delegated click) */
export function buildGrid(rows, cols, onColumnClick) {
  const gameGrid = document.getElementById(UI_IDS.gameGrid);
  gameGrid.innerHTML = "";
  const c = ensureCanvas();
  const { width, height } = computeCanvasMetrics(rows, cols);
  c.width = width;
  c.height = height;
  c.style.width = width + "px";
  c.style.height = height + "px";
  const empty = Array.from({ length: rows }, () => Array(cols).fill(0));
  // Cache an empty board so any subsequent redraws (e.g., ResizeObserver) can render immediately
  cachedGrid = empty;
  cachedBlocked = new Set();
  cachedLastMove = null;
  drawBoardFromState(empty, cachedBlocked, cachedLastMove);
  ensureBoxesSvg();
  // Start observing size changes so the canvas always fills the border perfectly
  ensureGridResizeObserver();
  // Ensure CSS scale is correct and repaint once after initial mount
  applyResponsiveScale();
  redrawFromCache();
}

/**
 * Update a single cell with a ghost chip animation.
 */
export function updateCellDisplay(
  grid,
  blockedCells,
  _prevLastMove,
  row,
  col,
  token
) {
  uiLastMoveToken = token;
  cachedGrid = grid;
  cachedBlocked = blockedCells;
  cachedLastMove = _prevLastMove;
  // If this is a newly placed piece, mark it animating so we hide the static draw
  try {
    const val = grid?.[row]?.[col] || 0;
    if (val === 1 || val === 2) {
      animatingCells.add(`${row}-${col}`);
    }
  } catch {}
  // Draw with animating cell suppressed
  drawBoardFromState(grid, blockedCells, _prevLastMove);
  // Transient dropping overlay for the cell that just changed
  try {
    const val = grid?.[row]?.[col] || 0;
    if (val === 1 || val === 2) showPopAtCell(row, col, val === 1 ? "red" : "blue");
  } catch {}
}

/** Update every cell */
export function updateAllCellDisplays(
  grid,
  blockedCells,
  lastMovePosition,
  rows,
  cols
) {
  cachedGrid = grid;
  cachedBlocked = blockedCells;
  cachedLastMove = lastMovePosition;
  drawBoardFromState(grid, blockedCells, lastMovePosition);
}

/* ---------- Single SVG overlay for boxes ---------- */
function ensureBoxesSvg() {
  const layer = document.getElementById(UI_IDS.outlineLayer);
  if (!layer) return;

  let svg = layer.querySelector("#boxesSvg");
  if (svg) return svg;

  svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("id", "boxesSvg");
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", "100%");
  svg.setAttribute("viewBox", `0 0 ${layer.clientWidth} ${layer.clientHeight}`);
  svg.style.position = "absolute";
  svg.style.inset = "0";
  svg.style.pointerEvents = "none";

  const defs = document.createElementNS(svg.namespaceURI, "defs");

  const mkPattern = (id, base, stripe, alpha) => {
    const p = document.createElementNS(svg.namespaceURI, "pattern");
    p.setAttribute("id", id);
    p.setAttribute("patternUnits", "userSpaceOnUse");
    p.setAttribute("width", "20");
    p.setAttribute("height", "20");
    p.setAttribute("patternTransform", "rotate(45)");

    const bg = document.createElementNS(svg.namespaceURI, "rect");
    bg.setAttribute("width", "20");
    bg.setAttribute("height", "20");
    bg.setAttribute("fill", `rgba(${base},${alpha})`);
    p.appendChild(bg);

    const line = document.createElementNS(svg.namespaceURI, "rect");
    line.setAttribute("x", "0");
    line.setAttribute("y", "0");
    line.setAttribute("width", "8");
    line.setAttribute("height", "20");
    line.setAttribute("fill", `rgba(${stripe},0.16)`);
    p.appendChild(line);
    defs.appendChild(p);
  };

  mkPattern("hatch-red", "255,107,107", "255,255,255", 0.18);
  mkPattern("hatch-blue", "77,171,247", "255,255,255", 0.18);

  const mkGlow = (id, color) => {
    const f = document.createElementNS(svg.namespaceURI, "filter");
    f.setAttribute("id", id);
    f.setAttribute("x", "-20%");
    f.setAttribute("y", "-20%");
    f.setAttribute("width", "140%");
    f.setAttribute("height", "140%");
    const fe = document.createElementNS(svg.namespaceURI, "feDropShadow");
    fe.setAttribute("dx", "0");
    fe.setAttribute("dy", "0");
    fe.setAttribute("stdDeviation", "4");
    fe.setAttribute("flood-color", color);
    fe.setAttribute("flood-opacity", "0.55");
    f.appendChild(fe);
    defs.appendChild(f);
  };
  mkGlow("glow-red", "#ff6b6b");
  mkGlow("glow-blue", "#4dabf7");

  svg.appendChild(defs);

  const g = document.createElementNS(svg.namespaceURI, "g");
  g.setAttribute("id", "boxesGroup");
  svg.appendChild(g);

  layer.appendChild(svg);
  return svg;
}

export function drawOutlineRect(minRow, maxRow, minCol, maxCol, player) {
  const layer = document.getElementById(UI_IDS.outlineLayer);
  if (!layer) return;
  const svg = ensureBoxesSvg();

  // Compute geometry directly from the canvas metrics and its offset
  const canvas = document.getElementById("boardCanvas") || ensureCanvas();
  const layerRect = layer.getBoundingClientRect();
  const canvasRect = canvas.getBoundingClientRect();
  const offsetX = canvasRect.left - layerRect.left;
  const offsetY = canvasRect.top - layerRect.top;

  const rows = (cachedGrid && cachedGrid.length) || 20;
  const cols = (cachedGrid && cachedGrid[0] && cachedGrid[0].length) || 30;
  const { cell, gap, step } = computeCanvasMetrics(rows, cols);

  const colsSpan = maxCol - minCol + 1;
  const rowsSpan = maxRow - minRow + 1;

  const xBase = offsetX + minCol * step;
  const yBase = offsetY + minRow * step;
  const wBase = colsSpan * cell + (colsSpan - 1) * gap;
  const hBase = rowsSpan * cell + (rowsSpan - 1) * gap;

  // Keep stroke fully inside the cell bounds to avoid overlap onto neighbors.
  const strokeWidth = Math.max(1, Math.round(getScale() * 2));
  const x = xBase + strokeWidth / 2;
  const y = yBase + strokeWidth / 2;
  const w = Math.max(0, wBase - strokeWidth);
  const h = Math.max(0, hBase - strokeWidth);

  const rect = document.createElementNS(svg.namespaceURI, "rect");
  // Use subpixel values to avoid rounding drift; no Math.round here.
  rect.setAttribute("x", String(x));
  rect.setAttribute("y", String(y));
  rect.setAttribute("width", String(w));
  rect.setAttribute("height", String(h));
  rect.setAttribute(
    "fill",
    player === PLAYER.RED ? "url(#hatch-red)" : "url(#hatch-blue)"
  );
  rect.setAttribute(
    "filter",
    player === PLAYER.RED ? "url(#glow-red)" : "url(#glow-blue)"
  );
  rect.setAttribute(
    "stroke",
    player === PLAYER.RED ? "rgba(255,107,107,.9)" : "rgba(77,171,247,.9)"
  );
  rect.setAttribute("stroke-width", String(strokeWidth));
  rect.setAttribute("rx", Math.max(0, 4 * getScale()));
  rect.setAttribute("ry", Math.max(0, 4 * getScale()));

  svg.querySelector("#boxesGroup").appendChild(rect);
}

export function drawWinStrike(winningLine, player) {
  const layer = document.getElementById(UI_IDS.outlineLayer);
  const canvas = document.getElementById("boardCanvas") || ensureCanvas();
  if (!layer || !canvas) return;

  const layerRect = layer.getBoundingClientRect();
  const canvasRect = canvas.getBoundingClientRect();
  const offsetX = canvasRect.left - layerRect.left;
  const offsetY = canvasRect.top - layerRect.top;

  const rows = (cachedGrid && cachedGrid.length) || 20;
  const cols = (cachedGrid && cachedGrid[0] && cachedGrid[0].length) || 30;
  const { cell, gap, step } = computeCanvasMetrics(rows, cols);

  const first = winningLine[0];
  const last = winningLine[winningLine.length - 1];

  const centerOf = (r, c) => ({
    x: offsetX + c * step + cell / 2,
    y: offsetY + r * step + cell / 2,
  });

  const p1 = centerOf(first.row, first.col);
  const p2 = centerOf(last.row, last.col);

  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  const thickness = Math.max(3, Math.round(cell * 0.18));

  const line = document.createElement("div");
  line.className = `win-strike ${player === PLAYER.RED ? "red" : "blue"}`;
  line.style.position = "absolute";
  line.style.left = `${p1.x}px`;
  line.style.top = `${p1.y - thickness / 2}px`;
  line.style.width = `${len}px`;
  line.style.height = `${thickness}px`;
  line.style.transformOrigin = "left center";
  line.style.transform = `rotate(${angle}deg)`;
  layer.appendChild(line);
}

/* ------- Modals & labels ------- */
export function showEndGameModal(winnerLabel, redScore, blueScore) {
  const modal = document.getElementById(UI_IDS.endGameModal);
  const title = document.getElementById(UI_IDS.endGameTitle);
  const subtitle = document.getElementById(UI_IDS.endGameSubtitle);

  title.textContent = "Game Over";

  if (redScore === blueScore) {
    subtitle.innerHTML = `<strong style="color: white;">Draw</strong><br>Final Score: ${redScore} - ${blueScore}`;
  } else if (winnerLabel.includes("Red")) {
    subtitle.innerHTML = `<strong style="color: #ff4444;">${winnerLabel} Wins!</strong><br>Final Score: ${redScore} - ${blueScore}`;
  } else {
    subtitle.innerHTML = `<strong style="color: #4444ff;">${winnerLabel} Wins!</strong><br>Final Score: ${redScore} - ${blueScore}`;
  }

  modal.classList.remove(CSS.HIDDEN);
  modal.setAttribute("aria-hidden", "false");
}

export function hideEndGameModal() {
  const modal = document.getElementById(UI_IDS.endGameModal);
  modal.classList.add(CSS.HIDDEN);
  modal.setAttribute("aria-hidden", "true");
}

/** Show instructions text; if Quick Fire, include the chosen target */
export function showInstructions(scoringMode, quickFireTarget) {
  const instructionsModal = document.getElementById(UI_IDS.instructionsModal);
  const body = document.getElementById("instructionsBody");

  const general =
    "Drop your discs into the grid and try to connect four in a row — horizontally, vertically, or diagonally. When a player connects four, that area of the board becomes blocked off with a glowing outline. The game continues until the board is full.";

  const classic =
    "<strong>Classic:</strong> each captured box scores <em>1 point</em>.";
  const area =
    "<strong>Territory Takedown:</strong> score the <em>number of squares</em> inside the captured zone. Overlaps can <em>steal</em> territory.";
  const quick = `<strong>Quick Fire:</strong> Classic scoring, but the first player to <em>${quickFireTarget} box${
    quickFireTarget === 1 ? "" : "es"
  }</em> wins immediately.`;

  let modeText = classic;
  if (scoringMode === SCORING_MODES.AREA) modeText = area;
  else if (scoringMode === SCORING_MODES.QUICKFIRE) modeText = quick;

  body.innerHTML = `${general}<br><br>${modeText}`;

  instructionsModal.classList.remove(CSS.HIDDEN);
  instructionsModal.setAttribute("aria-hidden", "false");
}

export function closeInstructionsUI(afterCloseCallback) {
  const modal = document.getElementById(UI_IDS.instructionsModal);
  if (!modal) return;
  modal.classList.add(CSS.HIDDEN);
  modal.setAttribute("aria-hidden", "true");
  if (typeof afterCloseCallback === "function") afterCloseCallback();
}

/** Update title/labels; include Quick Fire target when relevant */
export function updateLabelsForModeUI(
  gameMode,
  aiDifficulty,
  scoringMode,
  quickFireTarget
) {
  const gameTitle = document.getElementById(UI_IDS.gameTitle);
  const redLabel = document.getElementById(UI_IDS.redLabel);
  const blueLabel = document.getElementById(UI_IDS.blueLabel);

  // Compose center mode text for thin bar (short forms)
  let centerMode = "1 point per box";
  if (scoringMode === SCORING_MODES.AREA) centerMode = "Area Mode";
  if (scoringMode === SCORING_MODES.QUICKFIRE) {
    const n = quickFireTarget ?? 5;
    centerMode = `Best to ${n}`;
  }

  const thinModeEl = document.getElementById(UI_IDS.thinMode);
  if (thinModeEl) thinModeEl.textContent = centerMode;

  // Update left/right labels for thin bar consistently on mode/difficulty changes
  const thinRed2 = document.getElementById(UI_IDS.thinRedLabel);
  if (thinRed2) thinRed2.textContent = "Player 1";

  const thinBlue2 = document.getElementById(UI_IDS.thinBlueLabel);
  if (thinBlue2) {
    if (gameMode === "single") {
      const difficultyName = aiDifficulty
        ? aiDifficulty.charAt(0).toUpperCase() + aiDifficulty.slice(1)
        : null;
      thinBlue2.textContent = difficultyName ? `${difficultyName} AI` : "AI";
    } else {
      thinBlue2.textContent = "Player 2";
    }
  }

  // Update legacy big header elements only if present
  let suffix = " — Classic";
  if (scoringMode === SCORING_MODES.AREA) suffix = " — Territory Takedown";
  if (scoringMode === SCORING_MODES.QUICKFIRE) {
    const n = quickFireTarget ?? 5;
    suffix = ` — Quick Fire (First to ${n})`;
  }

  if (gameTitle && redLabel && blueLabel) {
    if (gameMode === "single") {
      gameTitle.textContent = "SQUARE WARS SINGLEPLAYER" + suffix;
      redLabel.textContent = "You (Red)";
      if (aiDifficulty) {
        const difficultyName =
          aiDifficulty.charAt(0).toUpperCase() + aiDifficulty.slice(1);
        blueLabel.textContent = `Computer (Blue) - ${difficultyName}`;
      } else {
        blueLabel.textContent = "Computer (Blue)";
      }
    } else if (gameMode === "multi") {
      gameTitle.textContent = "SQUARE WARS MULTIPLAYER" + suffix;
      redLabel.textContent = "Player 1 (Red)";
      blueLabel.textContent = "Player 2 (Blue)";
    } else {
      gameTitle.textContent = "SQUARE WARS";
    }
  }
}
