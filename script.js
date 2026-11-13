
const board = document.getElementById("board");
const levelText = document.getElementById("level");
const mistakesText = document.getElementById("mistakes");
const timerText = document.getElementById("timer");
const levelTitle = document.getElementById("levelTitle");
const levelDescription = document.getElementById("levelDescription");
const progressFill = document.getElementById("progressFill");
const numberPad = document.getElementById("numberPad");
const nextBtn = document.getElementById("nextBtn");

const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const modalText = document.getElementById("modalText");
const modalBtn = document.getElementById("modalBtn");

const SIZE = 4;
const TOTAL_LEVELS = 20;

let currentLevel = 1;
let solution = [];
let puzzle = [];
let values = [];
let selectedCell = null;
let mistakes = 0;
let seconds = 0;
let completed = false;
let timerInterval = null;
let hintedCells = new Set();

// Tasodifiy aralashtirish
function shuffle(array) {
  const result = [...array];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

// 4x4 Sudoku uchun to‘g‘ri yechim yaratish
function generateSolution() {
  const base = [
    [1, 2, 3, 4],
    [3, 4, 1, 2],
    [2, 1, 4, 3],
    [4, 3, 2, 1]
  ];

  // Raqamlarni almashtirish
  const digits = shuffle([1, 2, 3, 4]);

  // Qatorlar guruhini va qatorlarni almashtirish
  const rowBands = shuffle([0, 1]);
  const rows = [];

  rowBands.forEach(band => {
    shuffle([0, 1]).forEach(row => {
      rows.push(band * 2 + row);
    });
  });

  // Ustunlar guruhini va ustunlarni almashtirish
  const colBands = shuffle([0, 1]);
  const cols = [];

  colBands.forEach(band => {
    shuffle([0, 1]).forEach(col => {
      cols.push(band * 2 + col);
    });
  });

  return rows.map(r =>
    cols.map(c => digits[base[r][c] - 1])
  );
}

// Qator, ustun va 2x2 kvadratni tekshirish
function canPlace(grid, row, col, num) {
  for (let i = 0; i < SIZE; i++) {
    if (grid[row][i] === num) return false;
    if (grid[i][col] === num) return false;
  }

  const boxRow = Math.floor(row / 2) * 2;
  const boxCol = Math.floor(col / 2) * 2;

  for (let r = boxRow; r < boxRow + 2; r++) {
    for (let c = boxCol; c < boxCol + 2; c++) {
      if (grid[r][c] === num) return false;
    }
  }

  return true;
}

// Berilgan Sudoku nechta yechimga ega ekanini sanash
function countSolutions(grid, limit = 2) {
  let bestCell = null;
  let bestCandidates = null;

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c] !== 0) continue;

      const candidates = [];

      for (let n = 1; n <= 4; n++) {
        if (canPlace(grid, r, c, n)) {
          candidates.push(n);
        }
      }

      if (candidates.length === 0) return 0;

      if (
        bestCandidates === null ||
        candidates.length < bestCandidates.length
      ) {
        bestCell = [r, c];
        bestCandidates = candidates;
      }
    }
  }

  // Bo‘sh katak qolmadi
  if (bestCell === null) return 1;

  let total = 0;
  const [row, col] = bestCell;

  for (const num of bestCandidates) {
    grid[row][col] = num;

    total += countSolutions(grid, limit - total);

    grid[row][col] = 0;

    if (total >= limit) return total;
  }

  return total;
}

// Yagona yechimga ega boshqotirma yaratish
function generatePuzzle(level) {
  const solved = generateSolution();
  const grid = solved.map(row => [...row]);

  // Bosqichlar oshgani sari bo‘sh kataklar ko‘payadi
  const targetBlanks = Math.min(
    4 + Math.floor((level - 1) * 0.35),
    10
  );

  const positions = shuffle(
    Array.from({ length: 16 }, (_, i) => i)
  );

  let removed = 0;

  for (const position of positions) {
    if (removed >= targetBlanks) break;

    const row = Math.floor(position / SIZE);
    const col = position % SIZE;

    const oldValue = grid[row][col];
    grid[row][col] = 0;

    const testGrid = grid.map(r => [...r]);

    if (countSolutions(testGrid) === 1) {
      removed++;
    } else {
      grid[row][col] = oldValue;
    }
  }

  return {
    solution: solved,
    puzzle: grid
  };
}

// Vaqt
function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const secondsLeft = totalSeconds % 60;

  return (
    String(minutes).padStart(2, "0") +
    ":" +
    String(secondsLeft).padStart(2, "0")
  );
}

