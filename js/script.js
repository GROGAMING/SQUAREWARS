// ===== SQUARE WARS — script.js =====
import {
  ROWS,
  COLS,
  PLAYER,
  GAME_MODES,
  SCORING_MODES,
  UI_IDS,
  CSS,
  DIRECTIONS,
  KEY,
  AI,
  QUICKFIRE_DEFAULT,
  CELL_PX,
  GAP_PX,
} from "./constants.js";

import {
  updateDisplay,
  buildGrid,
  updateCellDisplay,
  updateAllCellDisplays,
  drawOutlineRect,
  drawWinStrike,
  showEndGameModal,
  hideEndGameModal,
  showInstructions as showInstructionsUI,
  closeInstructionsUI,
  updateLabelsForModeUI,
  applyResponsiveScale,
  getScale,
  resetBoardUI,
} from "./ui.js";

import { chooseComputerMove } from "./ai.js";

let grid = [];
let currentPlayer = PLAYER.RED;
let blockedCells = new Set();
let redGames = 0;
let blueGames = 0;
let gameActive = true;
let lastMovePosition = null;
let gameMode = null;
let scoringMode = SCORING_MODES.CLASSIC;
let aiDifficulty = null;

// Chosen target for Quick Fire
let quickFireTarget = QUICKFIRE_DEFAULT;

let ownership = Object.create(null);
let moveToken = 0;

// --- NEW: tap handling state (mobile only) ---
const TAP_SLOP_PX = 8; // movement threshold in CSS px
let suppressNextClick = false;
let touchTrack = { active: false, id: null, startX: 0, startY: 0, moved: false };

let inputHandlersBound = false;
let inputHandlePick = (clientX) => {};
// Menu navigation stack for full-screen menu screens
let menuStack = [];

function setScreenVisibility(id, visible) {
  const el = document.getElementById(id);
  if (!el) return;
  if (visible) {
    el.classList.remove(CSS.HIDDEN);
    el.setAttribute("aria-hidden", "false");
  } else {
    el.classList.add(CSS.HIDDEN);
    el.setAttribute("aria-hidden", "true");
  }
}

function initMenuNav() {
  if (menuStack.length) return;
  const screens = Array.from(document.querySelectorAll('.menu-screen'));
  const visible = screens.find((el) => !el.classList.contains(CSS.HIDDEN));
  if (visible && visible.id) menuStack.push(visible.id);
  else if (document.getElementById('mainMenuScreen')) menuStack.push('mainMenuScreen');
}

function navigateTo(id) {
  initMenuNav();
  const current = menuStack[menuStack.length - 1];
  if (current === id) return;
  if (current) setScreenVisibility(current, false);
  hideGameScreen();
  setScreenVisibility(id, true);
  menuStack.push(id);
}

function menuBack() {
  if (menuStack.length <= 1) return; // root has no back
  const current = menuStack.pop();
  setScreenVisibility(current, false);
  const prev = menuStack[menuStack.length - 1];
  if (prev) setScreenVisibility(prev, true);
}

/* ------------ Scale helpers ------------ */
function px(n) {
  return Math.round(n * getScale());
}
function logicalFromClient(clientX, clientY) {
  const grid = document.getElementById(UI_IDS.gameGrid);
  const rect = grid.getBoundingClientRect();
  const s = getScale();
  const x = (clientX - rect.left) / s;
  const y = (clientY - rect.top) / s;
  return { x, y };
}
/* REPLACED: column calc now accounts for scaled border and padding */
function colFromClient(clientX) {
  const gridEl = document.getElementById(UI_IDS.gameGrid);
  const rect = gridEl.getBoundingClientRect();
  const cs = getComputedStyle(gridEl);
  const borderL = parseFloat(cs.borderLeftWidth) || 0;
  const padL = parseFloat(cs.paddingLeft) || 0;
  const s = getScale();

  // local x inside the grid content box
  const xLocal = clientX - rect.left - borderL - padL;

  // scaled step (cell + gap)
  const step = (CELL_PX + GAP_PX) * s;

  const rawCol = Math.floor(xLocal / step);
  return Math.max(0, Math.min(COLS - 1, rawCol));
}

