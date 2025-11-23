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

  if (c.width !== Math.ceil(width) || c.height !== Math.ceil(height)) {
    c.width = Math.ceil(width);
    c.height = Math.ceil(height);
    c.style.width = c.width + "px";
    c.style.height = c.height + "px";
  }

  ctx.clearRect(0, 0, width, height);

  const baseA = "#f8f9fa";
  const baseB = "#e9ecef";
  const redA = getComputedStyle(document.documentElement).getPropertyValue("--p1").trim() || "#ff6b6b";
  const redB = "#ff5252";
  const blueA = getComputedStyle(document.documentElement).getPropertyValue("--p2").trim() || "#4dabf7";
  const blueB = "#2796f3";
  const borderCol = "rgba(255,255,255,0.35)";
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
      const val = grid ? grid[r][col] : 0;

      let g;
      if (val === 1) {
        g = ctx.createLinearGradient(x, y, x + cell, y + cell);
        g.addColorStop(0, redA);
        g.addColorStop(1, redB);
      } else if (val === 2) {
        g = ctx.createLinearGradient(x, y, x + cell, y + cell);
        g.addColorStop(0, blueA);
        g.addColorStop(1, blueB);
      } else {
        g = ctx.createLinearGradient(x, y, x + cell, y + cell);
        g.addColorStop(0, baseA);
        g.addColorStop(1, baseB);
      }

      ctx.fillStyle = g;
      ctx.fillRect(x, y, cell, cell);
      ctx.strokeStyle = borderCol;
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, cell - 1, cell - 1);

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
    ctx.lineWidth = Math.max(2, Math.round(getScale() * 3));
    ctx.strokeStyle = hl;
    ctx.strokeRect(x + 1, y + 1, cell - 2, cell - 2);
  }
}

function redrawFromCache() {
  if (boardCanvas && cachedGrid) {
    drawBoardFromState(cachedGrid, cachedBlocked || new Set(), cachedLastMove || null);
  }
}

/** Clear all board rendering state (canvas, overlay, and caches). UI-only. */
export function resetBoardUI() {
  // Clear caches used by redrawFromCache to prevent old state from reappearing
  cachedGrid = null;
  cachedBlocked = null;
  cachedLastMove = null;
  uiLastMoveToken = 0;

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
  document.getElementById(UI_IDS.redGames).textContent = redScore;
  document.getElementById(UI_IDS.blueGames).textContent = blueScore;

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

  // Update thin bar Blue label with AI difficulty in single-player
  const thinBlue = document.getElementById(UI_IDS.thinBlueLabel);
  if (thinBlue) {
    if (gameMode === "single") {
      const name = aiDifficulty
        ? aiDifficulty.charAt(0).toUpperCase() + aiDifficulty.slice(1)
        : null;
      thinBlue.textContent = name ? `Blue — ${name} AI` : "Blue — AI";
    } else {
      thinBlue.textContent = "Blue";
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
  drawBoardFromState(empty, new Set(), null);
  ensureBoxesSvg();
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
  drawBoardFromState(grid, blockedCells, _prevLastMove);
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
  const outlineLayer = document.getElementById(UI_IDS.outlineLayer);
  if (!outlineLayer) return;

  const first = winningLine[0];
  const last = winningLine[winningLine.length - 1];

  const centerOf = (r, c) => ({
    x: px(GRID_PADDING + c * (CELL + GAP) + CELL / 2),
    y: px(GRID_PADDING + r * (CELL + GAP) + CELL / 2),
  });

  const p1 = centerOf(first.row, first.col);
  const p2 = centerOf(last.row, last.col);

  const dx = p2.x - p1.x,
    dy = p2.y - p1.y;
  const len = Math.sqrt(dx * dx + dy * dy) + 2;
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

  const line = document.createElement("div");
  line.className = `win-strike ${player === PLAYER.RED ? "red" : "blue"}`;
  line.style.left = `${p1.x}px`;
  line.style.top = `${p1.y - 2}px`;
  line.style.width = `${len}px`;
  line.style.transformOrigin = "left center";
  line.style.transform = `rotate(${angle}deg)`;
  outlineLayer.appendChild(line);
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

  // Update Blue label in thin bar for single-player AI
  const thinBlue = document.getElementById(UI_IDS.thinBlueLabel);
  if (thinBlue) {
    if (gameMode === "single") {
      const difficultyName = aiDifficulty
        ? aiDifficulty.charAt(0).toUpperCase() + aiDifficulty.slice(1)
        : null;
      thinBlue.textContent = difficultyName
        ? `Blue — ${difficultyName} AI`
        : "Blue — AI";
    } else {
      thinBlue.textContent = "Blue";
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
