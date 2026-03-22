const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const $ = id => document.getElementById(id);

// Score elements: desktop + mobile
const scoreEls = [$('score-d'), $('score-m')].filter(Boolean);
const bestScoreEls = [$('best-score-d'), $('best-score-m')].filter(Boolean);
const speedEls = [$('speed-d')].filter(Boolean);
const statusEl = $('status');
const overlayEl = $('overlay');
const overlayTitleEl = $('overlay-title');
const overlayTextEl = $('overlay-text');
const startBtn = $('start-btn');
const pauseBtn = $('pause-btn');
const restartBtn = $('restart-btn');
const pauseBtnM = $('pause-btn-m');
const restartBtnM = $('restart-btn-m');

const gridSize = 20;
const tileCount = canvas.width / gridSize;
const speedProfiles = {
  slow: { base: 260, min: 170, label: '慢速' },
  normal: { base: 185, min: 105, label: '标准' },
  fast: { base: 130, min: 80, label: '加速' }
};

let currentSpeedMode = 'slow';
const bestScoreKey = 'snake-best-score-v1';

const directions = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 }
};

let snake, food, direction, nextDirection, score;
let bestScore = Number(localStorage.getItem(bestScoreKey) || 0);
let gameLoop = null, started = false, paused = false, gameOver = false;

function resetGame() {
  snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
  direction = directions.right;
  nextDirection = directions.right;
  score = 0; started = false; paused = false; gameOver = false;
  food = generateFood();
  updateHud();
  showOverlay('准备开吃', '电脑用方向键 / WASD，手机用下方按钮。');
  setStatus('按方向键开始');
  clearLoop(); draw();
}

function clearLoop() { if (gameLoop) { clearInterval(gameLoop); gameLoop = null; } }

function startGame() {
  if (gameOver) resetGame();
  started = true; paused = false;
  hideOverlay(); setStatus('进行中'); runLoop();
}

function runLoop() { clearLoop(); gameLoop = setInterval(tick, getSpeedDelay()); }

function getSpeedDelay() {
  const p = speedProfiles[currentSpeedMode];
  return Math.max(p.min, p.base - Math.floor(score / 5) * 8);
}

function updateHud() {
  scoreEls.forEach(el => el.textContent = score);
  bestScoreEls.forEach(el => el.textContent = bestScore);
  speedEls.forEach(el => el.textContent = speedProfiles[currentSpeedMode].label);
}

function setStatus(t) { if (statusEl) statusEl.textContent = t; }

function setSpeedMode(mode) {
  if (!speedProfiles[mode]) return;
  currentSpeedMode = mode;
  // Update all speed buttons (desktop + mobile)
  document.querySelectorAll('.speed-btn, .speed-btn-m').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.speed === mode);
  });
  updateHud();
  if (statusEl) setStatus(`当前速度：${speedProfiles[mode].label}`);
  if (started && !paused && !gameOver) runLoop();
}

function showOverlay(title, text, btn = '开始游戏') {
  if (overlayTitleEl) overlayTitleEl.textContent = title;
  if (overlayTextEl) overlayTextEl.textContent = text;
  if (startBtn) startBtn.textContent = btn;
  if (overlayEl) overlayEl.classList.add('visible');
}
function hideOverlay() { if (overlayEl) overlayEl.classList.remove('visible'); }

function generateFood() {
  while (true) {
    const c = { x: Math.floor(Math.random() * tileCount), y: Math.floor(Math.random() * tileCount) };
    if (!snake?.some(s => s.x === c.x && s.y === c.y)) return c;
  }
}

function tick() {
  if (paused || !started) return;
  direction = nextDirection;
  const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
  if (isCollision(head)) { endGame(); return; }
  snake.unshift(head);
  if (head.x === food.x && head.y === food.y) {
    score++;
    if (score > bestScore) { bestScore = score; localStorage.setItem(bestScoreKey, String(bestScore)); }
    food = generateFood(); updateHud(); runLoop();
  } else { snake.pop(); }
  draw();
}

function isCollision(h) {
  return h.x < 0 || h.y < 0 || h.x >= tileCount || h.y >= tileCount || snake.some(s => s.x === h.x && s.y === h.y);
}

function endGame() {
  gameOver = true; started = false; clearLoop(); updateHud();
  setStatus('游戏结束');
  showOverlay('游戏结束', `本局得分 ${score}，最高分 ${bestScore}。再来一局？`, '重新开始');
}

function togglePause() {
  if (!started || gameOver) return;
  paused = !paused;
  if (paused) { setStatus('已暂停'); showOverlay('已暂停', '休息一下', '继续游戏'); }
  else { hideOverlay(); setStatus('进行中'); }
}

function queueDirection(d) {
  if (d.x === -direction.x && d.y === -direction.y) return;
  nextDirection = d;
  if (!started && !gameOver) startGame();
}

// ===== Drawing =====
function drawGrid() {
  ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1;
  for (let i = 0; i <= tileCount; i++) {
    const p = i * gridSize;
    ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, canvas.height); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(canvas.width, p); ctx.stroke();
  }
  ctx.restore();
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x+r, y);
  ctx.arcTo(x+w, y, x+w, y+h, r); ctx.arcTo(x+w, y+h, x, y+h, r);
  ctx.arcTo(x, y+h, x, y, r); ctx.arcTo(x, y, x+w, y, r); ctx.closePath();
}