/* ------------ Mode, scoring & difficulty ------------ */
function setGameMode(mode) {
  gameMode = mode;
  // Navigate to Scoring screen in full-screen flow
  navigateTo(UI_IDS.scoringSelectModal);
  // After grid is ready, compute scale
  applyResponsiveScale();
}

function setScoringMode(mode) {
  scoringMode = mode;
  if (mode === SCORING_MODES.QUICKFIRE) {
    openQuickfireModal();
    return;
  }

  // Classic / Area continue as normal
  ownership = Object.create(null);

  if (gameMode === GAME_MODES.SINGLE) {
    navigateTo(UI_IDS.difficultySelectModal);
  } else {
    updateLabelsForModeUI(gameMode, aiDifficulty, scoringMode, quickFireTarget);
    startGameFromMenu();
  }
}

/* ----- Quick Fire dedicated modal ----- */
function onQuickfireInput(inputEl) {
  const bubble = document.getElementById("qfBubble");
  if (!bubble || !inputEl) return;
  const min = Number(inputEl.min || 1);
  const max = Number(inputEl.max || 10);
  const val = Number(inputEl.value || 5);
  bubble.textContent = String(val);

  // position bubble centered above the thumb
  const pct = (val - min) / (max - min);
  const wrap = inputEl.parentElement; // .qf-range-wrap
  const wrapRect = wrap.getBoundingClientRect();
  const inputRect = inputEl.getBoundingClientRect();
  const usable = inputRect.width - 16; // approx thumb width
  const x = inputRect.left - wrapRect.left + 8 + usable * pct; // +8 centers on thumb
  bubble.style.left = `${x}px`;
}

function openQuickfireModal() {
  const input = document.getElementById("qfTarget");
  const bubble = document.getElementById("qfBubble");
  if (input) input.value = String(quickFireTarget);
  if (bubble) bubble.textContent = String(quickFireTarget);
  navigateTo(UI_IDS.quickfireSelectModal);
  // position once visible
  requestAnimationFrame(() => onQuickfireInput(input));
}

function backFromQuickfire() {
  // Back to previous menu screen in stack
  menuBack();
}

function confirmQuickfire() {
  const input = document.getElementById("qfTarget");
  const val = Number(input.value || 5);
  quickFireTarget = Math.max(1, Math.min(10, val));
  ownership = Object.create(null);

  if (gameMode === GAME_MODES.SINGLE) {
    navigateTo(UI_IDS.difficultySelectModal);
  } else {
    updateLabelsForModeUI(gameMode, aiDifficulty, scoringMode, quickFireTarget);
    startGameFromMenu();
  }
}

function setDifficulty(difficulty) {
  aiDifficulty = difficulty;
  updateLabelsForModeUI(gameMode, aiDifficulty, scoringMode, quickFireTarget);
  startGameFromMenu();
}

function showInstructions() {
  openTutorial();
}
function closeInstructions() {
  closeInstructionsUI(initGame);
}

