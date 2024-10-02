// jump.js

// Constants
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// HTML Elements
const statusInfo = document.getElementById("statusInfo");
const controlInfo = document.getElementById("controlInfo");

// Variables
let colors = {};
let gameActive = false;
let gameOver = false;
let countdown = 0;
let autoRestart = false;
let keyboardLayout = "qwerty";
let vsMode = true; // Start with 2-player mode by default
let keyBindings = getKeyBindings(keyboardLayout);
let animationFrameId;

// Game Variables
let platforms = [];
let numPlatforms = 16;
let platformWidth = 70;
let platformHeight = 15;
let platformSpeed = 1;
let initialPlatformSpeed = 1; // To reset the speed after game over
let gravity = 0.5;
let jumpStrength = -15;

// Players
let players = [
  {
    x: 0,
    y: 0,
    width: 40,
    height: 40,
    color: "",
    vy: 0,
    isJumping: false,
    score: 0,
    name: "Player 1",
  },
  {
    x: 0,
    y: 0,
    width: 40,
    height: 40,
    color: "",
    vy: 0,
    isJumping: false,
    score: 0,
    name: "Player 2",
  },
];

let keysPressed = {};

// Fetch CSS colors
function getCSSColors() {
  const rootStyles = getComputedStyle(document.body);
  colors = {
    background: rootStyles.getPropertyValue("--color-background").trim(),
    text: rootStyles.getPropertyValue("--color-text").trim(),
    primary: rootStyles.getPropertyValue("--color-primary").trim(),
    secondary: rootStyles.getPropertyValue("--color-secondary").trim(),
    accent: rootStyles.getPropertyValue("--color-accent").trim(),
    muted: rootStyles.getPropertyValue("--color-muted").trim(),
  };

  // Update player colors
  players[0].color = colors.secondary; // Player 1 color
  players[1].color = colors.primary; // Player 2 color
}

// Listen for theme changes
document.addEventListener("themeChanged", function () {
  getCSSColors();
});

// Responsive canvas setup
function resizeCanvas() {
  canvas.width = window.innerWidth * 0.9;
  canvas.height = window.innerHeight * 0.7;
  resetGame(); // Adjust game elements based on new size
}
window.addEventListener("resize", resizeCanvas);

// Event listeners for key presses
document.addEventListener("keydown", function (e) {
  // Restart game
  if (!gameActive && (e.key === "r" || e.key === "R")) {
    resetGame();
    startCountdown();
    return;
  }

  // Player controls
  players.forEach((player, index) => {
    let bindings = index === 0 ? keyBindings.player1 : keyBindings.player2;
    if (e.key === bindings.left) {
      keysPressed[bindings.left] = true;
    } else if (e.key === bindings.right) {
      keysPressed[bindings.right] = true;
    } else if (e.key === bindings.up) {
      keysPressed[bindings.up] = true;
    }
  });
});

document.addEventListener("keyup", function (e) {
  players.forEach((player, index) => {
    let bindings = index === 0 ? keyBindings.player1 : keyBindings.player2;
    if (e.key === bindings.left) {
      keysPressed[bindings.left] = false;
    } else if (e.key === bindings.right) {
      keysPressed[bindings.right] = false;
    } else if (e.key === bindings.up) {
      keysPressed[bindings.up] = false;
    }
  });
});

// Buttons
const modeToggleBtn = document.getElementById("modeToggle");
const autoRestartToggleBtn = document.getElementById("auto-restart-toggle");
const keyboardLayoutToggleBtn = document.getElementById(
  "keyboard-layout-toggle",
);

// Mode toggle button
if (modeToggleBtn) {
  modeToggleBtn.addEventListener("click", () => {
    vsMode = !vsMode;
    modeToggleBtn.textContent = vsMode
      ? "Switch to 1-Player Mode"
      : "Switch to 2-Player Mode";
    resetGame();
    gameOver = true;
    gameActive = false;
    statusInfo.innerHTML = "Press 'R' to restart.";
    if (autoRestart) {
      resetGame();
      startCountdown();
    }
  });
}

