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

// Listen for theme changes (if you have a theme switcher)
document.addEventListener("themeChanged", function () {
  getCSSColors();
});

// Game variables
let gameActive = false;
let vsMode = true; // Start with 2-player mode by default
let scores = [0, 0]; // Scores for Player 1 and Player 2
let gameTimer = null;
let correctAnswerIndex;
let answerSubmitted = false; // To track if an answer has been submitted for current question

let messageTimeout = null;

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
let winnerMessage = document.getElementById("winnerMessage");
let modeToggleBtn = document.getElementById("modeToggle");
let equationElement = document.getElementById("equation");
let answerButtons = [];
for (let i = 0; i < 4; i++) {
  answerButtons.push(document.getElementById("answer" + i));
}

// Initialize the game
function init() {
  getCSSColors();
  resetGame();
  updateScoreboard();
  displayControls();

  // Event listeners
  modeToggleBtn.addEventListener("click", () => {
    vsMode = !vsMode;
    modeToggleBtn.textContent = vsMode
      ? "Switch to 1-Player Mode"
      : "Switch to 2-Player Mode";
    resetGame();
  });

  // Handle key presses
  document.addEventListener("keydown", function (e) {
    if (!gameActive || answerSubmitted) return;
    let player = null;
    let answerIndex = null;

    switch (e.key) {
      // Player 1 keys
      case "w":
      case "W":
        player = 0;
        answerIndex = 0;
        break;
      case "a":
      case "A":
        player = 0;
        answerIndex = 1;
        break;
      case "s":
      case "S":
        player = 0;
        answerIndex = 2;
        break;
      case "d":
      case "D":
        player = 0;
        answerIndex = 3;
        break;
      // Player 2 keys
      case "ArrowUp":
        if (vsMode) {
          player = 1;
          answerIndex = 0;
        }
        break;
      case "ArrowLeft":
        if (vsMode) {
          player = 1;
          answerIndex = 1;
        }
        break;
      case "ArrowDown":
        if (vsMode) {
          player = 1;
          answerIndex = 2;
        }
        break;
      case "ArrowRight":
        if (vsMode) {
          player = 1;
          answerIndex = 3;
        }
        break;
    }

    if (player !== null && answerIndex !== null) {
      checkAnswer(player, answerIndex);
    }
  });
}

function resetGame() {
  // Reset variables
  gameActive = true;
  winnerMessage.textContent = "";
  messageElement.textContent = "";
  clearInterval(gameTimer);
  scores = [0, 0];
  correctAnswerIndex = null;
  answerSubmitted = false;
  updateScoreboard();
  displayControls();
  generateEquation();

  if (vsMode) {
    // 2-player mode, no timer
    statusInfo.textContent = `Game started!`;
  } else {
    // One-player mode
    statusInfo.textContent = `${players[0].name}'s turn!`;
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
      winnerMessage.textContent = `Time's up! Your score: ${scores[0]}`;
      messageElement.textContent = "";
      clearInterval(gameTimer);
    }
  }, 1000);
}

function updateTimers(timeLeft) {
  if (vsMode) {
    document.getElementById("player1Score").textContent =
      `${players[0].name}: ${scores[0]}`;
    document.getElementById("player2Score").textContent =
      `${players[1].name}: ${scores[1]}`;
  } else {
    document.getElementById("player1Score").textContent =
      `${players[0].name}: ${scores[0]} | Timer: ${timeLeft}s`;
    document.getElementById("player2Score").textContent = "";
  }
}

function updateScoreboard() {
  if (vsMode) {
    document.getElementById("player1Score").textContent =
      `${players[0].name}: ${scores[0]}`;
    document.getElementById("player2Score").textContent =
      `${players[1].name}: ${scores[1]}`;
  } else {
    // Timer will be updated separately
  }
}

