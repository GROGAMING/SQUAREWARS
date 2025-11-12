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
} from "./constants.js?v=13";

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
  updateScale,
  colFromClient,
} from "./ui.js?v=13";

import { chooseComputerMove } from "./ai.js?v=11";

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

/* ------------ Mode, scoring & difficulty ------------ */
function setGameMode(mode) {
  gameMode = mode;
  document.getElementById(UI_IDS.modeSelectModal).classList.add(CSS.HIDDEN);

  const scoringModal = document.getElementById(UI_IDS.scoringSelectModal);
  scoringModal.classList.remove(CSS.HIDDEN);
  scoringModal.setAttribute("aria-hidden", "false");
}

function setScoringMode(mode) {
  scoringMode = mode;
  const scoringModal = document.getElementById(UI_IDS.scoringSelectModal);

  if (mode === SCORING_MODES.QUICKFIRE) {
    scoringModal.classList.add(CSS.HIDDEN);
    scoringModal.setAttribute("aria-hidden", "true");
    openQuickfireModal();
    return;
  }

  // Classic / Area continue as normal
  ownership = Object.create(null);
  scoringModal.classList.add(CSS.HIDDEN);
  scoringModal.setAttribute("aria-hidden", "true");

  if (gameMode === GAME_MODES.SINGLE) {
    const difficultyModal = document.getElementById(
      UI_IDS.difficultySelectModal
    );
    difficultyModal.classList.remove(CSS.HIDDEN);
    difficultyModal.setAttribute("aria-hidden", "false");
  } else {
    updateLabelsForModeUI(gameMode, aiDifficulty, scoringMode, quickFireTarget);
    showInstructionsUI(scoringMode, quickFireTarget);
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
  const modal = document.getElementById(UI_IDS.quickfireSelectModal);
  const input = document.getElementById("qfTarget");
  const bubble = document.getElementById("qfBubble");
  if (input) input.value = String(quickFireTarget);
  if (bubble) bubble.textContent = String(quickFireTarget);
  modal.classList.remove(CSS.HIDDEN);
  modal.setAttribute("aria-hidden", "false");
  // position once visible
  requestAnimationFrame(() => onQuickfireInput(input));
}

function backFromQuickfire() {
  const qf = document.getElementById(UI_IDS.quickfireSelectModal);
  qf.classList.add(CSS.HIDDEN);
  qf.setAttribute("aria-hidden", "true");

  const scoring = document.getElementById(UI_IDS.scoringSelectModal);
  scoring.classList.remove(CSS.HIDDEN);
  scoring.setAttribute("aria-hidden", "false");
}

function confirmQuickfire() {
  const input = document.getElementById("qfTarget");
  const val = Number(input.value || 5);
  quickFireTarget = Math.max(1, Math.min(10, val));

  const qf = document.getElementById(UI_IDS.quickfireSelectModal);
  qf.classList.add(CSS.HIDDEN);
  qf.setAttribute("aria-hidden", "true");

  ownership = Object.create(null);

  if (gameMode === GAME_MODES.SINGLE) {
    const difficultyModal = document.getElementById(
      UI_IDS.difficultySelectModal
    );
    difficultyModal.classList.remove(CSS.HIDDEN);
    difficultyModal.setAttribute("aria-hidden", "false");
  } else {
    updateLabelsForModeUI(gameMode, aiDifficulty, scoringMode, quickFireTarget);
    showInstructionsUI(scoringMode, quickFireTarget);
  }
}

function setDifficulty(difficulty) {
  aiDifficulty = difficulty;
  const m = document.getElementById(UI_IDS.difficultySelectModal);
  m.classList.add(CSS.HIDDEN);
  m.setAttribute("aria-hidden", "true");
  updateLabelsForModeUI(gameMode, aiDifficulty, scoringMode, quickFireTarget);
  showInstructionsUI(scoringMode, quickFireTarget);
}

function showInstructions() {
  showInstructionsUI(scoringMode, quickFireTarget);
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

  buildGrid(ROWS, COLS, (col) => {
    if (!gameActive) return;
    dropPiece(col);
  });
  updateScale();
}

/* Update dropPiece to use colFromClient for input mapping */
function dropPiece(col) {
  if (!gameActive) return;

  for (let row = ROWS - 1; row >= 0; row--) {
    if (grid[row][col] === 0 && !blockedCells.has(`${row}-${col}`)) {
      grid[row][col] = currentPlayer;
      lastMovePosition = { row, col };
      updateCellDisplay(grid, blockedCells, lastMovePosition, row, col);
      currentPlayer = currentPlayer === PLAYER.RED ? PLAYER.BLUE : PLAYER.RED;
      return;
    }
  }
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
  drawWinStrike(winningLine, player);
  drawOutlineRect(minRow, maxRow, minCol, maxCol, player);
}

/* ------------ Controls: Reset + Change Mode ------------ */
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

/* ------------ Navigation Dispatcher ------------ */
function navigateTo(screenId) {
  const allScreens = [
    UI_IDS.modeSelectModal,
    UI_IDS.scoringSelectModal,
    UI_IDS.quickfireSelectModal,
    UI_IDS.difficultySelectModal,
    UI_IDS.instructionsModal,
    UI_IDS.endGameModal,
  ];

  // Hide all screens
  allScreens.forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.classList.add(CSS.HIDDEN);
      el.setAttribute("aria-hidden", "true");
    }
  });

  // Show the target screen
  const targetScreen = document.getElementById(screenId);
  if (targetScreen) {
    targetScreen.classList.remove(CSS.HIDDEN);
    targetScreen.setAttribute("aria-hidden", "false");
    console.debug(`Navigated to screen: ${screenId}`);
  } else {
    console.error(`Navigation failed: Screen with id "${screenId}" not found.`);
    showToast(`Error: Unable to navigate to screen.`);
  }
}

