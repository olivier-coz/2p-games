// Get CSS variables for colors
let colors = {};

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

// Listen for theme changes
document.addEventListener("themeChanged", function () {
  getCSSColors();
});

// Game variables
let gameActive = false;
let vsMode = false;
let scores = [0, 0]; // Scores for Player 1 and Player 2
let gameTimer = null;
let correctAnswerIndex;
let answerSubmitted = false; // To track if an answer has been submitted for current question
let countdown = 0;
let messageTimeout = null;
let keyboardLayout = "qwerty";
let keyBindings = getKeyBindings(keyboardLayout);

// Players
let players = [
  {
    name: "Player 1",
  },
  {
    name: "Player 2",
  },
];

// Possible numbers and operations
const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 25, 50, 75, 100];
const operations = ["+", "-", "*", "/"];

// Get HTML elements
let statusInfo = document.getElementById("statusInfo");
let controlInfo = document.getElementById("controlInfo");
let messageElement = document.getElementById("message");
let equationElement = document.getElementById("equation");
let answerButtons = [];
for (let i = 0; i < 4; i++) {
  answerButtons.push(document.getElementById("answer" + i));
}
for (let i = 0; i < answerButtons.length; i++) {
  answerButtons[i].addEventListener("click", function () {
    if (!gameActive || answerSubmitted) return;
    checkAnswer(0, i); // player 0 (Player 1) clicks the answer
  });
}
let layoutToggleBtn = document.getElementById("layoutToggle");

// Initialize the game
function init() {
  getCSSColors();
  resetGame();
  updateScoreboard();
  displayControls();

  // Handle key presses
  document.addEventListener("keydown", function (e) {
    // Restart game
    if (!gameActive && (e.key === "r" || e.key === "R")) {
      resetGame();
      startCountdown();
      return;
    }

    if (!gameActive || answerSubmitted) return;
    let player = null;
    let answerIndex = null;

    if (vsMode) {
      // Two-player mode
      // Player 1 controls
      if (e.key === keyBindings.player1.up) {
        player = 0;
        answerIndex = 0;
      } else if (e.key === keyBindings.player1.left) {
        player = 0;
        answerIndex = 1;
      } else if (e.key === keyBindings.player1.down) {
        player = 0;
        answerIndex = 2;
      } else if (e.key === keyBindings.player1.right) {
        player = 0;
        answerIndex = 3;
      }
      // Player 2 controls
      else if (e.key === keyBindings.player2.up) {
        player = 1;
        answerIndex = 0;
      } else if (e.key === keyBindings.player2.left) {
        player = 1;
        answerIndex = 1;
      } else if (e.key === keyBindings.player2.down) {
        player = 1;
        answerIndex = 2;
      } else if (e.key === keyBindings.player2.right) {
        player = 1;
        answerIndex = 3;
      }
    } else {
      // One-player mode
      // Player 1 controls
      if (e.key === keyBindings.player1.up) {
        player = 0;
        answerIndex = 0;
      } else if (e.key === keyBindings.player1.left) {
        player = 0;
        answerIndex = 1;
      } else if (e.key === keyBindings.player1.down) {
        player = 0;
        answerIndex = 2;
      } else if (e.key === keyBindings.player1.right) {
        player = 0;
        answerIndex = 3;
      }
    }

    if (player !== null && answerIndex !== null) {
      checkAnswer(player, answerIndex);
    }
  });

  statusInfo.textContent = "Press R to Start the Game";
}

function resetGame() {
  // Reset variables
  gameActive = false;
  messageElement.innerHTML = "&nbsp;";
  clearInterval(gameTimer);
  scores = [0, 0];
  correctAnswerIndex = null;
  answerSubmitted = false;
  if (vsMode) {
    updateScoreboard();
  } else {
    updateTimers(60);
  }
  displayControls();
  statusInfo.innerHTML = "Press R to Start the Game";
}

function startCountdown() {
  countdown = 3;
  statusInfo.textContent = `Game starts in ${countdown}...`;
  gameActive = false;
  let countdownInterval = setInterval(function () {
    countdown--;
    if (countdown > 0) {
      statusInfo.textContent = `Game starts in ${countdown}...`;
    } else {
      clearInterval(countdownInterval);
      statusInfo.textContent = "Game started!";
      startGame();
    }
  }, 1000);
}

