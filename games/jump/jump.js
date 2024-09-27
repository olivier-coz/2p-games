// games/platform-jumper/platform-jumper.js

// Canvas setup
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Variables for CSS colors
let colors = {};

// Responsive canvas setup
function resizeCanvas() {
  canvas.width = window.innerWidth * 0.9;
  canvas.height = window.innerHeight * 0.7;
}
window.addEventListener("resize", resizeCanvas);

// Game variables
let gameActive = false;
let gameOver = false;
let countdown = 0;
let platforms = [];
let numPlatforms = 16;
let platformWidth = 70;
let platformHeight = 15;
let platformSpeed = 1;
let gravity = 0.5;
let jumpStrength = -15;
let vsMode = false; // False = 1-Player, True = 2-Player
let animationFrameId; // To keep track of the animation frame ID

// Players
let players = [
  {
    x: 0,
    y: 0,
    width: 40,
    height: 40,
    color: "", // Will be set later
    vy: 0,
    isJumping: false,
    score: 0,
    controls: {
      left: "ArrowLeft",
      right: "ArrowRight",
      jump: "ArrowUp",
    },
  },
  {
    x: 0,
    y: 0,
    width: 40,
    height: 40,
    color: "", // Will be set later
    vy: 0,
    isJumping: false,
    score: 0,
    controls: {
      left: "a",
      right: "d",
      jump: "w",
    },
  },
];

let keysPressed = {};

// Get HTML elements
let statusInfo = document.getElementById("statusInfo");
let controlInfo = document.getElementById("controlInfo");
let modeToggleBtn = document.getElementById("modeToggle");

// Get CSS variables for colors
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
  players[0].color = colors.primary;
  players[1].color = colors.secondary;
}

// Listen for dark mode changes
document.addEventListener("themeChanged", function () {
  getCSSColors();
});

// Event listeners
document.addEventListener("keydown", function (e) {
  keysPressed[e.key] = true;
  if (!gameActive && (e.key === "r" || e.key === "R")) {
    resetGame();
    startCountdown();
  }
});
document.addEventListener("keyup", function (e) {
  keysPressed[e.key] = false;
});

// Mode toggle button
modeToggleBtn.addEventListener("click", () => {
  vsMode = !vsMode;
  modeToggleBtn.textContent = vsMode
    ? "Switch to 1-Player Mode"
    : "Switch to 2-Player Mode";
  resetGame();
});

// Start countdown before the game starts
function startCountdown() {
  countdown = 3;
  statusInfo.innerHTML = "Game starts in " + countdown + "...";
  gameActive = false; // Ensure game is inactive during countdown
  let countdownInterval = setInterval(function () {
    countdown--;
    if (countdown > 0) {
      statusInfo.innerHTML = "Game starts in " + countdown + "...";
    } else {
      clearInterval(countdownInterval);
      statusInfo.innerHTML = "";
      gameActive = true; // Re-enable the game after countdown
    }
  }, 1000);
}

// Reset game variables
function resetGame() {
  gameOver = false;
  gameActive = false;
  countdown = 0;
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

  players[1].x =
    centerPlatform.x + (3 * platformWidth) / 4 - players[1].width / 2;
  players[1].y = centerPlatform.y - players[1].height;
  players[1].vy = 0;
  players[1].isJumping = false;

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
    drawGameOver();
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
    activePlayers.forEach((player) => {
      updatePlayer(player);
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
function updatePlayer(player) {
  // Apply gravity
  player.vy += gravity;
  player.y += player.vy;

  // Move left and right
  if (keysPressed[player.controls.left] && player.x > 0) {
    player.x -= 5;
  }
  if (
    keysPressed[player.controls.right] &&
    player.x + player.width < canvas.width
  ) {
    player.x += 5;
  }

  // Jump
  if (keysPressed[player.controls.jump] && !player.isJumping) {
    player.vy = jumpStrength;
    player.isJumping = true;
  }

  // Check collision with platforms
  platforms.forEach((platform) => {
    if (
      player.vy > 0 &&
      player.y + player.height >= platform.y &&
      player.y + player.height <= platform.y + platform.height &&
      player.x + player.width > platform.x &&
      player.x < platform.x + platform.width
    ) {
      player.y = platform.y - player.height;
      player.vy = 0;
      player.isJumping = false;
      player.score += 1;
    }
  });

  // Check if player falls off the screen
  if (player.y > canvas.height) {
    gameOver = true;
    gameActive = false;
  }
}

// Draw platforms
function drawPlatforms() {
  ctx.fillStyle = colors.accent; // Use accent color for platforms
  platforms.forEach((platform) => {
    ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
  });
}

// Draw player
function drawPlayer(player) {
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.width, player.height);
}

// Draw game over screen
function drawGameOver() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = colors.text;
  ctx.font = "48px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2 - 50);

  if (vsMode) {
    // Determine winner
    let winner;
    if (players[0].score > players[1].score) {
      winner = "Player 1 Wins!";
    } else if (players[0].score < players[1].score) {
      winner = "Player 2 Wins!";
    } else {
      winner = "It's a Tie!";
    }
    ctx.fillText(winner, canvas.width / 2, canvas.height / 2);
  } else {
    ctx.fillText(
      "Your Score: " + players[0].score,
      canvas.width / 2,
      canvas.height / 2
    );
  }

  ctx.font = "24px Arial";
  ctx.fillText(
    "Press R to Restart",
    canvas.width / 2,
    canvas.height / 2 + 50
  );
}

// Update scoreboard
function updateScoreboard() {
  let player1Score = document.getElementById("player1Score");
  let player2Score = document.getElementById("player2Score");
  let separator = document.getElementById("separator");

  if (vsMode) {
    player1Score.textContent = `Player 1: ${players[0].score}`;
    player2Score.textContent = `Player 2: ${players[1].score}`;
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
  controlInfo.innerHTML = `
        <strong>Player 1 Controls:</strong> Arrow keys to move, Up Arrow to jump.<br>
        ${
          vsMode
            ? "<strong>Player 2 Controls:</strong> A/D to move, W to jump.<br>"
            : ""
        }
        Press R to Start.
    `;
}

// Initialize game
function init() {
  resizeCanvas();
  getCSSColors();
  resetGame();
  // Wait for user to start the game
  ctx.fillStyle = colors.text;
  ctx.font = "36px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Press R to Start", canvas.width / 2, canvas.height / 2);
}
window.onload = init;