/* ------------ Toast for Errors ------------ */
function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
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
  const modal = document.getElementById(UI_IDS.quickfireSelectModal);
  if (modal && !modal.classList.contains(CSS.HIDDEN)) {
    const input = document.getElementById("qfTarget");
    onQuickfireInput(input);
  }
  updateScale();
});

document
  .getElementById(UI_IDS.instructionsModal)
  .addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeInstructions();
  });

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

/* ------------ Event Binding Enhancements ------------ */
function bindEvent(selector, event, handler) {
  const elements = document.querySelectorAll(selector);
  elements.forEach((el) => {
    el.removeEventListener(event, handler); // Prevent duplicate bindings
    el.addEventListener(event, handler);
  });
}

function logUnhandledInteraction(event) {
  console.warn(`Unhandled interaction on ${event.target.id || event.target}`);
}

// Bind pointerup with fallback to click
function bindPointerEvent(selector, handler) {
  bindEvent(selector, "pointerup", handler);
  bindEvent(selector, "click", handler);
}

// Ensure all critical buttons are bound
function ensureButtonBindings() {
  bindPointerEvent("#tryAgainBtn", () => {
    hideEndGameModal();
    redGames = 0;
    blueGames = 0;
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

  bindPointerEvent("#changeModeBtn", () => {
    hideEndGameModal();
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

  bindPointerEvent("#qfTarget", (e) => onQuickfireInput(e.target));
}

// Verify handlers are registered
function verifyHandlers() {
  const criticalButtons = [
    "#tryAgainBtn",
    "#changeModeBtn",
    "#qfTarget",
  ];
  criticalButtons.forEach((selector) => {
    const el = document.querySelector(selector);
    if (el && !el.hasAttribute("data-handler-bound")) {
      console.error(`Handler missing for ${selector}`);
    }
  });
}

/* ------------ Event Delegation & Self-Checks ------------ */
function bindDelegatedEvent(root, selector, event, handler) {
  root.addEventListener(event, (e) => {
    const target = e.target.closest(selector);
    if (target) handler(e, target);
  });
}

function ensureCriticalButtons() {
  const criticalSelectors = [
    '[data-qa="btn-single"]',
    '[data-qa="btn-multi"]',
    '[data-qa="btn-start"]',
    '[data-qa="btn-back"]',
    '[data-qa="btn-restart"]',
  ];

  criticalSelectors.forEach((selector) => {
    const el = document.querySelector(selector);
    if (!el) {
      console.error(`Critical button missing: ${selector}`);
      return;
    }

    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const topElement = document.elementFromPoint(centerX, centerY);

    if (topElement !== el) {
      console.error(
        `Button ${selector} is blocked by ${topElement.tagName}`,
        topElement
      );
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const root = document.body;

  bindDelegatedEvent(root, '[data-qa="btn-single"]', "click", () =>
    navigateTo(UI_IDS.scoringSelectModal)
  );
  bindDelegatedEvent(root, '[data-qa="btn-multi"]', "click", () =>
    navigateTo(UI_IDS.scoringSelectModal)
  );
  bindDelegatedEvent(root, '[data-qa="btn-back"]', "click", () =>
    navigateTo(UI_IDS.modeSelectModal)
  );
  bindDelegatedEvent(root, '[data-qa="btn-start"]', "click", () =>
    navigateTo(UI_IDS.difficultySelectModal)
  );
  bindDelegatedEvent(root, '[data-qa="btn-restart"]', "click", () =>
    initGame()
  );

  ensureCriticalButtons(); // Verify buttons are not blocked
});

/* ------------ Event Binding & Initialization ------------ */
function bindUI() {
  const clickMap = {
    setGameMode: (el) => setGameMode(el.dataset.arg),
    setScoringMode: (el) => setScoringMode(el.dataset.arg),
    setDifficulty: (el) => setDifficulty(el.dataset.arg),
    startNewGame: () => initGame(),
    closeInstructions,
    confirmQuickfire,
    backFromQuickfire,
  };

  // Bind all buttons with data-click attributes
  document.querySelectorAll('[data-click]').forEach((el) => {
    const fn = clickMap[el.dataset.click];
    if (!fn) {
      console.error(`No handler found for data-click="${el.dataset.click}"`);
      el.dataset.bindError = `No handler for ${el.dataset.click}`;
    } else {
      el.removeEventListener('click', el._boundClickHandler); // Remove previous bindings
      el._boundClickHandler = () => fn(el); // Store the bound handler
      el.addEventListener('click', el._boundClickHandler);
    }
  });

  // Bind Quick Fire input slider
  document.querySelectorAll('[data-input="quickfire"]').forEach((el) => {
    el.removeEventListener('input', el._boundInputHandler); // Remove previous bindings
    el._boundInputHandler = () => onQuickfireInput(el); // Store the bound handler
    el.addEventListener('input', el._boundInputHandler);
  });

  // Ensure modal close buttons work
  document.querySelectorAll('.modal-overlay').forEach((modal) => {
    modal.removeEventListener('click', modal._boundOverlayHandler); // Remove previous bindings
    modal._boundOverlayHandler = (e) => {
      if (e.target === modal) {
        modal.classList.add(CSS.HIDDEN);
        modal.setAttribute('aria-hidden', 'true');
      }
    };
    modal.addEventListener('click', modal._boundOverlayHandler);
  });
}

function verifyBindings() {
  const errors = [...document.querySelectorAll('[data-bind-error]')]
    .map((el) => el.dataset.bindError);
  if (errors.length) throw new Error('Missing UI handlers: ' + errors.join(', '));
}

// Ensure all buttons are bound and verify bindings
function boot() {
  bindUI();
  verifyBindings();
}

// Initialize the game when the DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}

window.setGameMode = setGameMode;
window.setScoringMode = setScoringMode;
window.setDifficulty = setDifficulty;
window.startNewGame = () => initGame();
window.closeInstructions = closeInstructions;
window.confirmQuickfire = confirmQuickfire;
window.backFromQuickfire = backFromQuickfire;
window.onQuickfireInput = onQuickfireInput;

window.addEventListener("DOMContentLoaded", () => {
  if (typeof wireButtons === "function") wireButtons();
});