function startGame() {
  gameActive = true;
  generateEquation();
  if (!vsMode) {
    // One-player mode
    startGameTimer();
  }
}

function startGameTimer() {
  let timeLeft = 60;
  updateTimers(timeLeft);
  gameTimer = setInterval(() => {
    if (!gameActive) {
      clearInterval(gameTimer);
      return;
    }

    timeLeft -= 1;
    updateTimers(timeLeft);

    if (timeLeft <= 0) {
      gameActive = false;
      messageElement.textContent = `Time's up! Your score: ${scores[0]}`;
      clearInterval(gameTimer);
      statusInfo.textContent = "Press R to Restart the Game";
    }
  }, 1000);
}

function updateTimers(timeLeft) {
  document.getElementById("player1Score").textContent =
    `${players[0].name}: ${scores[0]}`;
  document.getElementById("player2Score").textContent = `Timer: ${timeLeft}s`;
}

function updateScoreboard() {
  if (vsMode) {
    document.getElementById("player1Score").textContent =
      `${players[0].name}: ${scores[0]}`;
    document.getElementById("player2Score").textContent =
      `${players[1].name}: ${scores[1]}`;
  } else {
    document.getElementById("player1Score").textContent =
      `${players[0].name}: ${scores[0]}`;
  }
}
// Display controls
function displayControls() {
  if (vsMode) {
    controlInfo.innerHTML = `
      <strong>Instructions:</strong><br>
      First player to answer gets +1 for correct, -1 for incorrect.<br>
      <strong>Player 1 Controls:</strong> ${keyBindings.player1.up.toUpperCase()}/${keyBindings.player1.left.toUpperCase()}/${keyBindings.player1.down.toUpperCase()}/${keyBindings.player1.right.toUpperCase()} to select answers.<br>
      <strong>Player 2 Controls:</strong> Arrow keys to select answers.<br>
    `;
  } else {
    controlInfo.innerHTML = `
      <strong>Instructions:</strong><br>
      Solve as many equations as you can before time runs out.<br>
      <strong>Controls:</strong> ${keyBindings.player1.up.toUpperCase()}/${keyBindings.player1.left.toUpperCase()}/${keyBindings.player1.down.toUpperCase()}/${keyBindings.player1.right.toUpperCase()} to select answers.<br>
      <br>
      `;
  }
}

// Update controls display when keyboard layout changes
function updateControlsDisplay() {
  displayControls();
}

function generateEquation() {
  answerSubmitted = false;
  // Randomly select 4 numbers
  let nums = [];
  for (let i = 0; i < 4; i++) {
    nums.push(numbers[Math.floor(Math.random() * numbers.length)]);
  }

  // Randomly select operations
  let ops = [];
  for (let i = 0; i < 3; i++) {
    ops.push(operations[Math.floor(Math.random() * operations.length)]);
  }

  // Decide whether to include parentheses
  let includeParentheses = Math.random() > 0.5;

  let equationStr;
  if (includeParentheses) {
    let parenthesesPosition = Math.floor(Math.random() * 2);
    if (parenthesesPosition === 0) {
      equationStr = `(${nums[0]} ${ops[0]} ${nums[1]}) ${ops[1]} ${nums[2]} ${ops[2]} ${nums[3]}`;
    } else {
      equationStr = `${nums[0]} ${ops[0]} (${nums[1]} ${ops[1]} ${nums[2]}) ${ops[2]} ${nums[3]}`;
    }
  } else {
    equationStr = `${nums[0]} ${ops[0]} ${nums[1]} ${ops[1]} ${nums[2]} ${ops[2]} ${nums[3]}`;
  }

  // Calculate the correct answer
  let correctAnswer = null;
  try {
    correctAnswer = eval(equationStr);
    correctAnswer = parseFloat(correctAnswer.toFixed(2)); // Fix to 2 decimal places
    if (isNaN(correctAnswer) || !isFinite(correctAnswer)) throw new Error();
  } catch (e) {
    // If there's an error in evaluation, regenerate the equation
    return generateEquation();
  }

  // Generate possible answers
  let answers = [];
  answers.push(correctAnswer);

  // Incorrect answers
  let incorrectAnswer1 = parseFloat(
    (correctAnswer + Math.floor(Math.random() * 20) - 10).toFixed(2),
  ); // Fix to 2 decimal places
  let incorrectAnswer2 = parseFloat(
    (correctAnswer + Math.floor(Math.random() * 40) - 20).toFixed(2),
  ); // Fix to 2 decimal places
  let incorrectAnswer3 = parseFloat(
    generateIncorrectAnswer(nums, ops, correctAnswer).toFixed(2),
  ); // Fix to 2 decimal places

  answers.push(incorrectAnswer1);
  answers.push(incorrectAnswer2);
  answers.push(incorrectAnswer3);

  // Remove duplicate answers
  answers = [...new Set(answers)];

  // If we have less than 4 unique answers, regenerate the equation
  if (answers.length < 4) {
    return generateEquation();
  }

  // Shuffle answers
  answers = shuffleArray(answers);

  // Set the correct answer index
  correctAnswerIndex = answers.indexOf(correctAnswer);

  // Display equation and answers
  equationElement.textContent = equationStr;
  for (let i = 0; i < 4; i++) {
    answerButtons[i].textContent = answers[i];
  }
}

