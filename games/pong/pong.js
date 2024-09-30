// pong.js

// Constants
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// HTML Elements
const statusInfo = document.getElementById("statusInfo");
const controlInfo = document.getElementById("controlInfo");

// Variables
let colors = {};
let gameActive = false;
let vsMode = false;
let autoRestart = false;
let keyboardLayout = "qwerty";
let keyBindings = getKeyBindings(keyboardLayout);
let countdown = 0;
let countdownInterval;

// Game Elements
let ball = {
  x: 0,
  y: 0,
  radius: 10,
  speed: 8,
  velocityX: 8,
  velocityY: 8,
};

let paddleWidth;
let paddleHeight;

// Players
let players = [
  {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    score: 0,
    up: false,
    down: false,
    name: "Player 1",
    color: "",
  },
  {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    score: 0,
    up: false,
    down: false,
    name: "Player 2",
    color: "",
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

  // Update game elements based on new size
  paddleHeight = canvas.height / 6;
  paddleWidth = canvas.width / 80;
  ball.radius = canvas.width / 100;

  // Set paddles size
  players[0].width = paddleWidth;
  players[0].height = paddleHeight;

  players[1].width = paddleWidth;
  players[1].height = paddleHeight;

  // Reset positions
  resetPositions();
}

// Reset positions
function resetPositions() {
  // Reset player positions
  players[0].x = 0;
  players[0].y = (canvas.height - paddleHeight) / 2;

  players[1].x = canvas.width - paddleWidth;
  players[1].y = (canvas.height - paddleHeight) / 2;

  resetBall();

  statusInfo.innerHTML = "";
  controlInfo.innerHTML = "";
  displayControls();
}

// Reset ball position and speed
function resetBall() {
  ball.x = canvas.width / 2;
  ball.y = canvas.height / 2;
  ball.speed = 8;
  // Random initial direction
  let angle = (Math.random() * Math.PI) / 2 - Math.PI / 4;
  let direction = Math.random() > 0.5 ? 1 : -1;
  ball.velocityX = direction * ball.speed * Math.cos(angle);
  ball.velocityY = ball.speed * Math.sin(angle);
}

// Display controls
function displayControls() {
  if (!vsMode) {
    controlInfo.innerHTML = `
      <strong>Player 1 Controls:</strong> ${keyBindings.player1.up.toUpperCase()}/${keyBindings.player1.down.toUpperCase()} to move.<br>
      AI controls Player 2.
    `;
  } else {
    controlInfo.innerHTML = `
      <strong>Player 1 Controls:</strong> ${keyBindings.player1.up.toUpperCase()}/${keyBindings.player1.down.toUpperCase()} to move.<br>
      <strong>Player 2 Controls:</strong> Arrow keys to move,
    `;
  }
}

// Update scoreboard
function updateScoreboard() {
  document.getElementById("player1Score").textContent =
    `${players[0].name}: ${players[0].score}`;
  document.getElementById("player2Score").textContent =
    `${players[1].name}: ${players[1].score}`;
}

// Reset scores
function resetScoreboard() {
  players[0].score = 0;
  players[1].score = 0;
  updateScoreboard();
}

// Reset game
function resetGame() {
  resetScoreboard();
  resetPositions();
  displayControls();

  gameActive = false;
  countdown = 0;
  statusInfo.innerHTML = "...";

  if (autoRestart) {
    startCountdown();
  } else {
    statusInfo.innerHTML = "Press R to Start the Game";
  }
}

// Start countdown before the game starts
function startCountdown() {
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }
  countdown = 3;
  statusInfo.innerHTML = `Game starts in ${countdown}...`;
  gameActive = false; // Ensure game is inactive during countdown
  countdownInterval = setInterval(function () {
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

// Draw game elements
function draw() {
  // Clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw paddles and ball
  drawPaddle(
    players[0].x,
    players[0].y,
    players[0].width,
    players[0].height,
    players[0].color,
  );
  drawPaddle(
    players[1].x,
    players[1].y,
    players[1].width,
    players[1].height,
    players[1].color,
  );
  drawBall(ball.x, ball.y, ball.radius);

  // Draw middle line
  drawNet();

  // Move paddles and ball only if game is active
  if (gameActive) {
    movePaddles();
    moveBall();
  }

  // Display countdown
  if (!gameActive && countdown > 0) {
    ctx.font = "bold 72px Arial";
    ctx.fillStyle = colors.text;
    ctx.textAlign = "center";
    ctx.fillText(countdown, canvas.width / 2, canvas.height / 2.1);
  }

  requestAnimationFrame(draw);
}

function drawPaddle(x, y, width, height, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, height);
}

function drawBall(x, y, radius) {
  ctx.fillStyle = colors.text;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fill();
}

function drawNet() {
  ctx.strokeStyle = colors.muted;
  ctx.beginPath();
  ctx.setLineDash([5, 15]);
  ctx.moveTo(canvas.width / 2, 0);
  ctx.lineTo(canvas.width / 2, canvas.height);
  ctx.stroke();
  ctx.setLineDash([]);
}

// Move paddles
function movePaddles() {
  players.forEach((player, index) => {
    if (index === 1 && !vsMode) {
      // AI logic for Player 2
      let predictedY = predictBallY();
      let aiSpeed = 5;
      let distance = predictedY - (player.y + player.height / 2);
      let threshold = player.height / 3;

      if (Math.abs(distance) > threshold) {
        if (distance > 0 && player.y + player.height < canvas.height) {
          player.y += aiSpeed;
        } else if (distance < 0 && player.y > 0) {
          player.y -= aiSpeed;
        }
      }
    } else {
      // Human player movement
      if (player.up && player.y > 0) {
        player.y -= 7;
      } else if (player.down && player.y < canvas.height - player.height) {
        player.y += 7;
      }
    }
  });
}

// Move ball
function moveBall() {
  ball.x += ball.velocityX;
  ball.y += ball.velocityY;

  // Top and bottom wall collision
  if (ball.y + ball.radius > canvas.height) {
    ball.velocityY = -Math.abs(ball.velocityY);
  } else if (ball.y - ball.radius < 0) {
    ball.velocityY = Math.abs(ball.velocityY);
  }

  // Paddle collision
  let paddle = ball.x < canvas.width / 2 ? players[0] : players[1];
  if (collisionDetect(ball, paddle)) {
    // Determine collision point
    let collidePoint = ball.y - (paddle.y + paddle.height / 2);
    // Normalize
    collidePoint = collidePoint / (paddle.height / 2);

    // Calculate angle
    let angleRad = (Math.PI / 4) * collidePoint;

    // Direction of ball when hit
    let direction = ball.x < canvas.width / 2 ? 1 : -1;

    // Increase speed by 5%
    ball.speed *= 1.12;

    // Max speed limits
    if (ball.speed > 20) {
      ball.speed = 20;
    }

    // Update velocity
    ball.velocityX = direction * ball.speed * Math.cos(angleRad);
    ball.velocityY = ball.speed * Math.sin(angleRad);
  }

  // Left and right wall collision (score)
  if (ball.x - ball.radius < 0) {
    // Player 2 scores
    players[1].score++;
    updateScoreboard();
    resetPositions();
    if (autoRestart) {
      startCountdown();
    } else {
      gameActive = false;
      statusInfo.innerHTML = `${players[1].name} Scores! Press 'R' to restart.`;
    }
  } else if (ball.x + ball.radius > canvas.width) {
    // Player 1 scores
    players[0].score++;
    updateScoreboard();
    resetPositions();
    if (autoRestart) {
      startCountdown();
    } else {
      gameActive = false;
      statusInfo.innerHTML = `${players[0].name} Scores! Press 'R' to restart.`;
    }
  }
}

// Collision detection
function collisionDetect(ball, paddle) {
  return (
    ball.x - ball.radius < paddle.x + paddle.width &&
    ball.x + ball.radius > paddle.x &&
    ball.y - ball.radius < paddle.y + paddle.height &&
    ball.y + ball.radius > paddle.y
  );
}

// Predict ball position for AI
function predictBallY() {
  // Predict where the ball will be when it reaches the AI paddle
  let timeToReachPaddle = (players[1].x - ball.x) / ball.velocityX;
  let predictedY = ball.y + ball.velocityY * timeToReachPaddle;

  // Account for ball bouncing off the top and bottom walls
  while (predictedY < 0 || predictedY > canvas.height) {
    if (predictedY < 0) {
      predictedY = -predictedY;
    } else if (predictedY > canvas.height) {
      predictedY = 2 * canvas.height - predictedY;
    }
  }
  return predictedY;
}

// Key handling
document.addEventListener("keydown", function (e) {
  // Restart game
  if (!gameActive && (e.key === "r" || e.key === "R")) {
    resetPositions();
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
    }
  });
});

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
  draw();
}

// Listen for theme changes
document.addEventListener("themeChanged", function () {
  getCSSColors();
});

// Window resize event
window.addEventListener("resize", resizeCanvas);

// Start the game
init();
