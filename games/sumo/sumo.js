// Get canvas and context
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Variables for CSS colors
let colors = {};

// Responsive canvas setup
function resizeCanvas() {
  canvas.width = window.innerWidth * 0.9;
  canvas.height = window.innerHeight * 0.7;

  // Reset arena boundaries
  arena.radius = Math.min(canvas.width, canvas.height) * 0.4;
  arena.x = canvas.width / 2;
  arena.y = canvas.height / 2;

  // Reset player positions
  resetPlayers();
}
window.addEventListener("resize", resizeCanvas);

// Arena
let arena = {
  x: 0, // Will be set in resizeCanvas()
  y: 0, // Will be set in resizeCanvas()
  radius: 0, // Will be set in resizeCanvas()
};

// Scores
let scores = [0, 0]; // Index 0 for Player 1, 1 for Player 2

// Game state
let gameActive = true;
let gameOver = false;

// Get HTML elements
let statusInfo = document.getElementById("statusInfo");
let controlInfo = document.getElementById("controlInfo");

// Players
let players = [
  {
    x: 0,
    y: 0,
    radius: 30,
    color: "", // Will be set later
    vx: 0,
    vy: 0,
    speed: 5,
    up: false,
    down: false,
    left: false,
    right: false,
    name: "Player 1",
    // Dash properties
    canDash: true,
    isDashing: false,
    dashCooldown: 0,
    dashChargeTime: 0,
    dashDuration: 0,
    dashSpeedMultiplier: 3,
    dashChargeDuration: 0.1, // seconds
    dashActiveDuration: 0.2, // seconds
    cooldownDuration: 0.5, // seconds
    facingAngle: 0,
  },
  {
    x: 0,
    y: 0,
    radius: 30,
    color: "", // Will be set later
    vx: 0,
    vy: 0,
    speed: 5,
    up: false,
    down: false,
    left: false,
    right: false,
    name: "Player 2",
    // Dash properties
    canDash: true,
    isDashing: false,
    dashCooldown: 0,
    dashChargeTime: 0,
    dashDuration: 0,
    dashSpeedMultiplier: 3,
    dashChargeDuration: 0.1, // seconds
    dashActiveDuration: 0.2, // seconds
    cooldownDuration: 0.5, // seconds
    facingAngle: 0,
  },
];

// Key handling
document.addEventListener("keydown", function (e) {
  switch (e.key) {
    // Player 1 controls (WASD)
    case "w":
    case "W":
      players[0].up = true;
      break;
    case "s":
    case "S":
      players[0].down = true;
      break;
    case "a":
    case "A":
      players[0].left = true;
      break;
    case "d":
    case "D":
      players[0].right = true;
      break;
    // Player 1 dash key (Left Shift)
    case "Shift":
      if (
        players[0].canDash &&
        !players[0].isDashing &&
        players[0].dashCooldown <= 0
      ) {
        startDash(players[0]);
      }
      break;
    // Player 2 controls (Arrow keys)
    case "ArrowUp":
      players[1].up = true;
      break;
    case "ArrowDown":
      players[1].down = true;
      break;
    case "ArrowLeft":
      players[1].left = true;
      break;
    case "ArrowRight":
      players[1].right = true;
      break;
    // Player 2 dash key (Right Control)
    case "Control":
      if (
        players[1].canDash &&
        !players[1].isDashing &&
        players[1].dashCooldown <= 0
      ) {
        startDash(players[1]);
      }
      break;
  }
});

document.addEventListener("keyup", function (e) {
  switch (e.key) {
    // Player 1 controls (WASD)
    case "w":
    case "W":
      players[0].up = false;
      break;
    case "s":
    case "S":
      players[0].down = false;
      break;
    case "a":
    case "A":
      players[0].left = false;
      break;
    case "d":
    case "D":
      players[0].right = false;
      break;
    // Player 2 controls (Arrow keys)
    case "ArrowUp":
      players[1].up = false;
      break;
    case "ArrowDown":
      players[1].down = false;
      break;
    case "ArrowLeft":
      players[1].left = false;
      break;
    case "ArrowRight":
      players[1].right = false;
      break;
  }
});

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
  players[0].color = colors.secondary; // Using secondary color for Player 1
  players[1].color = colors.primary; // Using primary color for Player 2
}

