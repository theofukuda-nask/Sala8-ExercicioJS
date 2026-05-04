const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreElement = document.getElementById("score");
const totalCoinsElement = document.getElementById("totalCoins");
const shieldStatus = document.getElementById("shieldStatus");

const grid = 20;
let count = 0;
let score = 0;
let snake, food;
let snakeColor = "lime";
let started = false;
let gameOver = false;

// --- SISTEMA DE FILA (CORREÇÃO DO BUG DE MOVIMENTO) ---
let inputQueue = [];

// --- ECONOMIA E PERSISTÊNCIA ---
let coins = parseInt(localStorage.getItem("snake_coins")) || 0;
let inventory = JSON.parse(localStorage.getItem("snake_inv")) || { gold: false, shields: 0 };
let activeShield = false;

function save() {
  localStorage.setItem("snake_coins", coins);
  localStorage.setItem("snake_inv", JSON.stringify(inventory));
}

function updateUI() {
  totalCoinsElement.textContent = coins;
  shieldStatus.textContent = `Escudos em estoque: ${inventory.shields}`;
  
  if (inventory.gold && !document.querySelector('[data-skin="gold"]')) {
    const btn = document.createElement("button");
    btn.className = "skin gold";
    btn.dataset.skin = "gold";
    btn.textContent = "Ouro";
    btn.onclick = () => selectSkin(btn);
    document.getElementById("skinList").appendChild(btn);
    
    const shopBtn = document.getElementById("buyGoldSkin");
    shopBtn.classList.add("owned");
    shopBtn.textContent = "✨ Skin Ouro Adquirida";
  }
}

// --- LOJA ---
document.getElementById("buyGoldSkin").onclick = () => {
  if (coins >= 50 && !inventory.gold) {
    coins -= 50; inventory.gold = true;
    save(); updateUI();
  }
};

document.getElementById("buyShield").onclick = () => {
  if (coins >= 20) {
    coins -= 20; inventory.shields++;
    save(); updateUI();
  }
};

function selectSkin(btn) {
  document.querySelectorAll(".skin").forEach(b => b.classList.remove("selected"));
  btn.classList.add("selected");
  snakeColor = btn.dataset.skin;
}

document.querySelectorAll(".skin").forEach(btn => btn.onclick = () => selectSkin(btn));

// --- LÓGICA DO JOGO ---
function init() {
  snake = { x: 160, y: 160, dx: grid, dy: 0, cells: [], maxCells: 4 };
  food = { x: 80, y: 80 };
  score = 0;
  scoreElement.textContent = score;
  gameOver = false;
  started = true;
  inputQueue = []; // Limpa a fila de movimentos ao começar

  if (inventory.shields > 0) {
    inventory.shields--;
    activeShield = true;
    save();
    updateUI();
  } else {
    activeShield = false;
  }

  document.getElementById("menu").style.display = "none";
  document.getElementById("gameOver").style.display = "none";
}

function loop() {
  requestAnimationFrame(loop);
  if (!started || gameOver) return;

  // Velocidade do jogo (quanto menor o número, mais rápido)
  if (++count < 6) return;
  count = 0;

  // PROCESSA O MOVIMENTO DA FILA
  if (inputQueue.length > 0) {
    const nextMove = inputQueue.shift();
    snake.dx = nextMove.dx;
    snake.dy = nextMove.dy;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  snake.x += snake.dx;
  snake.y += snake.dy;

  // Colisão Paredes
  if (snake.x < 0 || snake.x >= canvas.width || snake.y < 0 || snake.y >= canvas.height) {
    handleDeath();
  }

  snake.cells.unshift({ x: snake.x, y: snake.y });
  if (snake.cells.length > snake.maxCells) snake.cells.pop();

  // Desenhar Comida
  ctx.fillStyle = "red";
  ctx.fillRect(food.x, food.y, grid - 1, grid - 1);

  // Desenhar Cobra
  ctx.fillStyle = snakeColor === "gold" ? "#ffd700" : snakeColor;
  
  // Efeito visual do Escudo
  if (activeShield) {
    ctx.shadowBlur = 15;
    ctx.shadowColor = "cyan";
  }

  snake.cells.forEach((cell, index) => {
    ctx.fillRect(cell.x, cell.y, grid - 1, grid - 1);

    // Comer fruta
    if (cell.x === food.x && cell.y === food.y) {
      score++;
      coins++;
      snake.maxCells++;
      scoreElement.textContent = score;
      totalCoinsElement.textContent = coins;
      
      canvas.classList.add('eat-flash');
      setTimeout(() => canvas.classList.remove('eat-flash'), 200);

      food.x = Math.floor(Math.random() * 20) * grid;
      food.y = Math.floor(Math.random() * 20) * grid;
      save();
    }

    // Colisão com o corpo
    for (let i = index + 1; i < snake.cells.length; i++) {
      if (cell.x === snake.cells[i].x && cell.y === snake.cells[i].y) {
        handleDeath();
      }
    }
  });
  ctx.shadowBlur = 0; // Reseta brilho para outros elementos
}

function handleDeath() {
  if (activeShield) {
    activeShield = false;
    // Pequeno feedback visual ao perder o escudo
    canvas.style.borderColor = "cyan";
    setTimeout(() => canvas.style.borderColor = "#333", 500);
    return; 
  }
  gameOver = true;
  document.getElementById("roundCoins").textContent = score;
  document.getElementById("gameOver").style.display = "flex";
}

/* CONTROLES COM FILA DE ENTRADA */
document.addEventListener("keydown", (e) => {
  if (!started || gameOver) return;

  // Pega a última direção pretendida na fila (ou a atual se a fila estiver vazia)
  const lastDir = inputQueue.length > 0 ? inputQueue[inputQueue.length - 1] : { dx: snake.dx, dy: snake.dy };

  if (e.key === "ArrowLeft" && lastDir.dx === 0) {
    inputQueue.push({ dx: -grid, dy: 0 });
  } else if (e.key === "ArrowUp" && lastDir.dy === 0) {
    inputQueue.push({ dx: 0, dy: -grid });
  } else if (e.key === "ArrowRight" && lastDir.dx === 0) {
    inputQueue.push({ dx: grid, dy: 0 });
  } else if (e.key === "ArrowDown" && lastDir.dy === 0) {
    inputQueue.push({ dx: 0, dy: grid });
  }

  // Previne que a fila fique gigante
  if (inputQueue.length > 2) inputQueue.length = 2;
});

document.getElementById("startBtn").onclick = init;
document.getElementById("restartBtn").onclick = () => {
  document.getElementById("gameOver").style.display = "none";
  document.getElementById("menu").style.display = "flex";
  started = false;
  updateUI();
};

updateUI();
requestAnimationFrame(loop);
