const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const MAP_SIZE = 3000;
let player, enemies = [], foods = [], camera = { x: 0, y: 0 }, mouse = { x: 0, y: 0 };
let gameActive = false;
let isTurbo = false; // Variável do Turbo
let coins = parseInt(localStorage.getItem("cobra_coins")) || 0;
let unlockedSkins = JSON.parse(localStorage.getItem("cobra_skins")) || ["#009c3b"];
let selectedColor = "#009c3b";

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

class Snake {
    constructor(x, y, color, isPlayer = false) {
        this.nodes = Array(20).fill({x, y});
        this.angle = Math.random() * Math.PI * 2;
        this.color = color;
        this.isPlayer = isPlayer;
        this.speed = 4;
        this.radius = 12;
        this.dead = false;
    }

    update() {
        if (this.dead) return;

        // Lógica de Velocidade (Turbo)
        if (this.isPlayer) {
            if (isTurbo && this.nodes.length > 15) {
                this.speed = 8;
                if (Date.now() % 150 < 20) { // Solta energia aos poucos
                    let dropped = this.nodes.pop();
                    foods.push({ x: dropped.x, y: dropped.y, color: this.color, value: 1, isEnergy: true, spawnTime: Date.now() });
                }
            } else {
                this.speed = 4;
            }

            let targetAngle = Math.atan2(mouse.y - canvas.height/2, mouse.x - canvas.width/2);
            let diff = targetAngle - this.angle;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            this.angle += diff * 0.15;
        } else {
            this.angle += (Math.random() - 0.5) * 0.2;
            if (this.nodes[0].x < 100 || this.nodes[0].x > MAP_SIZE-100 || this.nodes[0].y < 100 || this.nodes[0].y > MAP_SIZE-100) this.angle += 0.5;
        }

        const newHead = {
            x: this.nodes[0].x + Math.cos(this.angle) * this.speed,
            y: this.nodes[0].y + Math.sin(this.angle) * this.speed
        };

        this.nodes.unshift(newHead);
        this.nodes.pop();

        if (newHead.x < 0 || newHead.x > MAP_SIZE || newHead.y < 0 || newHead.y > MAP_SIZE) this.die();
    }

    draw() {
        for (let i = this.nodes.length - 1; i >= 0; i -= 2) {
            const n = this.nodes[i];
            if (this.color === "lgbt") {
                let hue = (i * 10 + Date.now() / 20) % 360;
                ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
                ctx.shadowBlur = 15;
                ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
            } else {
                ctx.fillStyle = this.color;
                ctx.shadowBlur = 0;
            }
            ctx.beginPath();
            ctx.arc(n.x - camera.x + canvas.width/2, n.y - camera.y + canvas.height/2, this.radius, 0, Math.PI*2);
            ctx.fill();
        }
        ctx.shadowBlur = 0;
    }

    die() {
        if (this.dead) return;
        this.dead = true;
        this.nodes.forEach((n, i) => {
            if (i % 3 === 0) {
                foods.push({ x: n.x, y: n.y, color: this.color === "lgbt" ? 'white' : this.color, value: 2, isEnergy: true, spawnTime: Date.now() });
            }
        });
        if (this.isPlayer) {
            gameActive = false;
            document.getElementById("menuTitle").textContent = "💀 FIM DE JOGO";
            document.getElementById("menu").style.display = "flex";
            localStorage.setItem("cobra_coins", coins);
        } else {
            const idx = enemies.indexOf(this);
            setTimeout(() => { if(idx > -1) enemies[idx] = new Snake(Math.random()*MAP_SIZE, Math.random()*MAP_SIZE, "#ffdf00"); }, 3000);
        }
    }
}

// --- FUNÇÕES DE APOIO ---
function updateFoods() {
    const NOW = Date.now();
    for (let i = foods.length - 1; i >= 0; i--) {
        if (foods[i].isEnergy && (NOW - foods[i].spawnTime > 8000)) foods.splice(i, 1);
    }
}