// Auto-restart toggle button
if (autoRestartToggleBtn) {
  autoRestartToggleBtn.addEventListener("click", () => {
    autoRestart = !autoRestart;
    autoRestartToggleBtn.textContent = autoRestart
      ? "Disable Auto Restart"
      : "Enable Auto Restart";
  });
}

// Keyboard layout toggle button
if (keyboardLayoutToggleBtn) {
  keyboardLayoutToggleBtn.addEventListener("click", () => {
    keyboardLayout = keyboardLayout === "qwerty" ? "azerty" : "qwerty";
    keyboardLayoutToggleBtn.textContent =
      keyboardLayout === "qwerty"
        ? "Change to AZERTY Layout"
        : "Change to QWERTY Layout";
    keyBindings = getKeyBindings(keyboardLayout);
    updateControlsDisplay(); // Update the controls display
  });
}

// Start countdown before the game starts
function startCountdown() {
  countdown = 3;
  statusInfo.innerHTML = `Game starts in ${countdown}...`;
  gameActive = false; // Ensure game is inactive during countdown
  let countdownInterval = setInterval(function () {
    countdown--;
    if (countdown > 0) {
      statusInfo.innerHTML = `Game starts in ${countdown}...`;
    } else {
      clearInterval(countdownInterval);
      countdown = 0;
      statusInfo.innerHTML = "...";
      gameActive = true; // Re-enable the game after countdown
    }
  }, 1000);
}

// Reset game variables
function resetGame() {
  gameOver = false;
  gameActive = false;
  countdown = 0;
  platformSpeed = initialPlatformSpeed; // Reset platform speed
  players.forEach((player) => {
    player.score = 0;
    player.vy = 0;
    player.isJumping = false;
  });

  // Generate platforms
  platforms = [];

  // Create center platform
  let centerPlatform = {
    x: (canvas.width - platformWidth) / 2,
    y: canvas.height / 2,
    width: platformWidth,
    height: platformHeight,
  };
  platforms.push(centerPlatform);

  // Generate remaining platforms
  for (let i = 1; i < numPlatforms; i++) {
    let p = {
      x: Math.random() * (canvas.width - platformWidth),
      y: i * (canvas.height / numPlatforms),
      width: platformWidth,
      height: platformHeight,
    };
    // Ensure platforms do not overlap with the center platform
    if (Math.abs(p.y - centerPlatform.y) < platformHeight * 2) {
      p.y += platformHeight * 2;
    }
    platforms.push(p);
  }

  // Position players on the center platform
  players[0].x = centerPlatform.x + platformWidth / 4 - players[0].width / 2;
  players[0].y = centerPlatform.y - players[0].height;
  players[0].vy = 0;
  players[0].isJumping = false;
  players[0].score = 0;

  players[1].x =
    centerPlatform.x + (3 * platformWidth) / 4 - players[1].width / 2;
  players[1].y = centerPlatform.y - players[1].height;
  players[1].vy = 0;
  players[1].isJumping = false;
  players[1].score = 0;

  // Update scoreboard and controls
  updateScoreboard();
  displayControls();

  // Clear status info
  statusInfo.innerHTML = "";

  // Cancel any existing animation frame
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }

  // Start the update loop
  updateGame();
}

// Update game
function updateGame() {
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (gameOver) {
    return;
  }

  if (gameActive) {
    // Move platforms down
    platforms.forEach((platform) => {
      platform.y += platformSpeed;
      // Remove platforms that go off screen and add new ones at the top
      if (platform.y > canvas.height) {
        platform.y = -platformHeight;
        platform.x = Math.random() * (canvas.width - platformWidth);
      }
    });

    // Update players
    let activePlayers = vsMode ? players : [players[0]];
    activePlayers.forEach((player, index) => {
      updatePlayer(player, index);
    });
  }

  // Draw platforms
  drawPlatforms();

  // Draw players
  let activePlayers = vsMode ? players : [players[0]];
  activePlayers.forEach((player) => {
    drawPlayer(player);
  });

  // Update scoreboard
  updateScoreboard();

  // If the game is not active and there's a countdown, display it
  if (!gameActive && countdown > 0) {
    ctx.font = "bold 72px Arial";
    ctx.fillStyle = colors.text;
    ctx.textAlign = "center";
    ctx.fillText(countdown, canvas.width / 2, canvas.height / 2);
  }

  // Store the animation frame ID
  animationFrameId = requestAnimationFrame(updateGame);
}