function startTimer() {
  clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    if (completed) return;

    seconds++;
    timerText.textContent = formatTime(seconds);
  }, 1000);
}

// Yangi bosqich
function createLevel() {
  clearInterval(timerInterval);

  const generated = generatePuzzle(currentLevel);

  solution = generated.solution;
  puzzle = generated.puzzle;
  values = puzzle.map(row => [...row]);

  selectedCell = null;
  mistakes = 0;
  seconds = 0;
  completed = false;
  hintedCells = new Set();

  mistakesText.textContent = "0";
  timerText.textContent = "00:00";

  levelText.textContent = `${currentLevel} / ${TOTAL_LEVELS}`;
  levelTitle.textContent = `${currentLevel}-bosqich`;

  if (currentLevel <= 5) {
    levelDescription.textContent =
      "Boshlanishi! Bo‘sh kataklarni to‘ldiring.";
  } else if (currentLevel <= 10) {
    levelDescription.textContent =
      "Diqqat bilan o‘ylang. Raqamlarni takrorlamang!";
  } else if (currentLevel <= 15) {
    levelDescription.textContent =
      "Endi biroz ko‘proq fikrlash kerak!";
  } else {
    levelDescription.textContent =
      "Yakuniy bosqichlar! Omad!";
  }

  progressFill.style.width =
    `${(currentLevel / TOTAL_LEVELS) * 100}%`;

  nextBtn.disabled = true;

  modal.classList.add("hidden");

  renderBoard();
  startTimer();
}

// Kataklarni chizish
function renderBoard() {
  board.innerHTML = "";

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const cell = document.createElement("div");
      const value = values[r][c];

      cell.className = "cell";
      cell.dataset.row = r;
      cell.dataset.col = c;

      if (puzzle[r][c] !== 0) {
        cell.classList.add("given");
      }

      if (
        selectedCell &&
        selectedCell.row === r &&
        selectedCell.col === c
      ) {
        cell.classList.add("selected");
      }

      if (selectedCell) {
        const sameRow = selectedCell.row === r;
        const sameCol = selectedCell.col === c;

        const sameBox =
          Math.floor(selectedCell.row / 2) === Math.floor(r / 2) &&
          Math.floor(selectedCell.col / 2) === Math.floor(c / 2);

        if (sameRow || sameCol || sameBox) {
          cell.classList.add("related");
        }

        if (
          value !== 0 &&
          value === values[selectedCell.row][selectedCell.col]
        ) {
          cell.classList.add("same-number");
        }
      }

      if (hintedCells.has(`${r}-${c}`)) {
        cell.classList.add("correct");
      }

      cell.textContent = value === 0 ? "" : value;

      cell.addEventListener("click", () => {
        if (completed) return;
        if (puzzle[r][c] !== 0) return;

        selectedCell = { row: r, col: c };
        renderBoard();
      });

      board.appendChild(cell);
    }
  }
}

// Tanlangan katakka raqam kiritish
function enterNumber(number) {
  if (!selectedCell || completed) return;

  const { row, col } = selectedCell;

  // Dastlab berilgan kataklarni o‘zgartirib bo‘lmaydi
  if (puzzle[row][col] !== 0) return;

  values[row][col] = number;

  renderBoard();
  checkFinished();
}

// Raqam tugmalari
numberPad.addEventListener("click", event => {
  const button = event.target.closest("[data-number]");

  if (!button) return;

  enterNumber(Number(button.dataset.number));
});

// Klaviatura orqali ham raqam kiritish
document.addEventListener("keydown", event => {
  if (event.key >= "1" && event.key <= "4") {
    enterNumber(Number(event.key));
  }

  if (event.key === "Backspace" || event.key === "Delete") {
    eraseCell();
  }
});

// Katakni o‘chirish
function eraseCell() {
  if (!selectedCell || completed) return;

  const { row, col } = selectedCell;

  if (puzzle[row][col] !== 0) return;

  values[row][col] = 0;
  hintedCells.delete(`${row}-${col}`);

  renderBoard();
}

document.getElementById("eraseBtn")
  .addEventListener("click", eraseCell);