function checkCollisions(snake) {
    const head = snake.nodes[0];
    foods.forEach((f, i) => {
        if (Math.hypot(head.x - f.x, head.y - f.y) < snake.radius + 10) {
            for(let j=0; j < f.value; j++) snake.nodes.push({...snake.nodes[snake.nodes.length-1]});
            if (snake.isPlayer) coins += (f.isEnergy ? 2 : 1);
            foods.splice(i, 1);
            if (!f.isEnergy) spawnFood();
        }
    });

    [player, ...enemies].forEach(other => {
        if (other === snake || other.dead) return;
        for (let i = 0; i < other.nodes.length; i += 2) {
            if (Math.hypot(head.x - other.nodes[i].x, head.y - other.nodes[i].y) < snake.radius + other.radius - 5) {
                snake.die();
                break;
            }
        }
    });
}

function spawnFood() {
    foods.push({ x: Math.random()*MAP_SIZE, y: Math.random()*MAP_SIZE, color: 'white', value: 1, isEnergy: false });
}

function updateLeaderboard() {
    const list = document.getElementById("leaderList");
    if (!list) return;
    let all = [{n: "VOCÊ", s: player.nodes.length, p: true}, ...enemies.map((e, i) => ({n: `Bot ${i+1}`, s: e.nodes.length}))];
    all.sort((a,b) => b.s - a.s);
    list.innerHTML = all.slice(0,5).map((s, i) => `<div class="leader-item ${s.p?'player':''}">#${i+1} ${s.n}: ${s.s}m</div>`).join("");
}

function updateUI() {
    document.getElementById("coinCount").textContent = coins;
    document.querySelectorAll(".skin-btn").forEach(btn => {
        const color = btn.dataset.color;
        btn.classList.toggle("locked", !unlockedSkins.includes(color));
        btn.classList.toggle("active", selectedColor === color);
        btn.onclick = () => {
            if (unlockedSkins.includes(color)) selectedColor = color;
            else if (coins >= parseInt(btn.dataset.price)) {
                coins -= parseInt(btn.dataset.price);
                unlockedSkins.push(color);
                selectedColor = color;
                localStorage.setItem("cobra_skins", JSON.stringify(unlockedSkins));
            }
            updateUI();
        };
    });
}

function init() {
    player = new Snake(MAP_SIZE/2, MAP_SIZE/2, selectedColor, true);
    enemies = Array(12).fill(0).map(() => new Snake(Math.random()*MAP_SIZE, Math.random()*MAP_SIZE, "#ffdf00"));
    foods = Array(200).fill(0).map(() => ({ x: Math.random()*MAP_SIZE, y: Math.random()*MAP_SIZE, color: 'white', value: 1, isEnergy: false }));
    gameActive = true;
    document.getElementById("menu").style.display = "none";
}

function loop() {
    ctx.fillStyle = "#0d1117";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (gameActive) {
        updateFoods();
        if (Date.now() % 1000 < 20) updateLeaderboard();
        camera.x = player.nodes[0].x; camera.y = player.nodes[0].y;
        foods.forEach(f => {
            ctx.fillStyle = f.color;
            ctx.beginPath(); ctx.arc(f.x - camera.x + canvas.width/2, f.y - camera.y + canvas.height/2, f.isEnergy?6:4, 0, 7); ctx.fill();
        });
        enemies.forEach(e => { e.update(); checkCollisions(e); e.draw(); });
        player.update(); checkCollisions(player); player.draw();
        document.getElementById("currentScore").textContent = player.nodes.length;
    }
    requestAnimationFrame(loop);
}

// --- EVENTOS ---
window.onmousemove = e => { mouse.x = e.clientX; mouse.y = e.clientY; };
window.onmousedown = () => isTurbo = true;
window.onmouseup = () => isTurbo = false;
document.getElementById("startBtn").onclick = init;

updateUI();
loop();
