// ── Difficulty config ─────────────────────────────────────────────────────────
const DIFFICULTIES = {
  easy:   { min: 1, max: 20,  startScore: 20, label: '(between 1 and 20)' },
  medium: { min: 1, max: 50,  startScore: 15, label: '(between 1 and 50)' },
  hard:   { min: 1, max: 100, startScore: 10, label: '(between 1 and 100)' },
};

// ── DOM elements ──────────────────────────────────────────────────────────────
const inputbox      = document.querySelector('.input-box');
const checkbtn      = document.querySelector('.check-btn');
const message       = document.querySelector('.message');
const scoreEl       = document.getElementById('score-val');
const highEl        = document.getElementById('high-val');
const againbtn      = document.querySelector('.again-btn');
const secretbox     = document.querySelector('.secret-box');
const hintbtn       = document.querySelector('.hint-btn');
const rangeLabel    = document.getElementById('range-label');
const diffBtns      = document.querySelectorAll('.diff-btn');
const streakEl      = document.getElementById('streak');
const totalGamesEl  = document.getElementById('total-games');
const totalWinsEl   = document.getElementById('total-wins');

// ── Persistent stats (localStorage) ──────────────────────────────────────────
const DEFAULT_STATS = { games: 0, wins: 0, streak: 0, highscores: { easy: 0, medium: 0, hard: 0 } };
let stats = JSON.parse(localStorage.getItem('gmnStats') || 'null') || DEFAULT_STATS;

function saveStats() {
  localStorage.setItem('gmnStats', JSON.stringify(stats));
}

function updateStatsUI() {
  streakEl.textContent     = stats.streak;
  totalGamesEl.textContent = stats.games;
  totalWinsEl.textContent  = stats.wins;
  highEl.textContent       = stats.highscores[currentDiff];
}

// ── Game state ────────────────────────────────────────────────────────────────
let currentDiff = 'easy';
let config      = DIFFICULTIES[currentDiff];
let score       = config.startScore;
let secretNum   = generateSecret();
let hintUsed    = false;
let gameOver    = false;

function generateSecret() {
  return Math.floor(Math.random() * (config.max - config.min + 1)) + config.min;
}

function setScore(val) {
  score = val;
  scoreEl.textContent = score;
}

// ── Difficulty buttons ────────────────────────────────────────────────────────
diffBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.dataset.diff === currentDiff) return;
    selectsound.pause();
    selectsound.currentTime = 0;
    selectsound.play();
    diffBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentDiff = btn.dataset.diff;
    config      = DIFFICULTIES[currentDiff];
    rangeLabel.textContent = config.label;
    resetGame();
  });
});

// ── Hint button ───────────────────────────────────────────────────────────────
hintbtn.addEventListener('click', () => {
  if (hintUsed || gameOver) return;
  if (score <= 3) {
    setMessage('Not enough score for a hint!');
    return;
  }
  hintUsed = true;
  setScore(score - 3);
  const parity = secretNum % 2 === 0 ? 'even' : 'odd';
  setMessage(`💡 Hint: the number is ${parity}!`);
  hintbtn.disabled = true;
  hintbtn.classList.add('used');
  selectsound.pause();
  selectsound.currentTime = 0;
  selectsound.play();
});

// ── Check button ──────────────────────────────────────────────────────────────
checkbtn.addEventListener('click', () => {
  const raw = inputbox.value.trim();
  const inputNum = Number(raw);

  if (raw === '' || isNaN(inputNum)) {
    setMessage('Please enter a number');
    return;
  }
  if (inputNum < config.min || inputNum > config.max) {
    setMessage(`Enter a number between ${config.min} & ${config.max}`);
    return;
  }

  if (inputNum > secretNum) {
    setMessage('📈 Too high...');
    playWrong();
    shakeInput();
    decrementScore();
  } else if (inputNum < secretNum) {
    setMessage('📉 Too low...');
    playWrong();
    shakeInput();
    decrementScore();
  } else {
    handleWin();
  }
});

// ── Again button ──────────────────────────────────────────────────────────────
againbtn.addEventListener('click', resetGame);

// ── Enter key ─────────────────────────────────────────────────────────────────
inputbox.addEventListener('keydown', e => {
  if (e.key === 'Enter') checkbtn.click();
});

// ── Game logic helpers ────────────────────────────────────────────────────────
function setMessage(text) {
  message.textContent = text;
}

