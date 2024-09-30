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
let letters = [];
let gameActive = false;
let countdown = 0;
let wordDictionary = null;
let usedWords = new Set();
let vsMode = false; // Start with 2-player mode by default
let scores = [0, 0]; // Scores for Player 1 and Player 2
let currentPlayer = 0;
let playerTimers = [45, 45];
let countdownInterval = null;
let gameTimer = null;

// Players
let players = [
  {
    name: "Player 1",
  },
  {
    name: "Player 2",
  },
];

// Get HTML elements
let statusInfo = document.getElementById("statusInfo");
let controlInfo = document.getElementById("controlInfo");
let messageElement = document.getElementById("message");
let lettersElement = document.getElementById("letters");
let inputContainer = document.getElementById("inputContainer");
let wordInput = document.getElementById("wordInput");
let submitBtn = document.getElementById("submitBtn");

// Initialize the game after loading the word dictionary
fetch("words.txt")
  .then((response) => response.text())
  .then((text) => {
    // Process the text into a Set of words
    let wordArray = text.split("\n").map((word) => word.trim().toLowerCase());
    // Remove empty strings
    wordArray = wordArray.filter((word) => word.length > 0);
    wordDictionary = new Set(wordArray);
    init(); // Start the game
  })
  .catch((error) => {
    console.error("Error loading word dictionary:", error);
    alert(
      'Failed to load word dictionary. Please ensure "words.txt" is present.',
    );
  });

function init() {
  getCSSColors();
  resetGame();
  updateScoreboard();
  displayControls();
  // Event listeners
  submitBtn.addEventListener("click", submitWord);
  wordInput.addEventListener("keyup", function (event) {
    if (event.key === "Enter") {
      submitWord();
    }
  });

  // Listen for key presses to start/restart the game
  document.addEventListener("keydown", function (e) {
    // Restart game
    if (!gameActive && (e.key === "r" || e.key === "R")) {
      resetGame();
      startCountdown();
      return;
    }
  });

  statusInfo.textContent = "Press R to Start the Game";
}

function resetGame() {
  // Reset variables
  letters = [];
  gameActive = false;
  usedWords = new Set();
  playerTimers = vsMode ? [45, 45] : [60];
  scores = [0, 0];
  currentPlayer = 0;
  winnerMessage.innerHTML = "&nbsp;";
  wordInput.value = "";
  inputContainer.style.display = "none";
  messageElement.innerHTML = "&nbsp;";
  clearInterval(countdownInterval);
  clearInterval(gameTimer);
  statusInfo.textContent = "Press R to Start the Game";
  displayControls();
  updateScoreboard();
}

function startCountdown() {
  countdown = 15;
  gameActive = false;
  generateLetters();
  displayLetters();
  statusInfo.textContent = `Game starts in ${countdown} seconds.`;

  countdownInterval = setInterval(function () {
    countdown--;
    if (countdown > 0) {
      statusInfo.textContent = `Game starts in ${countdown} seconds.`;
    } else {
      clearInterval(countdownInterval);
      statusInfo.textContent = "Game started!";
      winnerMessage.textContent = "";
      startGame();
    }
  }, 1000);
}

function generateLetters() {
  const vowelsBin = {
    A: 9,
    E: 12,
    I: 9,
    O: 8,
    U: 4,
  };
  const consonantsBin = {
    B: 2,
    C: 2,
    D: 4,
    F: 2,
    G: 3,
    H: 2,
    J: 1,
    K: 1,
    L: 4,
    M: 2,
    N: 6,
    P: 2,
    Q: 1,
    R: 6,
    S: 4,
    T: 6,
    V: 1,
    W: 1,
    X: 1,
    Y: 1,
    Z: 1,
  };

  let vowelsList = [];
  let consonantsList = [];

  for (let letter in vowelsBin) {
    for (let i = 0; i < vowelsBin[letter]; i++) {
      vowelsList.push(letter);
    }
  }

  for (let letter in consonantsBin) {
    for (let i = 0; i < consonantsBin[letter]; i++) {
      consonantsList.push(letter);
    }
  }

  // Decide on number of vowels (3 to 5)
  let numVowels = Math.floor(Math.random() * 3) + 3; // 3, 4, or 5
  let numConsonants = 9 - numVowels;

  // Shuffle the bins
  shuffleArray(vowelsList);
  shuffleArray(consonantsList);

  // Pick letters without replacement
  let selectedLetters = [];
  selectedLetters.push(...vowelsList.splice(0, numVowels));
  selectedLetters.push(...consonantsList.splice(0, numConsonants));

  // Shuffle selected letters
  shuffleArray(selectedLetters);

  letters = selectedLetters;
}

function displayLetters() {
  lettersElement.textContent = letters.join(" ");
}

function startGame() {
  gameActive = true;
  inputContainer.style.display = "block";
  if (vsMode) {
    // Randomly select starting player
    currentPlayer = Math.floor(Math.random() * 2);
    statusInfo.textContent = `${players[currentPlayer].name}'s turn!`;
    startPlayerTimer();
  } else {
    // One-player mode
    statusInfo.textContent = `${players[0].name}'s turn!`;
    startGameTimer();
  }
}

