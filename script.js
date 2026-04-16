const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const WORLD_SIZE = 3000;
const COLORS = { 2: "#eee4da", 4: "#ede0c8", 8: "#f2b179", 16: "#f59563", 32: "#f67c5f", 64: "#f65e3b", 128: "#edcf72", 256: "#edcc61", 512: "#edc850", 1024: "#edc53f", 2048: "#3c3a32" };

let gameActive = false;
let player, npcs = [], food = [], camera = { x: 0, y: 0, zoom: 1 };
let spacePressed = false;
let powerUp = null;
let nextPowerUpTime = Date.now() + 5000;
let highScore = localStorage.getItem('cubes_high') || 0;
document.getElementById('bestScore').innerText = highScore;



// Setup Audio
const bgm = new Audio('Aylex - ANIME (freetouse.com).mp3');
const deadSound = new Audio('dead.mp3'); // <--- ADD THIS LINE HERE
bgm.loop = true;
bgm.volume = 0.4;
deadSound.volume = 0.7;

let musicEnabled = true;

// Function to play death sound safely
function playDeadSound() {
    if (musicEnabled) {
        deadSound.currentTime = 0;
        deadSound.play().catch(e => console.log("Audio play blocked"));
    }
}



// Wait for the page to be fully ready
document.addEventListener('DOMContentLoaded', () => {
    
    const btn = document.getElementById('music-toggle-text');
    const slider = document.getElementById('volume-slider');

  
    // 1. Toggle Functionality
    btn.addEventListener('click', (event) => {
        event.stopPropagation(); // Stops the "click anywhere" trigger
        
        musicEnabled = !musicEnabled;
        
        if (musicEnabled) {
            bgm.play();
            btn.innerText = "🔊 MUSIC: ON";
        } else {
            bgm.pause();
            btn.innerText = "🔈 MUSIC: OFF";
        }
    });

    // 2. Volume Slider Functionality
    slider.addEventListener('input', function() {
        bgm.volume = this.value;
    });

    // 3. Stop slider clicks from pausing music
    slider.addEventListener('click', (e) => e.stopPropagation());
});

// 4. Global "Click anywhere to start" (unlock)
window.addEventListener('click', function unlock() {
    if (musicEnabled && bgm.paused) {
        bgm.play().catch(() => {});
        window.removeEventListener('click', unlock);
    }
}, { once: true });

// 5. Your Loop Logic
bgm.addEventListener('timeupdate', function() {
    const buffer = 0.4;
    if (this.currentTime > this.duration - buffer) {
        this.currentTime = 0;
        this.play();
    }
});

class Cube {
    constructor(x, y, value) { 
        this.x = x; this.y = y; this.value = value; this.scale = 1.0; 
    }
    getSize() { return 40 + (Math.log2(this.value) * 10); }
    draw(camX, camY, zoom, name = null) {
        let baseSize = this.getSize();
        let sx = (this.x - camX) * zoom + canvas.width / 2;
        let sy = (this.y - camY) * zoom + canvas.height / 2;
        if (this.scale > 1.0) this.scale -= 0.04;
        let finalSize = baseSize * this.scale * zoom;
        if (sx < -finalSize || sx > canvas.width + finalSize || sy < -finalSize || sy > canvas.height + finalSize) return;

        ctx.fillStyle = COLORS[this.value] || "#333";
        ctx.beginPath(); ctx.roundRect(sx - finalSize/2, sy - finalSize/2, finalSize, finalSize, 8 * zoom); ctx.fill();
        ctx.fillStyle = this.value <= 4 ? "#776e65" : "white";
        let fontSize = (baseSize * 0.4) * this.scale * zoom;
        ctx.font = `bold ${fontSize}px Arial`; ctx.textAlign = "center";
        ctx.fillText(this.value, sx, sy + (fontSize/3));
        if (name) { ctx.fillStyle = "white"; ctx.font = `${14 * zoom}px Arial`; ctx.fillText(name, sx, sy - (finalSize/2 + 10)); }
    }
}

class PowerUp {
    constructor(x, y) {
        this.x = x; this.y = y; this.spawnTime = Date.now();
    }
    draw(camX, camY, zoom) {
        let sx = (this.x - camX) * zoom + canvas.width / 2;
        let sy = (this.y - camY) * zoom + canvas.height / 2;
        let pulse = 1 + Math.sin(Date.now() / 200) * 0.15;
        let size = 80 * zoom * pulse;

        ctx.shadowBlur = 30 * zoom; ctx.shadowColor = "#edcf72";
        ctx.fillStyle = "#3c3a32";
        ctx.beginPath(); ctx.roundRect(sx - size/2, sy - size/2, size, size, 12 * zoom); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#edcf72"; ctx.font = `bold ${36 * zoom * pulse}px Arial`; ctx.textAlign = "center";
        ctx.fillText("2x", sx, sy + (12 * zoom * pulse));
    }
}