// Listen for dark mode changes
document.addEventListener("themeChanged", function () {
  getCSSColors();
});

// Reset player positions
function resetPlayers() {
  // Player 1 starts on the left
  players[0].x = arena.x - arena.radius / 2;
  players[0].y = arena.y;
  players[0].vx = 0;
  players[0].vy = 0;
  players[0].canDash = true;
  players[0].isDashing = false;
  players[0].dashCooldown = 0;

  // Player 2 starts on the right
  players[1].x = arena.x + arena.radius / 2;
  players[1].y = arena.y;
  players[1].vx = 0;
  players[1].vy = 0;
  players[1].canDash = true;
  players[1].isDashing = false;
  players[1].dashCooldown = 0;

  // Do not set gameActive to true here
  statusInfo.innerHTML = "";
  controlInfo.innerHTML = "";
  displayControls();
}

// Game loop
let lastTime = performance.now();
function updateGame(timestamp) {
  let deltaTime = (timestamp - lastTime) / 1000; // Convert to seconds
  lastTime = timestamp;

  if (gameActive) {
    movePlayers(deltaTime);
    checkCollisions();
  }
  draw(); // Always draw, even if game is not active (to display countdown)
  requestAnimationFrame(updateGame);
}

// Move players
function movePlayers(deltaTime) {
  players.forEach(function (player) {
    // Handle dash cooldown
    if (player.dashCooldown > 0) {
      player.dashCooldown -= deltaTime;
      if (player.dashCooldown <= 0) {
        player.dashCooldown = 0;
        player.canDash = true;
      }
    }

    // Handle dash charge time
    if (player.isDashing) {
      player.dashChargeTime += deltaTime;
      if (player.dashChargeTime >= player.dashChargeDuration) {
        // Start dash movement
        player.dashDuration += deltaTime;
        let dashSpeed = player.speed * player.dashSpeedMultiplier;
        player.vx = dashSpeed * Math.cos(player.facingAngle);
        player.vy = dashSpeed * Math.sin(player.facingAngle);
        if (player.dashDuration >= player.dashActiveDuration) {
          // End dash
          player.isDashing = false;
          player.dashChargeTime = 0;
          player.dashDuration = 0;
          player.dashCooldown = player.cooldownDuration;
          player.vx = 0;
          player.vy = 0;
        }
      }
    } else if (player.dashCooldown <= 0) {
      // Apply input to velocity if not in cooldown
      if (!player.isDashing) {
        let moveX = 0;
        let moveY = 0;
        if (player.up) moveY -= player.speed;
        if (player.down) moveY += player.speed;
        if (player.left) moveX -= player.speed;
        if (player.right) moveX += player.speed;

        // Update facing angle
        if (moveX !== 0 || moveY !== 0) {
          player.facingAngle = Math.atan2(moveY, moveX);
        }

        // Apply friction
        player.vx += moveX * deltaTime * 10;
        player.vy += moveY * deltaTime * 10;
        player.vx *= 0.9;
        player.vy *= 0.9;
      }
    } else {
      // During cooldown, player cannot move
      player.vx = 0;
      player.vy = 0;
    }

    // Update position
    player.x += player.vx * deltaTime * 60;
    player.y += player.vy * deltaTime * 60;
  });
}

// Start dash
function startDash(player) {
  player.isDashing = true;
  player.canDash = false;
  player.dashChargeTime = 0;
  player.dashDuration = 0;
  // Player cannot move during charge time
  player.vx = 0;
  player.vy = 0;
}