function shakeInput() {
  inputbox.classList.remove('correct', 'wrong');
  void inputbox.offsetWidth; // force reflow to restart animation
  inputbox.classList.add('wrong');
}

function decrementScore() {
  if (score > 0) setScore(score - 1);
  if (score === 0) handleGameOver();
}

function handleWin() {
  gameOver = true;
  secretbox.textContent = secretNum;
  secretbox.classList.add('pop');
  setTimeout(() => secretbox.classList.remove('pop'), 600);

  setMessage('🥳 Correct! You got it!');
  message.style.fontSize   = '13px';
  message.style.backgroundColor = 'rgba(0,0,0,0.34)';

  winaudio.play();
  checkbtn.disabled = true;
  inputbox.disabled = true;

  document.body.style.backgroundColor                   = '#60b346';
  document.querySelector('.header').style.backgroundColor = 'rgba(0,0,0,0.553)';
  againbtn.style.backgroundColor                        = 'rgba(0,0,0,0.55)';

  inputbox.classList.remove('wrong');
  inputbox.classList.add('correct');

  // Stats
  stats.games++;
  stats.wins++;
  stats.streak++;
  if (score > stats.highscores[currentDiff]) {
    stats.highscores[currentDiff] = score;
    showHighScoreBanner();
  }
  saveStats();
  updateStatsUI();

  launchConfetti();
}

function handleGameOver() {
  gameOver = true;
  checkbtn.disabled = true;
  inputbox.disabled = true;

  secretbox.textContent = secretNum;
  secretbox.classList.add('reveal');

  setMessage(`⛔ Game Over! It was ${secretNum}`);
  againbtn.style.backgroundColor = '#da0a0a';
  loseaudio.play();

  stats.games++;
  stats.streak = 0;
  saveStats();
  updateStatsUI();
}

function resetGame() {
  gameOver  = false;
  hintUsed  = false;
  config    = DIFFICULTIES[currentDiff];
  secretNum = generateSecret();

  setScore(config.startScore);
  inputbox.value = '';
  inputbox.disabled = false;
  inputbox.classList.remove('wrong', 'correct');

  checkbtn.disabled = false;
  secretbox.textContent = '?';
  secretbox.classList.remove('reveal');

  setMessage('Start guessing...🤔');
  message.style.fontSize        = '';
  message.style.backgroundColor = '';

  document.body.style.backgroundColor                   = '';
  document.querySelector('.header').style.backgroundColor = '';
  againbtn.style.backgroundColor                        = '';

  hintbtn.disabled = false;
  hintbtn.classList.remove('used');

  updateStatsUI();
}

// ── High score banner ─────────────────────────────────────────────────────────
function showHighScoreBanner() {
  const existing = document.querySelector('.new-highscore-banner');
  if (existing) existing.remove();

  const banner = document.createElement('div');
  banner.className    = 'new-highscore-banner';
  banner.textContent  = '🏆 New High Score!';
  document.body.appendChild(banner);
  setTimeout(() => banner.remove(), 2800);
}

// ── Confetti ──────────────────────────────────────────────────────────────────
function launchConfetti() {
  const container = document.getElementById('confetti-container');
  container.innerHTML = '';
  const colors = ['#60b346', '#f7c948', '#e94f4f', '#4f9ce9', '#c94fe9', '#ffffff'];

  for (let i = 0; i < 90; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left             = Math.random() * 100 + 'vw';
    piece.style.animationDelay   = (Math.random() * 1.8).toFixed(2) + 's';
    piece.style.animationDuration = (Math.random() * 1.5 + 1.5).toFixed(2) + 's';
    piece.style.backgroundColor  = colors[Math.floor(Math.random() * colors.length)];
    const size = (Math.random() * 8 + 5).toFixed(1) + 'px';
    piece.style.width  = size;
    piece.style.height = size;
    piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    container.appendChild(piece);
  }

  setTimeout(() => { container.innerHTML = ''; }, 4000);
}

// ── Audio ─────────────────────────────────────────────────────────────────────
const loseaudio   = new Audio('musics/gamebeep.mp3');
const winaudio    = new Audio('musics/wow-trim.mp3');
const wrongchoice = new Audio('musics/wrong-choice-trim.mp3');
const selectsound = new Audio('musics/selectsound.mp3');

function playWrong() {
  wrongchoice.pause();
  wrongchoice.currentTime = 0;
  wrongchoice.play();
}

// ── Init ──────────────────────────────────────────────────────────────────────
updateStatsUI();
scoreEl.textContent = score;