class Entity {
    constructor(x, y, name, isNPC) { 
        this.segments = [new Cube(x, y, isNPC ? Math.pow(2, Math.floor(Math.random()*4)+1) : 2)];
        this.name = name; this.isNPC = isNPC;
        this.angle = Math.random() * Math.PI * 2;
        this.baseSpeed = 3.2; this.speed = this.baseSpeed;
        this.dead = false; this.boostTimer = 5; this.isBoosting = false;
    }

    update(all) {
        if (this.dead || !this.segments.length) return;
        let head = this.segments[0];

        if (!this.isNPC) {
            if (spacePressed && this.boostTimer > 0) {
                this.isBoosting = true; this.speed = this.baseSpeed * 1.8; this.boostTimer -= 0.04; 
            } else {
                this.isBoosting = false; this.speed = this.baseSpeed;
                if (this.boostTimer < 5) this.boostTimer += 0.015;
            }
        } else { this.think(all); }
        
        head.x += Math.cos(this.angle) * this.speed;
        head.y += Math.sin(this.angle) * this.speed;

        if (Math.abs(head.x) > WORLD_SIZE) { head.x = Math.sign(head.x) * WORLD_SIZE; this.angle = Math.PI - this.angle; }
        if (Math.abs(head.y) > WORLD_SIZE) { head.y = Math.sign(head.y) * WORLD_SIZE; this.angle = -this.angle; }

        for (let i = 1; i < this.segments.length; i++) {
            let p = this.segments[i-1], c = this.segments[i];
            let d = Math.hypot(p.x - c.x, p.y - c.y);
            let targetDist = (p.getSize() + c.getSize()) / 2 * 0.85;
            if (d > targetDist) {
                let a = Math.atan2(p.y - c.y, p.x - c.x);
                c.x = p.x - Math.cos(a) * targetDist; c.y = p.y - Math.sin(a) * targetDist;
            }
        }
        this.mergeBody();
    }

    think(all) {
        let head = this.segments[0];
        let threat = null, target = null, dist = 550;
        for (let other of all) {
            if (other === this || other.dead) continue;
            let d = Math.hypot(head.x - other.segments[0].x, head.y - other.segments[0].y);
            if (d < dist) {
                if (other.segments[0].value > head.value) { threat = other; dist = d; }
                else if (other.segments[0].value < head.value) target = other;
            }
        }
        if (threat) this.angle = Math.atan2(threat.segments[0].y - head.y, threat.segments[0].x - head.x) + Math.PI;
        else if (powerUp) this.angle = Math.atan2(powerUp.y - head.y, powerUp.x - head.x); // Bots hunt the 2x!
        else if (target) this.angle = Math.atan2(target.segments[0].y - head.y, target.segments[0].x - head.x);
        else if (Math.random() > 0.98) this.angle += (Math.random() - 0.5);
    }

    mergeBody() {
        for (let i = this.segments.length - 1; i >= 0; i--) {
            for (let j = i - 1; j >= 0; j--) {
                if (this.segments[i] && this.segments[j] && this.segments[i].value === this.segments[j].value) {
                    this.segments[j].value *= 2; this.segments.splice(i, 1);
                    this.segments.sort((a,b) => b.value - a.value); return;
                }
            }
        }
    }
}

function startGame() {
    player = new Entity(0, 0, document.getElementById('nickname').value || "Player", false);
    food = []; npcs = []; powerUp = null; gameActive = true;
    nextPowerUpTime = Date.now() + 5000;
    if (musicEnabled) bgm.play();
    document.getElementById('overlay').style.display = "none";
}
window.startGame = startGame;

function processCollisions() {
    let all = [player, ...npcs];
    for (let p1 of all) {
        if (p1.dead) continue;
        let h1 = p1.segments[0];
        let s1 = h1.getSize();

        if (powerUp && Math.hypot(h1.x - powerUp.x, h1.y - powerUp.y) < (s1 + 80)/2) {
            p1.segments.forEach(seg => seg.value *= 2);
            h1.scale = 2.2; powerUp = null; nextPowerUpTime = Date.now() + 20000;
        }

        food.forEach((f, i) => {
            if (Math.hypot(h1.x - f.x, h1.y - f.y) < (s1 + f.getSize())/2) {
                p1.segments.push(new Cube(h1.x, h1.y, f.value)); food.splice(i, 1); h1.scale = 1.3;
            }
        });

        npcs.concat(player).forEach(p2 => {
            if (p1 === p2 || p2.dead) return;
            p2.segments.forEach((seg, j) => {
                if (Math.hypot(h1.x - seg.x, h1.y - seg.y) < (s1 + seg.getSize())/2) {
                    if (h1.value > seg.value) {
                        p1.segments.push(new Cube(h1.x, h1.y, seg.value)); p2.segments.splice(j, 1);
                        h1.scale = 1.5; if (!p2.segments.length) p2.dead = true;
                    } else if (h1.value < seg.value && p1 === player) p1.dead = true;
                }
            });
        });
    }
    if (player.dead) { 
        if (player.dead) { 
        // ADD THIS LINE RIGHT HERE:
        playDeadSound();
        gameActive = false; document.getElementById('death-text').style.display = "block";
        document.getElementById('overlay').style.display = "flex";
        if (player.segments[0].value > highScore) {
            highScore = player.segments[0].value; localStorage.setItem('cubes_high', highScore);
            document.getElementById('bestScore').innerText = highScore;
        }
        }
    }
    npcs = npcs.filter(n => !n.dead);
    while (npcs.length < 15) {
        let rx = (Math.random()-0.5)*WORLD_SIZE*2, ry = (Math.random()-0.5)*WORLD_SIZE*2;
        if (Math.hypot(rx - player.segments[0].x, ry - player.segments[0].y) > 1200) npcs.push(new Entity(rx, ry, "Bot", true));
    }
}