// Check collisions
function checkCollisions() {
  // Player collision
  let dx = players[1].x - players[0].x;
  let dy = players[1].y - players[0].y;
  let distance = Math.sqrt(dx * dx + dy * dy);
  let minDist = players[0].radius + players[1].radius;

  if (distance < minDist) {
    // Calculate angle and force
    let angle = Math.atan2(dy, dx);
    let overlap = 0.5 * (minDist - distance);

    // Displace players
    players[0].x -= overlap * Math.cos(angle);
    players[0].y -= overlap * Math.sin(angle);
    players[1].x += overlap * Math.cos(angle);
    players[1].y += overlap * Math.sin(angle);

    // Update velocities for bounce effect
    let vxTotal = players[0].vx - players[1].vx;
    let vyTotal = players[0].vy - players[1].vy;

    players[0].vx =
      (players[0].vx * (players[0].radius - players[1].radius) +
        2 * players[1].radius * players[1].vx) /
      (players[0].radius + players[1].radius);
    players[0].vy =
      (players[0].vy * (players[0].radius - players[1].radius) +
        2 * players[1].radius * players[1].vy) /
      (players[0].radius + players[1].radius);

    players[1].vx = vxTotal + players[0].vx;
    players[1].vy = vyTotal + players[0].vy;
  }

  // Check if any player is out of bounds
  players.forEach(function (player, index) {
    let dx = player.x - arena.x;
    let dy = player.y - arena.y;
    let distance = Math.sqrt(dx * dx + dy * dy);

    if (distance + player.radius > arena.radius) {
      // Player is out of bounds
      gameActive = false;

      // Update scores
      let losingPlayerIndex = index;
      let winningPlayerIndex = index === 0 ? 1 : 0;
      scores[winningPlayerIndex]++;

      // Update scoreboard
      updateScoreboard();

      // Next round
      statusInfo.innerHTML =
        players[winningPlayerIndex].name + " Wins the Round!";
      controlInfo.innerHTML = "Press R to Start Next Round";
    }
  });
}

// Draw game elements
function draw() {
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw arena (circle)
  ctx.beginPath();
  ctx.arc(arena.x, arena.y, arena.radius, 0, 2 * Math.PI);
  ctx.strokeStyle = colors.text; // Use the text color for the arena border
  ctx.lineWidth = 5;
  ctx.stroke();

  // Draw players
  players.forEach(function (player) {
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, 2 * Math.PI);
    ctx.fillStyle = player.color;
    ctx.fill();

    // Draw dash charge indication
    if (player.isDashing && player.dashChargeTime < player.dashChargeDuration) {
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = colors.accent; // Use accent color for dash charge
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.radius + 10, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();
    }

    // Draw cooldown overlay
    if (player.dashCooldown > 0 && !player.isDashing) {
      ctx.save();
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)"; // Semi-transparent overlay
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.radius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();
    }
  });

  // If the game is not active and there's a countdown, display it
  if (!gameActive && countdown > 0) {
    ctx.font = "bold 72px Arial";
    ctx.fillStyle = colors.text;
    ctx.textAlign = "center";
    ctx.fillText(countdown, canvas.width / 2, canvas.height / 2);
  }
}

// Display controls
function displayControls() {
  controlInfo.innerHTML = `
        <strong>Player 1 Controls:</strong> W/A/S/D to move, Left Shift to dash.<br>
        <strong>Player 2 Controls:</strong> Arrow keys to move, Right Control to dash.<br>
    `;
}

// Update scoreboard
function updateScoreboard() {
  document.getElementById("player1Score").textContent =
    players[0].name + ": " + scores[0];
  document.getElementById("player2Score").textContent =
    players[1].name + ": " + scores[1];
}

// Variables for countdown
let countdown = 0;

// Restart game or start next round
document.addEventListener("keydown", function (e) {
  if (!gameActive && (e.key === "r" || e.key === "R")) {
    
    resetPlayers(); // Reset players first
    startCountdown(); // Start the 3-second countdown
  }
});

// Start countdown before the game starts
function startCountdown() {
  countdown = 3;
  statusInfo.innerHTML = 'Game starts in ' + countdown + '...';
  gameActive = false; // Ensure game is inactive during countdown
  let countdownInterval = setInterval(function() {
    countdown--;
    if (countdown > 0) {
      statusInfo.innerHTML = 'Game starts in ' + countdown + '...';
    } else {
      clearInterval(countdownInterval);
      statusInfo.innerHTML = '';
      gameActive = true; // Re-enable the game after countdown
    }
  }, 1000);
}