/* ------------ Game init & grid ------------ */
function initGame() {
  grid = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  currentPlayer = PLAYER.RED;
  blockedCells = new Set();
  redGames = 0;
  blueGames = 0;
  gameActive = true;
  lastMovePosition = null;
  ownership = Object.create(null);
  moveToken = 0;

  const outlineLayer = document.getElementById(UI_IDS.outlineLayer);
  if (outlineLayer) outlineLayer.innerHTML = "";

  buildGrid(ROWS, COLS, () => {});

  // Scale-aware click/touch handlers
  const gameGrid = document.getElementById(UI_IDS.gameGrid);
  inputHandlePick = (clientX) => {
    const col = colFromClient(clientX);
    if (!gameActive) return;
    if (gameMode === GAME_MODES.SINGLE && currentPlayer !== PLAYER.RED) return;
    dropPiece(col);
  };
  if (gameGrid && !inputHandlersBound) {
    // remove previous direct handlers (if any)
    gameGrid.onclick = null;
    gameGrid.ontouchstart = null;
    gameGrid.ontouchmove = null;
    gameGrid.ontouchend = null;
    gameGrid.ontouchcancel = null;

    // Keep desktop click behavior; suppress synthetic click after a handled tap
    gameGrid.addEventListener("click", (e) => {
      if (suppressNextClick) {
        suppressNextClick = false;
        return;
      }
      inputHandlePick(e.clientX);
    });

    // NEW: Tap detection with movement threshold; do not block scrolling
    gameGrid.addEventListener(
      "touchstart",
      (e) => {
        if (e.touches.length !== 1) {
          touchTrack.active = false;
          return;
        }
        const t = e.touches[0];
        touchTrack.active = true;
        touchTrack.id = t.identifier;
        touchTrack.startX = t.clientX;
        touchTrack.startY = t.clientY;
        touchTrack.moved = false;
      },
      { passive: true }
    );

    gameGrid.addEventListener(
      "touchmove",
      (e) => {
        if (!touchTrack.active) return;
        // if multiple fingers appear, treat as not-a-tap
        if (e.touches.length !== 1) {
          touchTrack.moved = true;
          return;
        }
        const t = e.touches[0];
        const dx = t.clientX - touchTrack.startX;
        const dy = t.clientY - touchTrack.startY;
        if (dx * dx + dy * dy > TAP_SLOP_PX * TAP_SLOP_PX) {
          touchTrack.moved = true;
        }
      },
      { passive: true }
    );

    gameGrid.addEventListener(
      "touchend",
      (e) => {
        if (!touchTrack.active) return;
        // find the touch that ended that matches our tracked id
        let t = null;
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === touchTrack.id) {
            t = e.changedTouches[i];
            break;
          }
        }
        // fallback to first changed touch if id not found
        if (!t && e.changedTouches.length) t = e.changedTouches[0];

        const wasCleanTap = t && !touchTrack.moved;
        // reset tracking before potentially placing a piece
        touchTrack.active = false;
        touchTrack.id = null;

        if (wasCleanTap) {
          inputHandlePick(t.clientX);
          // prevent the following synthetic click from triggering another move
          suppressNextClick = true;
          setTimeout(() => (suppressNextClick = false), 400);
        }
      },
      { passive: true }
    );

    gameGrid.addEventListener(
      "touchcancel",
      () => {
        touchTrack.active = false;
        touchTrack.id = null;
        touchTrack.moved = false;
      },
      { passive: true }
    );

    inputHandlersBound = true;
  }

  ensureControlsUI();
  updateDisplay(
    currentPlayer,
    gameMode,
    aiDifficulty,
    scoringMode,
    redGames,
    blueGames
  );
}

function dropPiece(col) {
  if (!gameActive) return;

  for (let row = ROWS - 1; row >= 0; row--) {
    if (grid[row][col] === 0 && !blockedCells.has(`${row}-${col}`)) {
      grid[row][col] = currentPlayer;
      lastMovePosition = { row, col };

      const token = ++moveToken;
      updateCellDisplay(grid, blockedCells, lastMovePosition, row, col, token);

      const didWin = checkForWin(row, col);
      if (didWin) {
        if (
          scoringMode === SCORING_MODES.CLASSIC ||
          scoringMode === SCORING_MODES.QUICKFIRE
        ) {
          if (currentPlayer === PLAYER.RED) redGames++;
          else blueGames++;
        }
        currentPlayer = currentPlayer === PLAYER.RED ? PLAYER.BLUE : PLAYER.RED;
      } else {
        currentPlayer = currentPlayer === PLAYER.RED ? PLAYER.BLUE : PLAYER.RED;
      }

      updateDisplay(
        currentPlayer,
        gameMode,
        aiDifficulty,
        scoringMode,
        redGames,
        blueGames
      );
      checkEndOfGame();

      if (
        gameMode === GAME_MODES.SINGLE &&
        currentPlayer === PLAYER.BLUE &&
        gameActive
      ) {
        setTimeout(makeComputerMove, AI.COMPUTER_THINK_DELAY);
      }
      return;
    }
  }
}