function startPlayerTimer() {
  updateTimers();
  gameTimer = setInterval(() => {
    if (!gameActive) {
      clearInterval(gameTimer);
      return;
    }

    playerTimers[currentPlayer] -= 1;
    updateTimers();

    if (playerTimers[currentPlayer] <= 0) {
      gameActive = false;
      winnerMessage.textContent = `${players[currentPlayer === 0 ? 1 : 0].name} Wins!`;
      inputContainer.style.display = "none";
      clearInterval(gameTimer);
      statusInfo.textContent = "Press R to Restart the Game";
    }
  }, 1000);
}

function updateTimers() {
  if (vsMode) {
    document.getElementById("player1Score").textContent =
      `${players[0].name}: ${scores[0]} | Timer: ${playerTimers[0]}s`;
    document.getElementById("player2Score").textContent =
      `${players[1].name}: ${scores[1]} | Timer: ${playerTimers[1]}s`;
  } else {
    document.getElementById("player1Score").textContent =
      `${players[0].name}: ${scores[0]} | Timer: ${playerTimers[0]}s`;
    document.getElementById("player2Score").textContent = "";
  }
}

function startGameTimer() {
  updateTimers();
  gameTimer = setInterval(() => {
    if (!gameActive) {
      clearInterval(gameTimer);
      return;
    }

    playerTimers[0] -= 1;
    updateTimers();

    if (playerTimers[0] <= 0) {
      gameActive = false;
      winnerMessage.textContent = `Time's up! Your score: ${scores[0]}`;
      inputContainer.style.display = "none";
      clearInterval(gameTimer);
      statusInfo.textContent = "Press R to Restart the Game";
    }
  }, 1000);
}

function submitWord() {
  if (!gameActive) return;

  let word = wordInput.value.toUpperCase().trim();
  wordInput.value = "";

  if (usedWords.has(word)) {
    messageElement.textContent = "This word has already been used!";
    return;
  }

  if (isValidWord(word)) {
    // Word is valid
    usedWords.add(word);
    messageElement.textContent = `${players[currentPlayer].name} submitted a valid word!`;
    scores[currentPlayer]++;
    updateScoreboard();
    if (vsMode) {
      // Switch to other player
      currentPlayer = currentPlayer === 0 ? 1 : 0;
      statusInfo.textContent = `${players[currentPlayer].name}'s turn!`;
    }
  } else {
    // Invalid word, apply 6-second penalty
    messageElement.textContent = `Invalid word! 6-second penalty.`;
    if (vsMode) {
      playerTimers[currentPlayer] -= 6;
      updateTimers();
      if (playerTimers[currentPlayer] <= 0) {
        gameActive = false;
        winnerMessage.textContent = `${players[currentPlayer === 0 ? 1 : 0].name} Wins!`;
        inputContainer.style.display = "none";
        clearInterval(gameTimer);
        statusInfo.textContent = "Press R to Restart the Game";
      }
    } else {
      playerTimers[0] -= 6;
      updateTimers();
      if (playerTimers[0] <= 0) {
        gameActive = false;
        winnerMessage.textContent = `Time's up! Your score: ${scores[0]}`;
        inputContainer.style.display = "none";
        clearInterval(gameTimer);
        statusInfo.textContent = "Press R to Restart the Game";
      }
    }
  }
}

function isValidWord(word) {
  if (word.length < 4) return false;
  if (!wordDictionary.has(word.toLowerCase())) return false;

  // Check if word can be formed from the letters
  let tempLetters = letters.slice();
  for (let char of word) {
    let index = tempLetters.indexOf(char);
    if (index === -1) {
      return false;
    } else {
      tempLetters.splice(index, 1);
    }
  }
  return true;
}

function updateScoreboard() {
  if (vsMode) {
    document.getElementById("player1Score").textContent =
      `${players[0].name}: ${scores[0]} | Timer: ${playerTimers[0]}s`;
    document.getElementById("player2Score").textContent =
      `${players[1].name}: ${scores[1]} | Timer: ${playerTimers[1]}s`;
  } else {
    document.getElementById("player1Score").textContent =
      `${players[0].name}: ${scores[0]} | Timer: ${playerTimers[0]}s`;
    document.getElementById("player2Score").textContent = "";
  }
}

function displayControls() {
  if (vsMode) {
    controlInfo.innerHTML = `
      <strong>Instructions:</strong><br>
      Players take turns to submit english 4-letter words or more. The first player who runs out of time loses.<br>
      <strong>Penalty:</strong> Invalid words cost 6 seconds.<br>
    `;
  } else {
    controlInfo.innerHTML = `
      <strong>Instructions:</strong><br>
      Enter as many valid words as you can before time runs out.<br>
      <strong>Penalty:</strong> Invalid words cost 6 seconds.<br>
    `;
  }
}

// Shuffle an array
function shuffleArray(array) {
  let currentIndex = array.length,
    temporaryValue,
    randomIndex;
  while (0 !== currentIndex) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
  return array;
}