function drawSnake() {
  snake.forEach((seg, i) => {
    const x = seg.x*gridSize+2, y = seg.y*gridSize+2, sz = gridSize-4;
    const g = ctx.createLinearGradient(x, y, x+sz, y+sz);
    g.addColorStop(0, i===0?'#6ee7b7':'#34d399');
    g.addColorStop(1, i===0?'#22c55e':'#10b981');
    ctx.fillStyle = g; roundRect(x, y, sz, sz, 6); ctx.fill();
    if (i===0) {
      ctx.fillStyle = '#052814'; ctx.beginPath();
      ctx.arc(x+sz*0.33, y+sz*0.34, 2.4, 0, Math.PI*2);
      ctx.arc(x+sz*0.67, y+sz*0.34, 2.4, 0, Math.PI*2); ctx.fill();
    }
  });
}

function drawFood() {
  const x = food.x*gridSize+gridSize/2, y = food.y*gridSize+gridSize/2;
  const glow = ctx.createRadialGradient(x, y, 2, x, y, 12);
  glow.addColorStop(0, 'rgba(251,113,133,0.95)'); glow.addColorStop(1, 'rgba(251,113,133,0)');
  ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(x, y, 12, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#fb7185'; ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#86efac'; ctx.fillRect(x-1.5, y-11, 3, 6);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const bg = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  bg.addColorStop(0, '#07101b'); bg.addColorStop(1, '#0b1627');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawGrid(); drawFood(); drawSnake();
}

// ===== Keyboard =====
window.addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (['arrowup','arrowdown','arrowleft','arrowright',' ','w','a','s','d'].includes(k)) e.preventDefault();
  if (k==='arrowup'||k==='w') queueDirection(directions.up);
  else if (k==='arrowdown'||k==='s') queueDirection(directions.down);
  else if (k==='arrowleft'||k==='a') queueDirection(directions.left);
  else if (k==='arrowright'||k==='d') queueDirection(directions.right);
  else if (k===' ') { if (!started && !gameOver) startGame(); else togglePause(); }
});

// ===== Speed buttons (desktop + mobile) =====
document.querySelectorAll('.speed-btn, .speed-btn-m').forEach(btn => {
  btn.addEventListener('click', () => setSpeedMode(btn.dataset.speed));
});

// ===== Desktop sidebar control buttons =====
document.querySelectorAll('.control-btn').forEach(btn => {
  btn.addEventListener('click', () => queueDirection(directions[btn.dataset.dir]));
});

// ===== Mobile D-pad: touchstart/touchend with per-touch tracking =====
const dpadBtns = document.querySelectorAll('.d-btn[data-dir]');
const activeTouches = new Map();

dpadBtns.forEach(btn => {
  const dir = btn.dataset.dir;

  btn.addEventListener('touchstart', e => {
    e.preventDefault();
    for (const t of e.changedTouches) activeTouches.set(t.identifier, { dir, btn });
    queueDirection(directions[dir]);
    btn.classList.add('active');
  }, { passive: false });

  btn.addEventListener('touchend', e => {
    e.preventDefault();
    for (const t of e.changedTouches) activeTouches.delete(t.identifier);
    // Check if another touch is still on this button
    let stillHeld = false;
    for (const v of activeTouches.values()) { if (v.dir === dir) { stillHeld = true; break; } }
    if (!stillHeld) btn.classList.remove('active');
  }, { passive: false });

  btn.addEventListener('touchcancel', e => {
    for (const t of e.changedTouches) activeTouches.delete(t.identifier);
    btn.classList.remove('active');
  });
});

// ===== Canvas swipe =====
let sx = 0, sy = 0;
canvas.addEventListener('touchstart', e => { const t = e.changedTouches[0]; sx = t.clientX; sy = t.clientY; }, { passive: true });
canvas.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
canvas.addEventListener('touchend', e => {
  const t = e.changedTouches[0];
  const dx = t.clientX-sx, dy = t.clientY-sy;
  if (Math.abs(dx)<10 && Math.abs(dy)<10) return;
  if (!started && !gameOver) startGame();
  if (Math.abs(dx) > Math.abs(dy)) {
    queueDirection(dx>0 ? directions.right : directions.left);
  } else {
    queueDirection(dy>0 ? directions.down : directions.up);
  }
}, { passive: true });

// ===== UI Buttons =====
if (startBtn) startBtn.addEventListener('click', () => { if (paused) togglePause(); else startGame(); });
if (pauseBtn) pauseBtn.addEventListener('click', togglePause);
if (restartBtn) restartBtn.addEventListener('click', resetGame);
if (pauseBtnM) pauseBtnM.addEventListener('click', togglePause);
if (restartBtnM) restartBtnM.addEventListener('click', resetGame);

// Prevent zoom
document.addEventListener('gesturestart', e => e.preventDefault());
document.addEventListener('dblclick', e => e.preventDefault(), { passive: false });

resetGame();