// Update player
function updatePlayer(player, index) {
  let bindings = index === 0 ? keyBindings.player1 : keyBindings.player2;

  // Apply gravity
  player.vy += gravity;
  player.y += player.vy;

  // Move left and right
  if (keysPressed[bindings.left] && player.x > 0) {
    player.x -= 5;
  }
  if (keysPressed[bindings.right] && player.x + player.width < canvas.width) {
    player.x += 5;
  }

  // Jump
  if (keysPressed[bindings.up] && !player.isJumping) {
    player.vy = jumpStrength;
    player.isJumping = true;
  }

  // Check collision with platforms
  let onPlatform = false;
  platforms.forEach((platform) => {
    if (
      player.vy >= 0 &&
      player.y + player.height >= platform.y &&
      player.y + player.height <= platform.y + platform.height &&
      player.x + player.width > platform.x &&
      player.x < platform.x + platformWidth
    ) {
      player.y = platform.y - player.height;
      player.vy = 0;
      player.isJumping = false;
      player.score += 1;
      onPlatform = true;
    }
  });

  // Prevent double jumping
  if (!onPlatform && player.vy !== 0) {
    player.isJumping = true;
  }

  // Check if player falls off the screen
  if (player.y > canvas.height) {
    gameOver = true;
    gameActive = false;
    statusInfo.innerHTML = `${player.name} fell off!`;
    if (autoRestart) {
      resetGame();
      startCountdown();
    } else {
      statusInfo.innerHTML += " Press 'R' to restart.";
    }
  }
}

// Draw platforms
function drawPlatforms() {
  ctx.fillStyle = colors.text; // Use text color for platforms
  platforms.forEach((platform) => {
    ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
  });
}

// Draw player
function drawPlayer(player) {
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.width, player.height);
}

// Update scoreboard
function updateScoreboard() {
  let player1Score = document.getElementById("player1Score");
  let player2Score = document.getElementById("player2Score");
  let separator = document.getElementById("separator");

  if (vsMode) {
    player1Score.textContent = `${players[0].name}: ${players[0].score}`;
    player2Score.textContent = `${players[1].name}: ${players[1].score}`;
    player2Score.style.display = "inline";
    separator.style.display = "inline";
  } else {
    player1Score.textContent = `Score: ${players[0].score}`;
    player2Score.style.display = "none";
    separator.style.display = "none";
  }
}

// Display controls
function displayControls() {
  if (!vsMode) {
    controlInfo.innerHTML = `
      <strong>Player 1 Controls:</strong> ${keyBindings.player1.left.toUpperCase()}/${keyBindings.player1.right.toUpperCase()} to move, ${keyBindings.player1.up.toUpperCase()} to jump.<br>

    `;
  } else {
    controlInfo.innerHTML = `
      <strong>Player 1 Controls:</strong> ${keyBindings.player1.left.toUpperCase()}/${keyBindings.player1.right.toUpperCase()} to move, ${keyBindings.player1.up.toUpperCase()} to jump.<br>
      <strong>Player 2 Controls:</strong> Arrow keys to to move and to jump.
    `;
  }
}

// Update controls display
function updateControlsDisplay() {
  displayControls();
}

// Initialize game
function init() {
  resizeCanvas();
  getCSSColors();
  keyBindings = getKeyBindings(keyboardLayout);
  resetGame();
  if (autoRestart) {
    startCountdown();
  } else {
    statusInfo.innerHTML = "Press 'R' to Start the Game";
  }
}
window.onload = init;
