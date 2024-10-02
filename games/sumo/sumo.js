// sumo.js

// Constants
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// HTML Elements
const statusInfo = document.getElementById("statusInfo");
const controlInfo = document.getElementById("controlInfo");

// Variables
let colors = {};
let arena = { x: 0, y: 0, radius: 0 };
let scores = [0, 0];
let gameActive = false;
let autoRestart = false;
let keyboardLayout = "qwerty";
let vsMode = false;
let keyBindings = getKeyBindings(keyboardLayout);
let lastTime = performance.now();
let countdown = 0;

// Players
let players = [
  {
    x: 0,
    y: 0,
    radius: 30,
    color: "",
    vx: 0,
    vy: 0,
    speed: 5,
    up: false,
    down: false,
    left: false,
    right: false,
    name: "Player 1",
    canDash: true,
    isDashing: false,
    dashCooldown: 0,
    dashChargeTime: 0,
    dashDuration: 0,
    dashSpeedMultiplier: 3,
    dashChargeDuration: 0.1,
    dashActiveDuration: 0.15,
    cooldownDuration: 1,
    facingAngle: 0,
  },
  {
    x: 0,
    y: 0,
    radius: 30,
    color: "",
    vx: 0,
    vy: 0,
    speed: 5,
    up: false,
    down: false,
    left: false,
    right: false,
    name: "Player 2",
    canDash: true,
    isDashing: false,
    dashCooldown: 0,
    dashChargeTime: 0,
    dashDuration: 0,
    dashSpeedMultiplier: 3,
    dashChargeDuration: 0.1,
    dashActiveDuration: 0.2,
    cooldownDuration: 0.5,
    facingAngle: 0,
  },
];

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

// Reset player positions
function resetPlayers() {
  players.forEach((player, index) => {
    player.x = arena.x + (index === 0 ? -1 : 1) * (arena.radius / 2);
    player.y = arena.y;
    player.vx = 0;
    player.vy = 0;
    player.canDash = true;
    player.isDashing = false;
    player.dashCooldown = 0;
    player.up = false;
    player.down = false;
    player.left = false;
    player.right = false;
    player.facingAngle = 0;
    player.dashChargeTime = 0;
    player.dashDuration = 0;
  });

  statusInfo.innerHTML = "";
  controlInfo.innerHTML = "";
  displayControls();
}

// Display controls
function displayControls() {
  if (!vsMode) {
    controlInfo.innerHTML = `
      <strong>Player 1 Controls:</strong> ${keyBindings.player1.up.toUpperCase()}/${keyBindings.player1.left.toUpperCase()}/${keyBindings.player1.down.toUpperCase()}/${keyBindings.player1.right.toUpperCase()} to move, ${keyBindings.player1.action} to dash.<br>
      AI controls Player 2.<br>
    `;
  } else {
    controlInfo.innerHTML = `
      <strong>Player 1 Controls:</strong> ${keyBindings.player1.up.toUpperCase()}/${keyBindings.player1.left.toUpperCase()}/${keyBindings.player1.down.toUpperCase()}/${keyBindings.player1.right.toUpperCase()} to move, ${keyBindings.player1.action} to dash.<br>
      <strong>Player 2 Controls:</strong> Arrow keys to move, ${keyBindings.player2.action} to dash.<br>
    `;
  }
}

// Update controls display when keyboard layout changes
function updateControlsDisplay() {
  displayControls();
}

// Update scoreboard
function updateScoreboard() {
  document.getElementById("player1Score").textContent =
    `${players[0].name}: ${scores[0]}`;
  document.getElementById("player2Score").textContent =
    `${players[1].name}: ${scores[1]}`;
}

// Reset scoreboard
function resetScoreboard() {
  scores = [0, 0];
  updateScoreboard();
}

// Game initialization
function init() {
  resizeCanvas();
  getCSSColors();
  keyBindings = getKeyBindings(keyboardLayout);
  resetPlayers();
  updateScoreboard();
  lastTime = performance.now();
  gameActive = false;
  updateGame(lastTime);

  if (autoRestart) {
    startCountdown();
  } else {
    statusInfo.innerHTML = "Press R to Start the Game";
  }
}

// Game loop
function updateGame(timestamp) {
  let deltaTime = (timestamp - lastTime) / 1000;
  lastTime = timestamp;

  if (gameActive) {
    movePlayers(deltaTime);
    checkCollisions();
  }
  draw();
  requestAnimationFrame(updateGame);
}