function generateIncorrectAnswer(nums, ops, correctAnswer) {
  let equationStr = `${nums[0]} ${ops[0]} ${nums[1]} ${ops[1]} ${nums[2]} ${ops[2]} ${nums[3]}`;
  let incorrectAnswer = null;
  try {
    // Evaluate left to right without considering operator precedence
    incorrectAnswer = evaluateLeftToRight(equationStr);
    incorrectAnswer = Math.round(incorrectAnswer * 100) / 100;
  } catch (e) {
    incorrectAnswer = correctAnswer + Math.floor(Math.random() * 30) - 15;
  }
  return incorrectAnswer;
}

// Evaluate expression left to right ignoring operator precedence
function evaluateLeftToRight(expr) {
  let tokens = expr.split(" ");
  let result = parseFloat(tokens[0]);
  for (let i = 1; i < tokens.length; i += 2) {
    let op = tokens[i];
    let num = parseFloat(tokens[i + 1]);
    switch (op) {
      case "+":
        result += num;
        break;
      case "-":
        result -= num;
        break;
      case "*":
        result *= num;
        break;
      case "/":
        result /= num;
        break;
    }
  }
  return result;
}

function checkAnswer(player, answerIndex) {
  if (!gameActive || answerSubmitted) return;
  answerSubmitted = true;

  if (answerIndex === correctAnswerIndex) {
    scores[player]++;
    messageElement.textContent = `${players[player].name} is correct!`;
  } else {
    scores[player]--;
    messageElement.textContent = `${players[player].name} is incorrect!`;
  }
  updateScoreboard();

  if (gameActive) {
    clearTimeout(messageTimeout);
    messageTimeout = setTimeout(function () {
      messageElement.innerHTML = "&nbsp;";
    }, 2000);
    generateEquation();
  }
}

// Shuffle an array
function shuffleArray(array) {
  let currentIndex = array.length,
    temporaryValue,
    randomIndex;
  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    // Swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
  return array;
}

// Key bindings based on keyboard layout
function getKeyBindings(layout) {
  if (layout === "azerty") {
    return {
      player1: {
        up: "z",
        down: "s",
        left: "q",
        right: "d",
      },
      player2: {
        up: "ArrowUp",
        down: "ArrowDown",
        left: "ArrowLeft",
        right: "ArrowRight",
      },
    };
  } else {
    // Default to QWERTY
    return {
      player1: {
        up: "w",
        down: "s",
        left: "a",
        right: "d",
      },
      player2: {
        up: "ArrowUp",
        down: "ArrowDown",
        left: "ArrowLeft",
        right: "ArrowRight",
      },
    };
  }
}

// Start the game
init();
