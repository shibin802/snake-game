const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const bestScoreEl = document.getElementById('best-score');
const speedEl = document.getElementById('speed');
const statusEl = document.getElementById('status');
const overlayEl = document.getElementById('overlay');
const overlayTitleEl = document.getElementById('overlay-title');
const overlayTextEl = document.getElementById('overlay-text');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const restartBtn = document.getElementById('restart-btn');

const gridSize = 20;
const tileCount = canvas.width / gridSize;
const baseSpeed = 140;
const minSpeed = 65;
const bestScoreKey = 'snake-best-score-v1';

const directions = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 }
};

let snake;
let food;
let direction;
let nextDirection;
let score;
let bestScore = Number(localStorage.getItem(bestScoreKey) || 0);
let gameLoop = null;
let started = false;
let paused = false;
let gameOver = false;

bestScoreEl.textContent = bestScore;

function resetGame() {
  snake = [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 }
  ];
  direction = directions.right;
  nextDirection = directions.right;
  score = 0;
  started = false;
  paused = false;
  gameOver = false;
  food = generateFood();
  updateHud();
  showOverlay('准备开吃', '电脑用方向键 / WASD，手机用下方按钮控制。');
  setStatus('按方向键开始');
  clearLoop();
  draw();
}

function clearLoop() {
  if (gameLoop) {
    clearInterval(gameLoop);
    gameLoop = null;
  }
}

function startGame() {
  if (gameOver) {
    resetGame();
  }
  started = true;
  paused = false;
  hideOverlay();
  setStatus('进行中');
  runLoop();
}

function runLoop() {
  clearLoop();
  gameLoop = setInterval(tick, getSpeedDelay());
}

function getSpeedDelay() {
  return Math.max(minSpeed, baseSpeed - Math.floor(score / 5) * 8);
}

function updateHud() {
  scoreEl.textContent = score;
  bestScoreEl.textContent = bestScore;
  const speedLevel = (baseSpeed / getSpeedDelay()).toFixed(1).replace('.0', '');
  speedEl.textContent = `${speedLevel}x`;
}

function setStatus(text) {
  statusEl.textContent = text;
}

function showOverlay(title, text, buttonText = '开始游戏') {
  overlayTitleEl.textContent = title;
  overlayTextEl.textContent = text;
  startBtn.textContent = buttonText;
  overlayEl.classList.add('visible');
}

function hideOverlay() {
  overlayEl.classList.remove('visible');
}

function generateFood() {
  while (true) {
    const candidate = {
      x: Math.floor(Math.random() * tileCount),
      y: Math.floor(Math.random() * tileCount)
    };
    const hitSnake = snake?.some(segment => segment.x === candidate.x && segment.y === candidate.y);
    if (!hitSnake) return candidate;
  }
}

function tick() {
  if (paused || !started) return;

  direction = nextDirection;
  const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

  if (isCollision(head)) {
    endGame();
    return;
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score += 1;
    if (score > bestScore) {
      bestScore = score;
      localStorage.setItem(bestScoreKey, String(bestScore));
    }
    food = generateFood();
    updateHud();
    runLoop();
  } else {
    snake.pop();
  }

  draw();
}

function isCollision(head) {
  const hitWall = head.x < 0 || head.y < 0 || head.x >= tileCount || head.y >= tileCount;
  const hitSelf = snake.some(segment => segment.x === head.x && segment.y === head.y);
  return hitWall || hitSelf;
}

function endGame() {
  gameOver = true;
  started = false;
  clearLoop();
  updateHud();
  setStatus('游戏结束');
  showOverlay('游戏结束', `本局得分 ${score}，最高分 ${bestScore}。再来一局？`, '重新开始');
}

function togglePause() {
  if (!started || gameOver) return;
  paused = !paused;
  if (paused) {
    setStatus('已暂停');
    showOverlay('已暂停', '休息一下也行，点继续就能接着冲分。', '继续游戏');
  } else {
    hideOverlay();
    setStatus('进行中');
  }
}

function queueDirection(newDirection) {
  const invalidReverse =
    newDirection.x === -direction.x &&
    newDirection.y === -direction.y;

  if (invalidReverse) return;

  nextDirection = newDirection;

  if (!started && !gameOver) {
    startGame();
  }
}

function drawGrid() {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= tileCount; i += 1) {
    const pos = i * gridSize;
    ctx.beginPath();
    ctx.moveTo(pos, 0);
    ctx.lineTo(pos, canvas.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, pos);
    ctx.lineTo(canvas.width, pos);
    ctx.stroke();
  }
  ctx.restore();
}

function roundRect(x, y, w, h, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawSnake() {
  snake.forEach((segment, index) => {
    const x = segment.x * gridSize + 2;
    const y = segment.y * gridSize + 2;
    const size = gridSize - 4;

    const gradient = ctx.createLinearGradient(x, y, x + size, y + size);
    gradient.addColorStop(0, index === 0 ? '#6ee7b7' : '#34d399');
    gradient.addColorStop(1, index === 0 ? '#22c55e' : '#10b981');

    ctx.fillStyle = gradient;
    roundRect(x, y, size, size, 6);
    ctx.fill();

    if (index === 0) {
      ctx.fillStyle = '#052814';
      ctx.beginPath();
      ctx.arc(x + size * 0.33, y + size * 0.34, 2.4, 0, Math.PI * 2);
      ctx.arc(x + size * 0.67, y + size * 0.34, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function drawFood() {
  const x = food.x * gridSize + gridSize / 2;
  const y = food.y * gridSize + gridSize / 2;

  const glow = ctx.createRadialGradient(x, y, 2, x, y, 12);
  glow.addColorStop(0, 'rgba(251, 113, 133, 0.95)');
  glow.addColorStop(1, 'rgba(251, 113, 133, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, 12, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#fb7185';
  ctx.beginPath();
  ctx.arc(x, y, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#86efac';
  ctx.fillRect(x - 1.5, y - 11, 3, 6);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const bg = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  bg.addColorStop(0, '#07101b');
  bg.addColorStop(1, '#0b1627');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawGrid();
  drawFood();
  drawSnake();
}

window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  const controlKeys = ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'w', 'a', 's', 'd'];

  if (controlKeys.includes(key)) {
    event.preventDefault();
  }

  if (key === 'arrowup' || key === 'w') queueDirection(directions.up);
  else if (key === 'arrowdown' || key === 's') queueDirection(directions.down);
  else if (key === 'arrowleft' || key === 'a') queueDirection(directions.left);
  else if (key === 'arrowright' || key === 'd') queueDirection(directions.right);
  else if (key === ' ') {
    if (!started && !gameOver) startGame();
    else togglePause();
  }
});

document.querySelectorAll('.control-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    queueDirection(directions[btn.dataset.dir]);
  });
});

startBtn.addEventListener('click', () => {
  if (paused) {
    togglePause();
  } else {
    startGame();
  }
});

pauseBtn.addEventListener('click', togglePause);
restartBtn.addEventListener('click', resetGame);

resetGame();