// Move players (including AI for Player 2 in 1-player mode)
function movePlayers(deltaTime) {
  players.forEach(function (player, index) {
    if (index === 1 && !vsMode) {
      // AI logic for Player 2 in 1-player mode
      let targetPlayer = players[0];

      // Calculate direction to Player 1
      let dx = targetPlayer.x - player.x;
      let dy = targetPlayer.y - player.y;
      let distance = Math.sqrt(dx * dx + dy * dy);

      if (!player.isDashing) {
        // Normalize direction vector
        let moveX = (dx / distance) * player.speed;
        let moveY = (dy / distance) * player.speed;

        player.vx = moveX * deltaTime * 60;
        player.vy = moveY * deltaTime * 60;

        // Update facing angle
        player.facingAngle = Math.atan2(moveY, moveX);
      }

      // AI Dash Logic
      if (distance < 100 && player.canDash && !player.isDashing) {
        startDash(player);
      }
    } else {
      // Human player movement
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

    // Handle dash charge and movement
    if (player.isDashing) {
      player.dashChargeTime += deltaTime;
      if (player.dashChargeTime >= player.dashChargeDuration) {
        player.dashDuration += deltaTime;
        let dashSpeed = player.speed * player.dashSpeedMultiplier;
        player.vx = dashSpeed * Math.cos(player.facingAngle);
        player.vy = dashSpeed * Math.sin(player.facingAngle);
        if (player.dashDuration >= player.dashActiveDuration) {
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

// Start dash
function startDash(player) {
  player.isDashing = true;
  player.canDash = false;
  player.dashChargeTime = 0;
  player.dashDuration = 0;
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
    let angle = Math.atan2(dy, dx);
    let overlap = 0.5 * (minDist - distance);

    // Displace players
    players[0].x -= overlap * Math.cos(angle);
    players[0].y -= overlap * Math.sin(angle);
    players[1].x += overlap * Math.cos(angle);
    players[1].y += overlap * Math.sin(angle);

    // Bounce effect
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
      gameActive = false;
      let winningPlayerIndex = index === 0 ? 1 : 0;
      scores[winningPlayerIndex]++;
      updateScoreboard();

      statusInfo.innerHTML = `${players[winningPlayerIndex].name} Wins the Round! Press R to restart.`;

      if (autoRestart) {
        resetPlayers();
        startCountdown();
      }
    }
  });
}

// Draw game elements
function draw() {
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw arena
  ctx.beginPath();
  ctx.arc(arena.x, arena.y, arena.radius, 0, 2 * Math.PI);
  ctx.strokeStyle = colors.text;
  ctx.lineWidth = 5;
  ctx.stroke();

  // Draw players
  players.forEach(function (player) {
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, 2 * Math.PI);
    ctx.fillStyle = player.color;
    ctx.fill();

    // Dash charge indication
    if (player.isDashing && player.dashChargeTime < player.dashChargeDuration) {
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = colors.accent;
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.radius + 10, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();
    }

    // Cooldown overlay
    if (player.dashCooldown > 0 && !player.isDashing) {
      ctx.save();
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.radius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();
    }
  });

  // Display countdown
  if (!gameActive && countdown > 0) {
    ctx.font = "bold 72px Arial";
    ctx.fillStyle = colors.text;
    ctx.textAlign = "center";
    ctx.fillText(countdown, canvas.width / 2, canvas.height / 2);
  }
}

// Start countdown
function startCountdown() {
  countdown = 3;
  statusInfo.innerHTML = `Game starts in ${countdown}...`;
  gameActive = false;
  let countdownInterval = setInterval(function () {
    countdown--;
    if (countdown > 0) {
      statusInfo.innerHTML = `Game starts in ${countdown}...`;
    } else {
      clearInterval(countdownInterval);
      statusInfo.innerHTML = "...";
      gameActive = true;
    }
  }, 1000);
}

function resetGame() {
  resetPlayers();
  gameActive = false;
  countdown = 0;
  statusInfo.innerHTML = "...";
  displayControls();
  resetScoreboard();

  if (autoRestart) {
    startCountdown();
  } else {
    statusInfo.innerHTML = "Press R to Start the Game";
  }
}

// Key handling
document.addEventListener("keydown", function (e) {
  // Restart game
  if (!gameActive && (e.key === "r" || e.key === "R")) {
    resetPlayers();
    startCountdown();
    return;
  }

  // Player controls
  players.forEach((player, index) => {
    let bindings = index === 0 ? keyBindings.player1 : keyBindings.player2;
    if (e.key === bindings.up) {
      player.up = true;
    } else if (e.key === bindings.down) {
      player.down = true;
    } else if (e.key === bindings.left) {
      player.left = true;
    } else if (e.key === bindings.right) {
      player.right = true;
    } else if (e.key === bindings.action) {
      if (player.canDash && !player.isDashing && player.dashCooldown <= 0) {
        startDash(player);
      }
    }
  });
});

document.addEventListener("keyup", function (e) {
  players.forEach((player, index) => {
    let bindings = index === 0 ? keyBindings.player1 : keyBindings.player2;
    if (e.key === bindings.up) {
      player.up = false;
    } else if (e.key === bindings.down) {
      player.down = false;
    } else if (e.key === bindings.left) {
      player.left = false;
    } else if (e.key === bindings.right) {
      player.right = false;
    }
  });
});

// Listen for theme changes
document.addEventListener("themeChanged", function () {
  getCSSColors();
});

// Window resize event
window.addEventListener("resize", resizeCanvas);

// Initialize game
init();
