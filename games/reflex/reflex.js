// Get CSS variables for colors
let colors = {};

function getCSSColors() {
  const rootStyles = getComputedStyle(document.body);
  colors = {
    background: rootStyles.getPropertyValue("--color-background").trim(),
    text: rootStyles.getPropertyValue("--color-text").trim(),
    primary: rootStyles.getPropertyValue("--color-primary").trim(),
    secondary: rootStyles.getPropertyValue("--color-secondary").trim(),
    tertiary: rootStyles.getPropertyValue("--color-tertiary").trim(),
    quaternary: rootStyles.getPropertyValue("--color-quaternary").trim(),
    accent: rootStyles.getPropertyValue("--color-accent").trim(),
    muted: rootStyles.getPropertyValue("--color-muted").trim(),
  };
}

// Listen for theme changes
document.addEventListener("themeChanged", function () {
  getCSSColors();
  displayCurrentRules();
});

// Game variables
let gameActive = false;
let vsMode = false;
let scores = [0, 0]; // Scores for Player 1 and Player 2
let totalPointsAwarded = 0; // Total points awarded (correct answers)
let currentRuleMapping = {}; // Mapping of colors to rules
let arrowDirection;
let arrowColorKey;
let arrowColor;
let answerSubmitted = false; // To track if an answer has been submitted for current arrow
let countdown = 0;
let messageTimeout = null;
let gameTimer = null;
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

// Define possible directions and colors
const directions = ["up", "down", "left", "right"];
const colorKeys = ["primary", "secondary", "tertiary", "quaternary"];

// Define rules
const rulesArray = [
  {
    ruleText: "Same",
    check: function (arrowDir, inputDir) {
      return inputDir === arrowDir;
    },
  },
  {
    ruleText: "Opposite",
    check: function (arrowDir, inputDir) {
      const opposite = { up: "down", down: "up", left: "right", right: "left" };
      return inputDir === opposite[arrowDir];
    },
  },
  {
    ruleText: " Any ",
    check: function (arrowDir, inputDir) {
      return true;
    },
  },
  {
    ruleText: "{direction}",
    check: function (arrowDir, inputDir, ruleData) {
      return inputDir === ruleData.fixedDirection;
    },
    fixedDirection: null, // Will be set when the rule mapping is generated
  },
];

// Get HTML elements
let statusInfo = document.getElementById("statusInfo");
let controlInfo = document.getElementById("controlInfo");
let messageElement = document.getElementById("message");
let arrowElement = document.getElementById("arrowElement"); // New element to display the arrow
let rulesDisplay = document.getElementById("rulesDisplay"); // New element to display the rules
let layoutToggleBtn = document.getElementById("layoutToggle");
let answerButtons = [];
for (let i = 0; i < 4; i++) {
  answerButtons.push(document.getElementById("answer" + i));
}
// Add click event listeners to answer buttons
for (let i = 0; i < answerButtons.length; i++) {
  answerButtons[i].addEventListener("click", function () {
    if (!gameActive || answerSubmitted) return;

    // Map the button index to the corresponding direction
    let inputDirection = null;
    switch (i) {
      case 0:
        inputDirection = "up";
        break;
      case 1:
        inputDirection = "left";
        break;
      case 2:
        inputDirection = "down";
        break;
      case 3:
        inputDirection = "right";
        break;
    }

    // Optionally, highlight the selected button
    answerButtons[i].classList.add("selected");

    checkAnswer(0, inputDirection); // Player 1 (player index 0)
  });
}

// Initialize the game
function init() {
  getCSSColors();
  resetGame();
  updateScoreboard();
  displayControls();

  // Generate initial rule mapping
  generateRuleMapping();

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
    let inputDirection = null;

    if (vsMode) {
      // Two-player mode
      // Player 1 controls
      if (e.key === keyBindings.player1.up) {
        player = 0;
        inputDirection = "up";
      } else if (e.key === keyBindings.player1.left) {
        player = 0;
        inputDirection = "left";
      } else if (e.key === keyBindings.player1.down) {
        player = 0;
        inputDirection = "down";
      } else if (e.key === keyBindings.player1.right) {
        player = 0;
        inputDirection = "right";
      }
      // Player 2 controls
      else if (e.key === keyBindings.player2.up) {
        player = 1;
        inputDirection = "up";
      } else if (e.key === keyBindings.player2.left) {
        player = 1;
        inputDirection = "left";
      } else if (e.key === keyBindings.player2.down) {
        player = 1;
        inputDirection = "down";
      } else if (e.key === keyBindings.player2.right) {
        player = 1;
        inputDirection = "right";
      }
    } else {
      // One-player mode
      // Player 1 controls
      if (e.key === keyBindings.player1.up) {
        player = 0;
        inputDirection = "up";
      } else if (e.key === keyBindings.player1.left) {
        player = 0;
        inputDirection = "left";
      } else if (e.key === keyBindings.player1.down) {
        player = 0;
        inputDirection = "down";
      } else if (e.key === keyBindings.player1.right) {
        player = 0;
        inputDirection = "right";
      }
    }

    if (player !== null && inputDirection !== null) {
      checkAnswer(player, inputDirection);
    }
  });

  statusInfo.textContent = "Press R to Start the Game";
}