function draw() {
    if(gameActive && player) {
        let targetZoom = 1 / (1 + (Math.log2(player.segments[0].value) - 1) * 0.15);
        camera.zoom += (targetZoom - camera.zoom) * 0.05;
        camera.x += (player.segments[0].x - camera.x) * 0.1;
        camera.y += (player.segments[0].y - camera.y) * 0.1;
        
        ctx.fillStyle = "#0b0b0b"; ctx.fillRect(0,0,canvas.width, canvas.height);
        
        ctx.strokeStyle = "#1a1a1a"; ctx.lineWidth = 1;
        for(let i=-WORLD_SIZE; i<=WORLD_SIZE; i+=250) {
            ctx.beginPath(); 
            ctx.moveTo((i - camera.x) * camera.zoom + canvas.width/2, (-WORLD_SIZE - camera.y) * camera.zoom + canvas.height/2);
            ctx.lineTo((i - camera.x) * camera.zoom + canvas.width/2, (WORLD_SIZE - camera.y) * camera.zoom + canvas.height/2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo((-WORLD_SIZE - camera.x) * camera.zoom + canvas.width/2, (i - camera.y) * camera.zoom + canvas.height/2);
            ctx.lineTo((WORLD_SIZE - camera.x) * camera.zoom + canvas.width/2, (i - camera.y) * camera.zoom + canvas.height/2);
            ctx.stroke();
        }

        if (!powerUp && Date.now() > nextPowerUpTime) {
            powerUp = new PowerUp((Math.random()-0.5)*WORLD_SIZE*1.6, (Math.random()-0.5)*WORLD_SIZE*1.6);
        }
        if (powerUp) {
            powerUp.draw(camera.x, camera.y, camera.zoom);
            if (Date.now() - powerUp.spawnTime > 15000) { powerUp = null; nextPowerUpTime = Date.now() + 20000; }
        }

        ctx.strokeStyle = "#ff4444"; ctx.lineWidth = 12 * camera.zoom;
        ctx.strokeRect((-WORLD_SIZE - camera.x) * camera.zoom + canvas.width/2, (-WORLD_SIZE - camera.y) * camera.zoom + canvas.height/2, WORLD_SIZE * 2 * camera.zoom, WORLD_SIZE * 2 * camera.zoom);

        while(food.length < 250) food.push(new Cube((Math.random()-0.5)*WORLD_SIZE*2, (Math.random()-0.5)*WORLD_SIZE*2, 2));
        food.forEach(f => f.draw(camera.x, camera.y, camera.zoom));
        
        let all = [player, ...npcs];
        all.forEach(p => { 
            p.update(all); 
            p.segments.slice().reverse().forEach((s, i) => s.draw(camera.x, camera.y, camera.zoom, i === p.segments.length-1 ? p.name : null)); 
        });

        processCollisions();
        
        if (Math.floor(Date.now() / 400) % 2 === 0) {
            let sorted = [...all].filter(e => e.segments.length > 0).sort((a,b) => b.segments[0].value - a.segments[0].value).slice(0, 10);
            document.getElementById('lb-list').innerHTML = sorted.map((e, i) => `<div class="lb-item ${e===player?'lb-me':''}"><span>${i+1}. ${e.name}</span><span>${e.segments[0].value}</span></div>`).join('');
        }
        document.getElementById('boost-bar').style.width = (player.boostTimer / 5 * 100) + "%";
        document.getElementById('boost-bar').style.backgroundColor = player.isBoosting ? "#f65e3b" : "#edcf72";
    }
    requestAnimationFrame(draw);
}

window.addEventListener('mousemove', e => { 
    if(gameActive && player) player.angle = Math.atan2(e.clientY - canvas.height/2, e.clientX - canvas.width/2); 
});
window.addEventListener('keydown', e => { if (e.code === "Space") { spacePressed = true; e.preventDefault(); } });
window.addEventListener('keyup', e => { if (e.code === "Space") spacePressed = false; });
window.addEventListener('resize', () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; });

canvas.width = window.innerWidth; canvas.height = window.innerHeight;
player = new Entity(0,0,"Player",false);
draw();