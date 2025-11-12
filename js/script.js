// ===== SQUARE WARS — script.js =====
import "./constants.js";
import "./ai.js";
import { initUI, exposeForInline } from "./ui.js";

window.addEventListener("DOMContentLoaded", () => {
  initUI();
  // Fallback only if HTML still calls inline handlers
  if (typeof exposeForInline === "function") exposeForInline(window);
});

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