function makeComputerMove() {
  if (
    !gameActive ||
    currentPlayer !== PLAYER.BLUE ||
    gameMode !== GAME_MODES.SINGLE
  )
    return;
  const col = chooseComputerMove({ grid, blockedCells, aiDifficulty });
  if (col !== -1) dropPiece(col);
}

/* ------------ Rules & helpers ------------ */
function hasAnyValidMove() {
  for (let c = 0; c < COLS; c++) {
    for (let r = ROWS - 1; r >= 0; r--) {
      if (grid[r][c] === 0 && !blockedCells.has(`${r}-${c}`)) return true;
    }
  }
  return false;
}

function getWinnerLabel() {
  if (redGames > blueGames)
    return gameMode === GAME_MODES.SINGLE ? "You (Red)" : "Player 1 (Red)";
  if (blueGames > redGames) {
    if (gameMode === GAME_MODES.SINGLE) {
      const diff = aiDifficulty
        ? ` - ${aiDifficulty.charAt(0).toUpperCase() + aiDifficulty.slice(1)}`
        : "";
      return `Computer (Blue)${diff}`;
    }
    return "Player 2 (Blue)";
  }
  return "Tie";
}

function showEnd() {
  showEndGameModal(getWinnerLabel(), redGames, blueGames);
  gameActive = false;
}

function checkEndOfGame() {
  if (
    scoringMode === SCORING_MODES.QUICKFIRE &&
    (redGames >= quickFireTarget || blueGames >= quickFireTarget)
  ) {
    showEnd();
    return;
  }
  if (!hasAnyValidMove()) showEnd();
}

function checkForWin(row, col) {
  const player = grid[row][col];
  for (let [dr, dc] of DIRECTIONS) {
    const line = getLine(row, col, dr, dc, player);
    if (line.length >= 4) {
      boxOffConnectedArea(line, player);
      return true;
    }
  }
  return false;
}

function getLine(startRow, startCol, dRow, dCol, player) {
  const line = [{ row: startRow, col: startCol }];

  let r = startRow + dRow,
    c = startCol + dCol;
  while (
    r >= 0 &&
    r < ROWS &&
    c >= 0 &&
    c < COLS &&
    grid[r][c] === player &&
    !blockedCells.has(`${r}-${c}`)
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
    !blockedCells.has(`${r}-${c}`)
  ) {
    line.unshift({ row: r, col: c });
    r -= dRow;
    c -= dCol;
  }

  return line;
}

function boxOffConnectedArea(winningLine, player) {
  const connectedSquares = new Set();
  const queue = [...winningLine];

  winningLine.forEach(({ row, col }) => {
    if (!blockedCells.has(`${row}-${col}`))
      connectedSquares.add(`${row}-${col}`);
  });

  while (queue.length > 0) {
    const { row, col } = queue.shift();

    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;

        const newRow = row + dr,
          newCol = col + dc,
          key = `${newRow}-${newCol}`;
        if (
          newRow >= 0 &&
          newRow < ROWS &&
          newCol >= 0 &&
          newCol < COLS &&
          !connectedSquares.has(key) &&
          !blockedCells.has(key)
        ) {
          if (grid[newRow][newCol] !== 0) {
            connectedSquares.add(key);
            queue.push({ row: newRow, col: newCol });
          }
        }
      }
    }
  }

  if (connectedSquares.size === 0) return;

  const squares = Array.from(connectedSquares).map((key) => {
    const [r, c] = key.split("-").map(Number);
    return { row: r, col: c };
  });

  const minRow = Math.min(...squares.map((s) => s.row));
  const maxRow = Math.max(...squares.map((s) => s.row));
  const minCol = Math.min(...squares.map((s) => s.col));
  const maxCol = Math.max(...squares.map((s) => s.col));

  for (let r = minRow; r <= maxRow; r++) {
    for (let c = minCol; c <= maxCol; c++) {
      const key = `${r}-${c}`;
      blockedCells.add(key);

      if (scoringMode === SCORING_MODES.AREA) {
        const prev = ownership[key] | 0;
        if (prev !== player) {
          if (prev === PLAYER.RED) redGames--;
          else if (prev === PLAYER.BLUE) blueGames--;
          if (player === PLAYER.RED) redGames++;
          else blueGames++;
          ownership[key] = player;
        }
      }
    }
  }

  updateAllCellDisplays(grid, blockedCells, lastMovePosition, ROWS, COLS);

  // Shade exactly 4 winning cells containing the last placed piece
  shadeWinningFour(winningLine, player);

  drawWinStrike(winningLine, player);
  drawOutlineRect(minRow, maxRow, minCol, maxCol, player);
}