function resetGame() {
  resetPlayers(); // Reset player positions and properties

  if (!vsMode) {
    // Show controls for 1-player mode
    controlInfo.innerHTML = `
      <strong>Player 1 Controls:</strong> W/A/S/D to move, Left Shift to dash.<br>
      AI controls Player 2.<br>
    `;
  } else {
    // Show controls for 2-player mode
    controlInfo.innerHTML = `
      <strong>Player 1 Controls:</strong> W/A/S/D to move, Left Shift to dash.<br>
      <strong>Player 2 Controls:</strong> Arrow keys to move, Right Control to dash.<br>
    `;
  }
}

let modeToggleBtn = document.getElementById("modeToggle");
let vsMode = true; // Start with 2-player mode by default

// Mode toggle button
modeToggleBtn.addEventListener("click", () => {
  vsMode = !vsMode;
  modeToggleBtn.textContent = vsMode
    ? "Switch to 1-Player Mode"
    : "Switch to 2-Player Mode";
  resetGame(); // Reset game after mode change
});

// Move players (including AI for Player 2 in 1-player mode)
function movePlayers(deltaTime) {
  players.forEach(function (player, index) {
    if (index === 1 && !vsMode) {
      // AI logic for Player 2 in 1-player mode
      let targetPlayer = players[0]; // AI is targeting Player 1

      // Calculate direction to Player 1
      let dx = targetPlayer.x - player.x;
      let dy = targetPlayer.y - player.y;
      let distance = Math.sqrt(dx * dx + dy * dy);

      // Move towards Player 1
      if (!player.isDashing) {
        // Normalize direction vector
        let moveX = (dx / distance) * player.speed;
        let moveY = (dy / distance) * player.speed;

        player.vx = moveX * deltaTime * 60;
        player.vy = moveY * deltaTime * 60;

        // Update facing angle
        player.facingAngle = Math.atan2(moveY, moveX);
      }

      // AI Dash Logic - dash if close enough to Player 1
      if (distance < 100 && player.canDash && !player.isDashing) {
        startDash(player);
      }
    } else {
      // Human player movement (Player 1 and Player 2 in 2-player mode)
      if (!player.isDashing) {
        let moveX = 0;
        let moveY = 0;
        if (player.up) moveY -= player.speed;
        if (player.down) moveY += player.speed;
        if (player.left) moveX -= player.speed;
        if (player.right) moveX += player.speed;

        // Update facing angle
        if (moveX !== 0 || moveY !== 0) {
          player.facingAngle = Math.atan2(moveY, moveX);
        }

        // Apply friction
        player.vx += moveX * deltaTime * 10;
        player.vy += moveY * deltaTime * 10;
        player.vx *= 0.9;
        player.vy *= 0.9;
      }
    }

    // Handle dash cooldown
    if (player.dashCooldown > 0) {
      player.dashCooldown -= deltaTime;
      if (player.dashCooldown <= 0) {
        player.dashCooldown = 0;
        player.canDash = true;
      }
    }

    // Handle dash charge time and movement
    if (player.isDashing) {
      player.dashChargeTime += deltaTime;
      if (player.dashChargeTime >= player.dashChargeDuration) {
        // Start dash movement
        player.dashDuration += deltaTime;
        let dashSpeed = player.speed * player.dashSpeedMultiplier;
        player.vx = dashSpeed * Math.cos(player.facingAngle);
        player.vy = dashSpeed * Math.sin(player.facingAngle);
        if (player.dashDuration >= player.dashActiveDuration) {
          // End dash
          player.isDashing = false;
          player.dashChargeTime = 0;
          player.dashDuration = 0;
          player.dashCooldown = player.cooldownDuration;
          player.vx = 0;
          player.vy = 0;
        }
      }
    }

    // Update position
    player.x += player.vx * deltaTime * 60;
    player.y += player.vy * deltaTime * 60;
  });
}

// Initialize game
function init() {
  resizeCanvas();
  getCSSColors();
  resetPlayers();
  updateScoreboard();
  lastTime = performance.now();
  updateGame(lastTime);
}

// Start the game
init();