function displayControls() {
  if (vsMode) {
    controlInfo.innerHTML = `
      <strong>Instructions:</strong><br>
      First player to answer gets +1 for correct, -1 for incorrect.<br>
      <strong>Player 1 keys:</strong><br>
      &nbsp;&nbsp;&nbsp;W<br>
      A&nbsp;&nbsp;S&nbsp;&nbsp;D<br>
      <strong>Player 2 keys:</strong><br>
      &nbsp;&nbsp;&nbsp;Arrow Up<br>
      Arrow Left&nbsp;&nbsp;Arrow Down&nbsp;&nbsp;Arrow Right<br>
    `;
  } else {
    controlInfo.innerHTML = `
      <strong>Instructions:</strong><br>
      Solve as many equations as you can before time runs out.<br>
      Use keys:<br>
      &nbsp;&nbsp;&nbsp;W<br>
      A&nbsp;&nbsp;S&nbsp;&nbsp;D<br>
    `;
  }
}

// Generate a new equation
function generateEquation() {
  answerSubmitted = false;
  // Randomly select 4 numbers
  let nums = [];
  for (let i = 0; i < 4; i++) {
    nums.push(
      numbers[Math.floor(Math.random() * numbers.length)],
    );
  }

  // Randomly select operations
  let ops = [];
  for (let i = 0; i < 3; i++) {
    ops.push(
      operations[
        Math.floor(Math.random() * operations.length)
      ],
    );
  }

  // Decide whether to include parentheses
  let includeParentheses = Math.random() > 0.5;

  let equationStr;
  if (includeParentheses) {
    let parenthesesPosition = Math.floor(Math.random() * 3);
    if (parenthesesPosition === 0) {
      equationStr = `(${nums[0]} ${ops[0]} ${nums[1]}) ${ops[1]} ${nums[2]} ${ops[2]} ${nums[3]}`;
    } else if (parenthesesPosition === 1) {
      equationStr = `${nums[0]} ${ops[0]} (${nums[1]} ${ops[1]} ${nums[2]}) ${ops[2]} ${nums[3]}`;
    } else {
      equationStr = `${nums[0]} ${ops[0]} ${nums[1]} ${ops[1]} (${nums[2]} ${ops[2]} ${nums[3]})`;
    }
  } else {
    equationStr = `${nums[0]} ${ops[0]} ${nums[1]} ${ops[1]} ${nums[2]} ${ops[2]} ${nums[3]}`;
  }

  // Calculate the correct answer
  let correctAnswer = null;
  try {
    correctAnswer = eval(equationStr);
    // Round to 3 decimal places
    correctAnswer = Math.round((correctAnswer + Number.EPSILON) * 1000) / 1000;

    // If answer is too small or invalid, reroll
    if (Math.abs(correctAnswer) < 0.002 || isNaN(correctAnswer) || !isFinite(correctAnswer)) {
      throw new Error();
    }
  } catch (e) {
    // If there's an error in evaluation, regenerate the equation
    return generateEquation();
  }

  // Generate incorrect answers
  let incorrectAnswers = new Set();

  while (incorrectAnswers.size < 3) {
    let offset = (Math.random() * 20 - 10); // Random number between -10 and 10
    let incorrectAnswer = correctAnswer + offset;

    // Round to 3 decimal places
    incorrectAnswer = Math.round((incorrectAnswer + Number.EPSILON) * 1000) / 1000;

    // Skip if too close to correct answer or too small
    if (Math.abs(incorrectAnswer - correctAnswer) < 0.001 || Math.abs(incorrectAnswer) < 0.002) {
      continue;
    }

    incorrectAnswers.add(incorrectAnswer);
  }

  let answers = [correctAnswer].concat(Array.from(incorrectAnswers));

  // Remove duplicates
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
    answerButtons[i].textContent = answers[i].toFixed(3);
  }
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
      messageElement.textContent = "";
    }, 2000);
    setTimeout(function () {
      generateEquation();
    }, 1000);
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

// Start the game
init();