/* NEW: compute and tint the 4 winning cells that include the last move */
function shadeWinningFour(winningLine, player) {
  // Remove any previous win shading
  document
    .querySelectorAll(".cell.win-red, .cell.win-blue")
    .forEach((el) => {
      el.classList.remove("win-red", "win-blue");
    });

  if (!lastMovePosition) return;

  const idx = winningLine.findIndex(
    (p) => p.row === lastMovePosition.row && p.col === lastMovePosition.col
  );
  const n = winningLine.length;
  if (idx === -1 || n < 4) return;

  const start = Math.min(Math.max(idx - 3, 0), n - 4);
  const segment = winningLine.slice(start, start + 4);

  for (const { row, col } of segment) {
    const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    if (cell) cell.classList.add(player === PLAYER.RED ? "win-red" : "win-blue");
  }
}

/* ------------ Controls, keyboard, modals, exports ------------ */
function ensureControlsUI() {
  const controls = document.querySelector(".controls");
  if (!controls) return;

  const mainBtn = controls.querySelector("button");
  if (mainBtn) {
    mainBtn.textContent = "🔄 Reset";
    mainBtn.onclick = () => initGame();
    mainBtn.setAttribute("title", "Reset the board (keeps mode & difficulty)");
  }

  let changeBtn = document.getElementById("changeModeInlineBtn");
  if (!changeBtn) {
    changeBtn = document.createElement("button");
    changeBtn.id = "changeModeInlineBtn";
    changeBtn.textContent = "🛠️ Change Mode";
    changeBtn.style.marginLeft = "10px";
    controls.appendChild(changeBtn);
  }
  changeBtn.onclick = () => {
    // Ensure visuals are cleared when changing mode inline
    resetBoardUI();
    const outlineLayer = document.getElementById(UI_IDS.outlineLayer);
    if (outlineLayer) outlineLayer.innerHTML = "";
    redGames = 0;
    blueGames = 0;
    gameActive = false;
    gameMode = null;
    aiDifficulty = null;
    const modeModal = document.getElementById(UI_IDS.modeSelectModal);
    modeModal.classList.remove(CSS.HIDDEN);
    modeModal.setAttribute("aria-hidden", "false");
    updateLabelsForModeUI(gameMode, aiDifficulty, scoringMode, quickFireTarget);
    updateDisplay(
      currentPlayer,
      gameMode,
      aiDifficulty,
      scoringMode,
      redGames,
      blueGames
    );
  };
}

/* ------------ Keyboard & modals ------------ */
document.addEventListener("keydown", (e) => {
  if (e.key === KEY.ESCAPE) {
    const instructionsModal = document.getElementById(UI_IDS.instructionsModal);
    const difficultyModal = document.getElementById(
      UI_IDS.difficultySelectModal
    );
    const scoringModal = document.getElementById(UI_IDS.scoringSelectModal);
    const quickfireModal = document.getElementById(UI_IDS.quickfireSelectModal);

    if (instructionsModal && !instructionsModal.classList.contains(CSS.HIDDEN))
      closeInstructions();
    if (difficultyModal && !difficultyModal.classList.contains(CSS.HIDDEN)) {
      difficultyModal.classList.add(CSS.HIDDEN);
      difficultyModal.setAttribute("aria-hidden", "true");
    }
    if (quickfireModal && !quickfireModal.classList.contains(CSS.HIDDEN)) {
      backFromQuickfire();
    }
    if (scoringModal && !scoringModal.classList.contains(CSS.HIDDEN)) {
      scoringModal.classList.add(CSS.HIDDEN);
      scoringModal.setAttribute("aria-hidden", "true");
    }
  }
});