function resetGame() {
  // Reset variables
  if (vsMode) {
    updateScoreboard();
  } else {
    updateTimers(60);
  }
  gameActive = false;
  messageElement.innerHTML = "&nbsp;";
  clearInterval(gameTimer);
  scores = [0, 0];
  totalPointsAwarded = 0;
  currentRuleMapping = {};
  generateRuleMapping();
  answerSubmitted = false;
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
  generateArrow();
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
      Follow the current rules based on the arrow's color.<br>
      <strong>Player 1 Controls:</strong> ${keyBindings.player1.up.toUpperCase()}/${keyBindings.player1.left.toUpperCase()}/${keyBindings.player1.down.toUpperCase()}/${keyBindings.player1.right.toUpperCase()} to respond.<br>
      <strong>Player 2 Controls:</strong> Arrow keys to respond.<br>
    `;
  } else {
    controlInfo.innerHTML = `
      <strong>Instructions:</strong><br>
      Follow the current rules based on the arrow's color.<br>
      <strong>Controls:</strong> ${keyBindings.player1.up.toUpperCase()}/${keyBindings.player1.left.toUpperCase()}/${keyBindings.player1.down.toUpperCase()}/${keyBindings.player1.right.toUpperCase()} to respond.<br>
      <br>
    `;
  }
}

// Update controls display when keyboard layout changes
function updateControlsDisplay() {
  displayControls();
}

// Function to generate rule mapping
function generateRuleMapping() {
  // Shuffle colors and rules
  const shuffledColors = shuffleArray(colorKeys.slice());
  const shuffledRules = shuffleArray(rulesArray.slice());

  // Assign a random direction for the "Always answer {direction}" rule
  for (let rule of shuffledRules) {
    if (
      (rule.ruleText === "{direction}") |
      (rule.ruleText === "Up") |
      (rule.ruleText === "Left") |
      (rule.ruleText === "Down") |
      (rule.ruleText === "Right")
    ) {
      rule.fixedDirection =
        directions[Math.floor(Math.random() * directions.length)];
      rule.ruleText =
        rule.fixedDirection.charAt(0).toUpperCase() +
        rule.fixedDirection.slice(1);
    }
  }

  // Create mapping
  currentRuleMapping = {};
  for (let i = 0; i < 4; i++) {
    currentRuleMapping[shuffledColors[i]] = shuffledRules[i];
  }

  displayCurrentRules();
}

function generateArrow() {
  answerSubmitted = false;

  // Generate random direction and color
  arrowDirection = directions[Math.floor(Math.random() * directions.length)];
  arrowColorKey = colorKeys[Math.floor(Math.random() * colorKeys.length)];
  arrowColor = colors[arrowColorKey];

  displayArrow(arrowDirection, arrowColor);
}

function displayArrow(direction, color) {
  let arrowChar = "";
  switch (direction) {
    case "up":
      arrowChar = "↑";
      break;
    case "down":
      arrowChar = "↓";
      break;
    case "left":
      arrowChar = "←";
      break;
    case "right":
      arrowChar = "→";
      break;
  }
  arrowElement.innerHTML = arrowChar;
  arrowElement.style.color = color;
}

function displayCurrentRules() {
  let rulesText = "<br><strong>Current Rules:</strong><br>";
  for (let colorKey in currentRuleMapping) {
    let colorName = colorKey; // 'primary', 'secondary', etc.
    let colorValue = colors[colorKey]; // actual color code
    let ruleObj = currentRuleMapping[colorKey];
    rulesText += `<span style="color:${colorValue}">⬤</span> ${ruleObj.ruleText} <span style="color:${colorValue}">⬤</span><br>`;
  }
  rulesDisplay.innerHTML = rulesText;
}

function checkAnswer(player, inputDirection) {
  if (!gameActive || answerSubmitted) return;
  answerSubmitted = true;

  // Get the rule for the arrow's color
  let ruleObj = currentRuleMapping[arrowColorKey];

  // Check if the answer is correct
  let isCorrect = ruleObj.check(arrowDirection, inputDirection, ruleObj);

  if (isCorrect) {
    scores[player]++;
    totalPointsAwarded++;
    messageElement.textContent = `${players[player].name} is correct!`;
  } else {
    scores[player]--;
    messageElement.textContent = `${players[player].name} is incorrect!`;
  }
  updateScoreboard();

  // Check if we need to change the rules with 1-in-5 chance
  if (Math.random() < 0.2) {
    generateRuleMapping(); // Generate and display the new rules
  }

  if (gameActive) {
    clearTimeout(messageTimeout);
    messageTimeout = setTimeout(function () {
      messageElement.innerHTML = "&nbsp;";
    }, 2000);

    // Generate a new arrow immediately after the rule is updated
    generateArrow();
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
