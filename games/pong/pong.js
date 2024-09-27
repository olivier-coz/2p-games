// Get canvas and context
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Variables for CSS colors
let colors = {};

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
}

// Listen for dark mode changes
document.addEventListener("themeChanged", function () {
  getCSSColors();
});

getCSSColors(); // Initialize colors

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
window.addEventListener("resize", resizeCanvas);

// Game elements
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
    color: "", // Will be set later
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
    color: "", // Will be set later
  },
];

// Game state variables
let gameActive = false; // Game starts inactive
let countdown = 0; // Countdown timer
let countdownInterval; // Interval for countdown

// Event listeners for key presses
document.addEventListener("keydown", keyDownHandler);
document.addEventListener("keyup", keyUpHandler);

function keyDownHandler(e) {
  switch (e.key) {
    // Player 1 controls (W/S keys)
    case "w":
    case "W":
      players[0].up = true;
      break;
    case "s":
    case "S":
      players[0].down = true;
      break;
    // Player 2 controls (Arrow keys)
    case "ArrowUp":
      players[1].up = true;
      break;
    case "ArrowDown":
      players[1].down = true;
      break;
    // Restart game
    case "r":
    case "R":
      resetPositions();
      startCountdown();
      break;
  }
}

function keyUpHandler(e) {
  switch (e.key) {
    // Player 1 controls (W/S keys)
    case "w":
    case "W":
      players[0].up = false;
      break;
    case "s":
    case "S":
      players[0].down = false;
      break;
    // Player 2 controls (Arrow keys)
    case "ArrowUp":
      players[1].up = false;
      break;
    case "ArrowDown":
      players[1].down = false;
      break;
  }
}

// Mode toggle button
const modeToggleBtn = document.getElementById("modeToggle");
let vsAI = true; // Start with AI mode

modeToggleBtn.addEventListener("click", () => {
  vsAI = !vsAI;
  modeToggleBtn.textContent = vsAI
    ? "Switch to 2-Player Mode"
    : "Switch to 1-Player Mode";
  resetGame();
});

// Initialize game
function init() {
  resizeCanvas();
  getCSSColors();
  players[0].color = colors.secondary; // Using secondary color for Player 1
  players[1].color = colors.primary; // Using primary color for Player 2
  resetGame();
  startCountdown(); // Start the countdown at the beginning
  draw();
}

// Reset game
function resetGame() {
  players[0].score = 0;
  players[1].score = 0;
  updateScoreboard();
  resetPositions();
  displayControls();
}

// Reset positions
function resetPositions() {
  // Reset positions
  players[0].x = 0;
  players[0].y = (canvas.height - paddleHeight) / 2;

  players[1].x = canvas.width - paddleWidth;
  players[1].y = (canvas.height - paddleHeight) / 2;

  resetBall();
}

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
    // Move paddles
    movePaddles();

    // Move ball
    moveBall();
  }

  // Display countdown
  if (countdown > 0) {
    ctx.font = `${canvas.height / 5}px Arial`;
    ctx.fillStyle = colors.text;
    ctx.textAlign = "center";
    ctx.fillText(countdown, canvas.width / 2, canvas.height / 2);
  }

  requestAnimationFrame(draw);
}

function drawPaddle(x, y, width, height, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, height);
}

function drawBall(x, y, radius) {
  ctx.fillStyle = colors.accent;
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

function movePaddles() {
  if (!gameActive) return;

  // Player 1 controls
  if (players[0].up && players[0].y > 0) {
    players[0].y -= 7;
  } else if (
    players[0].down &&
    players[0].y < canvas.height - players[0].height
  ) {
    players[0].y += 7;
  }

  if (vsAI) {
    // AI for Player 2
    let predictedY = predictBallY();
    let aiSpeed = 7;
    let distance = predictedY - (players[1].y + players[1].height / 2);
    let threshold = players[1].height / 3; // AI doesn't move if within a third of paddle height

    if (Math.abs(distance) > threshold) {
      if (distance > 0 && players[1].y + players[1].height < canvas.height) {
        players[1].y += aiSpeed;
      } else if (distance < 0 && players[1].y > 0) {
        players[1].y -= aiSpeed;
      }
    }
  } else {
    // Player 2 controls
    if (players[1].up && players[1].y > 0) {
      players[1].y -= 7;
    } else if (
      players[1].down &&
      players[1].y < canvas.height - players[1].height
    ) {
      players[1].y += 7;
    }
  }
}

function moveBall() {
  if (!gameActive) return;

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
    startCountdown();
  } else if (ball.x + ball.radius > canvas.width) {
    // Player 1 scores
    players[0].score++;
    updateScoreboard();
    resetPositions();
    startCountdown();
  }
}

function collisionDetect(ball, paddle) {
  return (
    ball.x - ball.radius < paddle.x + paddle.width &&
    ball.x + ball.radius > paddle.x &&
    ball.y - ball.radius < paddle.y + paddle.height &&
    ball.y + ball.radius > paddle.y
  );
}

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

// Update scoreboard
function updateScoreboard() {
  document.getElementById("player1Score").textContent =
    players[0].name + ": " + players[0].score;
  document.getElementById("player2Score").textContent =
    players[1].name + ": " + players[1].score;
}

// Display controls
function displayControls() {
  let controlInfo = document.getElementById("controlInfo");
  if (vsAI) {
    controlInfo.innerHTML = `
      <strong>Player 1 Controls:</strong> W/S to move.<br>
      AI controls Player 2.<br>
      Press 'R' to restart the game.
    `;
  } else {
    controlInfo.innerHTML = `
      <strong>Player 1 Controls:</strong> W/S to move.<br>
      <strong>Player 2 Controls:</strong> Arrow keys to move.<br>
      Press 'R' to restart the game.
    `;
  }
}

// Start countdown before the game starts
function startCountdown() {
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }
  countdown = 3;
  gameActive = false; // Ensure game is inactive during countdown
  countdownInterval = setInterval(function() {
    countdown--;
    if (countdown <= 0) {
      clearInterval(countdownInterval);
      countdown = 0;
      gameActive = true; // Re-enable the game after countdown
    }
  }, 1000);
}

// Start the game
init();