// Qator, ustun va kvadratdagi xatolarni topish
function getWrongCells() {
  const wrong = new Set();

  // Qatorlar
  for (let r = 0; r < SIZE; r++) {
    for (let c1 = 0; c1 < SIZE; c1++) {
      if (values[r][c1] === 0) continue;

      for (let c2 = c1 + 1; c2 < SIZE; c2++) {
        if (values[r][c1] === values[r][c2]) {
          wrong.add(`${r}-${c1}`);
          wrong.add(`${r}-${c2}`);
        }
      }
    }
  }

  // Ustunlar
  for (let c = 0; c < SIZE; c++) {
    for (let r1 = 0; r1 < SIZE; r1++) {
      if (values[r1][c] === 0) continue;

      for (let r2 = r1 + 1; r2 < SIZE; r2++) {
        if (values[r1][c] === values[r2][c]) {
          wrong.add(`${r1}-${c}`);
          wrong.add(`${r2}-${c}`);
        }
      }
    }
  }

  // 2x2 kvadratlar
  for (let boxR = 0; boxR < SIZE; boxR += 2) {
    for (let boxC = 0; boxC < SIZE; boxC += 2) {
      const seen = {};

      for (let r = boxR; r < boxR + 2; r++) {
        for (let c = boxC; c < boxC + 2; c++) {
          const value = values[r][c];

          if (value === 0) continue;

          if (seen[value]) {
            wrong.add(`${r}-${c}`);
            wrong.add(seen[value]);
          } else {
            seen[value] = `${r}-${c}`;
          }
        }
      }
    }
  }

  // Berilgan yechim bilan solishtirish
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (
        values[r][c] !== 0 &&
        values[r][c] !== solution[r][c]
      ) {
        wrong.add(`${r}-${c}`);
      }
    }
  }

  return wrong;
}

// Tekshirish
function checkBoard() {
  if (completed) return;

  const wrong = getWrongCells();

  const cells = board.querySelectorAll(".cell");
  cells.forEach(cell => cell.classList.remove("wrong"));

  if (wrong.size > 0) {
    mistakes++;
    mistakesText.textContent = mistakes;

    wrong.forEach(key => {
      const [r, c] = key.split("-").map(Number);
      const cell = board.querySelector(
        `[data-row="${r}"][data-col="${c}"]`
      );

      if (cell) cell.classList.add("wrong");
    });

    levelDescription.textContent =
      "Ba'zi raqamlar noto‘g‘ri. Yana bir bor tekshiring!";

    return;
  }

  const empty = values.some(row => row.includes(0));

  if (empty) {
    levelDescription.textContent =
      "Hozircha xato yo‘q. Qolgan kataklarni ham to‘ldiring!";
    return;
  }

  finishLevel();
}

document.getElementById("checkBtn")
  .addEventListener("click", checkBoard);

// Barcha kataklar to‘ldirilganini tekshirish
function checkFinished() {
  const empty = values.some(row => row.includes(0));

  if (empty) return;

  const wrong = getWrongCells();

  if (wrong.size === 0) {
    finishLevel();
  }
}

// Bosqich tugadi
function finishLevel() {
  if (completed) return;

  completed = true;
  clearInterval(timerInterval);

  nextBtn.disabled = false;

  showModal();
}

function showModal() {
  modal.classList.remove("hidden");

  if (currentLevel === TOTAL_LEVELS) {
    modalTitle.textContent = "Ajoyib! 🏆";
    modalText.textContent =
      "Siz barcha 20 ta Sudoku bosqichini tugatdingiz!";
    modalBtn.textContent = "Qayta o‘ynash";
  } else {
    modalTitle.textContent = "Barakalla!";
    modalText.textContent =
      `${currentLevel}-bosqich bajarildi! Keyingi bosqichga tayyormisiz?`;
    modalBtn.textContent = "Keyingi bosqich";
  }
}

// Yordam: bitta bo‘sh katakni to‘g‘ri to‘ldirish
function giveHint() {
  if (completed) return;

  const emptyCells = [];

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (
        puzzle[r][c] === 0 &&
        values[r][c] !== solution[r][c]
      ) {
        emptyCells.push({ row: r, col: c });
      }
    }
  }

  if (emptyCells.length === 0) return;

  const cell = emptyCells[
    Math.floor(Math.random() * emptyCells.length)
  ];

  values[cell.row][cell.col] =
    solution[cell.row][cell.col];

  hintedCells.add(`${cell.row}-${cell.col}`);

  selectedCell = cell;

  renderBoard();
  checkFinished();
}

document.getElementById("hintBtn")
  .addEventListener("click", giveHint);

// Keyingi bosqich
function nextLevel() {
  if (!completed) return;

  if (currentLevel < TOTAL_LEVELS) {
    currentLevel++;
  } else {
    currentLevel = 1;
  }

  createLevel();
}

nextBtn.addEventListener("click", nextLevel);
modalBtn.addEventListener("click", nextLevel);

// Boshlash
createLevel();
