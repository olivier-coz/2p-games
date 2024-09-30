// Buttons
const buttons = {
  darkModeToggleBtn: document.getElementById("dark-mode-toggle"),
  autoRestartToggleBtn: document.getElementById("auto-restart-toggle"),
  keyboardLayoutToggleBtn: document.getElementById("keyboard-layout-toggle"),
  modeToggleBtn: document.getElementById("player-mode-toggle"),
};

// Utility functions
const toggleText = (element, condition, textTrue, textFalse) => {
  element.textContent = condition ? textTrue : textFalse;
};

// Dark mode toggle button
const initializeDarkModeToggle = () => {
  if (!buttons.darkModeToggleBtn) return;

  const updateDarkModeText = () => {
    const isDarkMode = document.body.classList.contains("dark-mode");
    toggleText(
      buttons.darkModeToggleBtn,
      isDarkMode,
      "Switch to Light Mode",
      "Switch to Dark Mode",
    );
  };

  buttons.darkModeToggleBtn.addEventListener("click", () => {
    toggleDarkMode();
    updateDarkModeText();
  });

  updateDarkModeText();

  if (typeof displayCurrentRules === "function") {
    displayCurrentRules();
  }
};

// Mode toggle button
const initializeModeToggle = () => {
  if (!buttons.modeToggleBtn) return;

  buttons.modeToggleBtn.addEventListener("click", () => {
    vsMode = !vsMode;
    toggleText(
      buttons.modeToggleBtn,
      vsMode,
      "Switch to 1-Player Mode",
      "Switch to 2-Player Mode",
    );
    resetGame();
  });
};

// Auto-restart toggle button
const initializeAutoRestartToggle = () => {
  if (!buttons.autoRestartToggleBtn) return;

  buttons.autoRestartToggleBtn.addEventListener("click", () => {
    autoRestart = !autoRestart;
    toggleText(
      buttons.autoRestartToggleBtn,
      autoRestart,
      "Disable Auto Restart",
      "Enable Auto Restart",
    );
  });
};

// Keyboard layout toggle button
const initializeKeyboardLayoutToggle = () => {
  if (!buttons.keyboardLayoutToggleBtn) return;

  const updateKeyboardLayout = () => {
    keyboardLayout = keyboardLayout === "qwerty" ? "azerty" : "qwerty";
    toggleText(
      buttons.keyboardLayoutToggleBtn,
      keyboardLayout === "qwerty",
      "Switch to AZERTY Layout",
      "Switch to QWERTY Layout",
    );
    keyBindings = getKeyBindings(keyboardLayout);
    updateControlsDisplay();
  };

  buttons.keyboardLayoutToggleBtn.addEventListener(
    "click",
    updateKeyboardLayout,
  );
};

// Initialize all buttons
const initializeButtons = () => {
  initializeDarkModeToggle();
  initializeModeToggle();
  initializeAutoRestartToggle();
  initializeKeyboardLayoutToggle();
};

// Apply dark mode preference on page load
const applyDarkModePreference = () => {
  if (localStorage.getItem("dark-mode") === "true") {
    document.body.classList.add("dark-mode");
  }
  document.dispatchEvent(new Event("themeChanged"));
};

// Toggle dark mode function
function toggleDarkMode() {
  document.body.classList.toggle("dark-mode");
  localStorage.setItem(
    "dark-mode",
    document.body.classList.contains("dark-mode"),
  );
  document.dispatchEvent(new Event("themeChanged"));
}

// Get key bindings based on layout
function getKeyBindings(layout) {
  const layouts = {
    azerty: {
      player1: { up: "z", down: "s", left: "q", right: "d", action: "Shift" },
      player2: {
        up: "ArrowUp",
        down: "ArrowDown",
        left: "ArrowLeft",
        right: "ArrowRight",
        action: "Control",
      },
    },
    qwerty: {
      player1: { up: "w", down: "s", left: "a", right: "d", action: "Shift" },
      player2: {
        up: "ArrowUp",
        down: "ArrowDown",
        left: "ArrowLeft",
        right: "ArrowRight",
        action: "Control",
      },
    },
  };

  return layouts[layout] || layouts.qwerty;
}

// Initialize everything on page load
document.addEventListener("DOMContentLoaded", () => {
  initializeButtons();
  applyDarkModePreference();
});