window.addEventListener("resize", () => {
  // Maintain board scaling on resize
  applyResponsiveScale();

  const modal = document.getElementById(UI_IDS.quickfireSelectModal);
  if (modal && !modal.classList.contains(CSS.HIDDEN)) {
    const input = document.getElementById("qfTarget");
    onQuickfireInput(input);
  }
});

{
  const instr = document.getElementById(UI_IDS.instructionsModal);
  if (instr) {
    instr.addEventListener("click", (e) => {
      if (e.target === e.currentTarget) closeInstructions();
    });
  }
}

document
  .getElementById(UI_IDS.difficultySelectModal)
  .addEventListener("click", (e) => {
    if (e.target === e.currentTarget) {
      e.currentTarget.classList.add(CSS.HIDDEN);
      e.currentTarget.setAttribute("aria-hidden", "True");
    }
  });

document
  .getElementById(UI_IDS.scoringSelectModal)
  .addEventListener("click", (e) => {
    if (e.target === e.currentTarget) {
      e.currentTarget.classList.add(CSS.HIDDEN);
      e.currentTarget.setAttribute("aria-hidden", "True");
    }
  });

document
  .getElementById(UI_IDS.endGameModal)
  .addEventListener("click", () => {});

document.getElementById(UI_IDS.tryAgainBtn).addEventListener("click", () => {
  hideEndGameModal();
  redGames = 0;
  blueGames = 0;
  // Clear any previous rendering before starting a new game
  resetBoardUI();
  initGame();
  updateDisplay(
    currentPlayer,
    gameMode,
    aiDifficulty,
    scoringMode,
    redGames,
    blueGames
  );
});

document.getElementById(UI_IDS.changeModeBtn).addEventListener("click", () => {
  hideEndGameModal();
  // Clear board visuals when switching modes
  resetBoardUI();
  const outlineLayer = document.getElementById(UI_IDS.outlineLayer);
  if (outlineLayer) outlineLayer.innerHTML = "";
  redGames = 0;
  blueGames = 0;
  gameActive = false;
  gameMode = null;
  aiDifficulty = null;
  const modeModal = document.getElementById(UI_IDS.modeSelectModal);
  modeModal.classList.remove(CSS.HIDDEN);
  modeModal.setAttribute("aria-hidden", "false");
  updateLabelsForModeUI(gameMode, aiDifficulty, scoringMode, quickFireTarget);
  updateDisplay(
    currentPlayer,
    gameMode,
    aiDifficulty,
    scoringMode,
    redGames,
    blueGames
  );
});

/* ------------ Expose for inline HTML ------------ */
window.setGameMode = setGameMode;
window.setScoringMode = setScoringMode;
window.setDifficulty = setDifficulty;
window.startNewGame = () => initGame();
window.closeInstructions = closeInstructions;

// Quick Fire modal handlers
window.confirmQuickfire = confirmQuickfire;
window.backFromQuickfire = backFromQuickfire;
window.onQuickfireInput = onQuickfireInput;

