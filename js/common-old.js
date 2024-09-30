// common.js

document.addEventListener("DOMContentLoaded", () => {
  // Buttons
  const buttons = {
    darkModeToggleBtn: document.getElementById("dark-mode-toggle"),
    autoRestartToggleBtn: document.getElementById("auto-restart-toggle"),
    keyboardLayoutToggleBtn: document.getElementById("keyboard-layout-toggle"),
    modeToggleBtn: document.getElementById("player-mode-toggle"),
  };

  // Dark mode toggle button
  if (buttons.darkModeToggleBtn) {
    // Set initial text based on current dark mode status
    const isDarkMode = document.body.classList.contains("dark-mode");
    buttons.darkModeToggleBtn.textContent = isDarkMode
      ? "Switch to Light Mode"
      : "Switch to Dark Mode";

    buttons.darkModeToggleBtn.addEventListener("click", () => {
      toggleDarkMode();

      // Update the button text after toggling
      const isDarkModeEnabled = document.body.classList.contains("dark-mode");
      buttons.darkModeToggleBtn.textContent = isDarkModeEnabled
        ? "Switch to Light Mode"
        : "Switch to Dark Mode";
    });

    if (typeof displayCurrentRules === "function") {
      displayCurrentRules();
    }
  }

  // Mode toggle button
  if (buttons.modeToggleBtn) {
    buttons.modeToggleBtn.addEventListener("click", () => {
      vsMode = !vsMode;
      buttons.modeToggleBtn.textContent = vsMode
        ? "Switch to 1-Player Mode"
        : "Switch to 2-Player Mode";
      resetGame();
    });
  }

  // Auto-restart toggle button
  if (buttons.autoRestartToggleBtn) {
    buttons.autoRestartToggleBtn.addEventListener("click", () => {
      autoRestart = !autoRestart;
      buttons.autoRestartToggleBtn.textContent = autoRestart
        ? "Disable Auto Restart"
        : "Enable Auto Restart";
    });
  }

  // Keyboard layout toggle button
  if (buttons.keyboardLayoutToggleBtn) {
    buttons.keyboardLayoutToggleBtn.addEventListener("click", () => {
      keyboardLayout = keyboardLayout === "qwerty" ? "azerty" : "qwerty";
      buttons.keyboardLayoutToggleBtn.textContent =
        keyboardLayout === "qwerty"
          ? "Switch to AZERTY Layout"
          : "Switch to QWERTY Layout";
      keyBindings = getKeyBindings(keyboardLayout);
      updateControlsDisplay();
    });
  }

  // Apply dark mode preference
  if (localStorage.getItem("dark-mode") === "true") {
    document.body.classList.add("dark-mode");
  }
  document.dispatchEvent(new Event("themeChanged"));
});

// Toggle dark mode
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
  if (layout === "azerty") {
    return {
      player1: {
        up: "z",
        down: "s",
        left: "q",
        right: "d",
        action: "Shift",
      },
      player2: {
        up: "ArrowUp",
        down: "ArrowDown",
        left: "ArrowLeft",
        right: "ArrowRight",
        action: "Control",
      },
    };
  } else {
    // Default is QWERTY layout
    return {
      player1: {
        up: "w",
        down: "s",
        left: "a",
        right: "d",
        action: "Shift",
      },
      player2: {
        up: "ArrowUp",
        down: "ArrowDown",
        left: "ArrowLeft",
        right: "ArrowRight",
        action: "Control",
      },
    };
  }
}