// --- Full-screen main menu & in-game menu (UI-only) ---
function hideMainMenu() {
  const m = document.getElementById("mainMenuScreen");
  if (m) {
    m.classList.add(CSS.HIDDEN);
    m.setAttribute("aria-hidden", "true");
  }
}
function showMainMenu() {
  const m = document.getElementById("mainMenuScreen");
  if (m) {
    hideGameScreen();
    m.classList.remove(CSS.HIDDEN);
    m.setAttribute("aria-hidden", "false");
  }
}
function openInGameMenu() {
  const overlay = document.getElementById("inGameMenuOverlay");
  if (overlay) {
    overlay.classList.remove(CSS.HIDDEN);
    overlay.setAttribute("aria-hidden", "false");
  }
}
function closeInGameMenu() {
  const overlay = document.getElementById("inGameMenuOverlay");
  if (overlay) {
    overlay.classList.add(CSS.HIDDEN);
    overlay.setAttribute("aria-hidden", "true");
  }
}
function openModeSelect() {
  closeInGameMenu();
  hideMainMenu();
  hideGameScreen();
  // Ensure old canvas/overlays are cleared before changing modes
  resetBoardUI();
  const outlineLayer = document.getElementById(UI_IDS.outlineLayer);
  if (outlineLayer) outlineLayer.innerHTML = "";
  redGames = 0;
  blueGames = 0;
  gameActive = false;
  gameMode = null;
  aiDifficulty = null;
  navigateTo(UI_IDS.modeSelectModal);
  updateLabelsForModeUI(gameMode, aiDifficulty, scoringMode, quickFireTarget);
  updateDisplay(
    currentPlayer,
    gameMode,
    aiDifficulty,
    scoringMode,
    redGames,
    blueGames
  );
}
function quickStart() {
  // Hide main menu. If no mode selected yet, guide user into mode selection.
  hideMainMenu();
  if (!gameMode) {
    openModeSelect();
  }
}
function goToMainMenu() {
  // Close any in-game overlays, then show main menu screen.
  closeInGameMenu();
  // Clear rendering so the next game starts visually fresh
  resetBoardUI();
  const modals = [
    UI_IDS.instructionsModal,
    UI_IDS.difficultySelectModal,
    UI_IDS.scoringSelectModal,
    UI_IDS.quickfireSelectModal,
    UI_IDS.endGameModal,
  ];
  for (const id of modals) {
    const el = document.getElementById(id);
    if (el) {
      el.classList.add(CSS.HIDDEN);
      el.setAttribute("aria-hidden", "true");
    }
  }
  hideGameScreen();
  showMainMenu();
}

function startGameFromMenu() {
  // Hide all menu screens and start the game.
  const screens = document.querySelectorAll('.menu-screen');
  screens.forEach((el) => {
    el.classList.add(CSS.HIDDEN);
    el.setAttribute('aria-hidden', 'true');
  });
  // Reset stack to root
  menuStack = ['mainMenuScreen'];
  hideMainMenu();
  // Force a fresh board render before showing the game screen
  resetBoardUI();
  showGameScreen();
  initGame();
}

function openTutorial() {
  // Reuse existing instructions content without adding another screen in the flow.
  showInstructionsUI(scoringMode, quickFireTarget);
  const instrModal = document.getElementById(UI_IDS.instructionsModal);
  const body = document.getElementById('instructionsBody');
  const target = document.getElementById('tutorialContent');
  if (body && target) target.innerHTML = body.innerHTML;
  // Immediately hide the instructions modal if it was shown
  if (instrModal) {
    instrModal.classList.add(CSS.HIDDEN);
    instrModal.setAttribute('aria-hidden', 'true');
  }
  const wrap = document.querySelector('#mainMenuScreen .menu-wrap');
  if (wrap) wrap.classList.add('show-tutorial');
}

function closeTutorial() {
  const wrap = document.querySelector('#mainMenuScreen .menu-wrap');
  if (wrap) wrap.classList.remove('show-tutorial');
}

// Ensure game screen visibility toggles with menu
function showGameScreen() {
  const g = document.getElementById('gameScreen');
  if (g) {
    g.classList.remove(CSS.HIDDEN);
    g.setAttribute('aria-hidden', 'false');
  }
}
function hideGameScreen() {
  const g = document.getElementById('gameScreen');
  if (g) {
    g.classList.add(CSS.HIDDEN);
    g.setAttribute('aria-hidden', 'true');
  }
}

// Expose new UI helpers
window.quickStart = quickStart;
window.openModeSelect = openModeSelect;
window.openInGameMenu = openInGameMenu;
window.closeInGameMenu = closeInGameMenu;
window.goToMainMenu = goToMainMenu;
window.menuBack = menuBack;
window.startGameFromMenu = startGameFromMenu;
window.openTutorial = openTutorial;
window.closeTutorial = closeTutorial;
function resetGameAndCloseMenu() {
  // Use existing reset, then close the in-game overlay.
  resetBoardUI();
  initGame();
  updateDisplay(
    currentPlayer,
    gameMode,
    aiDifficulty,
    scoringMode,
    redGames,
    blueGames
  );
  closeInGameMenu();
}
window.resetGameAndCloseMenu = resetGameAndCloseMenu;

// initialize buttons on first load
ensureControlsUI();
applyResponsiveScale();
