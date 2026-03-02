/**
 * ==========================================
 * FLAPPY BIRD PRO - PREMIUM EDITION
 * Enhanced Game Engine with Visual Effects
 * ==========================================
 */

// ===== GAME CONFIGURATION =====
const GAME_CONFIG = {
    CANVAS_ID: "flappyCanvas",
    MESSAGE_ID: "message-box",
    SLOW_MO_BUTTON_ID: "slowMoButton",
    MOBILE_PAUSE_ID: "mobilePauseBtn",
    MOBILE_EXIT_ID: "mobileExitBtn",
    PAUSE_ID: "pause-indicator",
    SOUND_TOGGLE_ID: "soundToggle",
    
    FPS: 60,
    GROUND_HEIGHT: 50,
    
    BIRD: {
        START_X: 50,
        START_Y: 250,
        SIZE: 15,
        GRAVITY: 0.5,
        JUMP_POWER: -8,
        MAX_FALL: 10,
        MAX_ROTATION: Math.PI / 2
    },
    
    PIPE: {
        WIDTH: 60,
        SPAWN_RATE: 100,
        MIN_GAP_Y: 100,
        MAX_GAP_Y: 400,
        COLORS: {
            PRIMARY: '#00ffff',
            SECONDARY: '#9d4edd',
            BORDER: '#ff69b4'
        }
    },
    
    LEVELS: [
        { level: 1, baseSpeed: 3, gap: 120, scoreThreshold: 10 },
        { level: 2, baseSpeed: 4, gap: 110, scoreThreshold: 20 },
        { level: 3, baseSpeed: 5, gap: 100, scoreThreshold: 30 },
        { level: 4, baseSpeed: 6, gap: 90,  scoreThreshold: 40 },
        { level: 5, baseSpeed: 7, gap: 80,  scoreThreshold: Infinity }
    ]
};

// ===== VISUAL EFFECTS MANAGER =====
class VisualEffects {
    constructor() {
        this.soundEnabled = true;
        this.particles = [];
    }
    
    // Initialize particles
    initParticles() {
        if (window.particlesJS) {
            particlesJS('particles-js', {
                particles: {
                    number: { value: 80, density: { enable: true, value_area: 800 } },
                    color: { value: '#00ffff' },
                    shape: { type: 'circle' },
                    opacity: { value: 0.5, random: true },
                    size: { value: 3, random: true },
                    line_linked: {
                        enable: true,
                        distance: 150,
                        color: '#9d4edd',
                        opacity: 0.2,
                        width: 1
                    },
                    move: {
                        enable: true,
                        speed: 2,
                        direction: 'none',
                        random: true,
                        straight: false,
                        out_mode: 'out',
                        bounce: false
                    }
                },
                interactivity: {
                    detect_on: 'canvas',
                    events: {
                        onhover: { enable: true, mode: 'repulse' },
                        onclick: { enable: true, mode: 'push' },
                        resize: true
                    }
                },
                retina_detect: true
            });
        }
    }
    
    // Create jump ripple effect
    createJumpRipple(x, y) {
        const ripple = document.createElement('div');
        ripple.className = 'jump-ripple';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        document.body.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 500);
    }
    
    // Create score pop effect
    createScorePop(score, x, y) {
        const pop = document.createElement('div');
        pop.className = 'score-pop';
        pop.textContent = '+' + score;
        pop.style.left = x + 'px';
        pop.style.top = y + 'px';
        document.body.appendChild(pop);
        
        setTimeout(() => {
            pop.remove();
        }, 1000);
    }
    
    // Screen shake effect
    shakeScreen(intensity = 5) {
        const container = document.getElementById('game-container');
        container.style.animation = 'shake 0.2s ease';
        
        setTimeout(() => {
            container.style.animation = '';
        }, 200);
    }
    
    // Toggle sound
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        const soundBtn = document.getElementById(GAME_CONFIG.SOUND_TOGGLE_ID);
        if (soundBtn) {
            soundBtn.innerHTML = this.soundEnabled ? 
                '<i class="fas fa-volume-up"></i>' : 
                '<i class="fas fa-volume-mute"></i>';
        }
    }
    
    // Play sound (if enabled)
    playSound(type) {
        if (!this.soundEnabled) return;
        
        // Simple audio context beep (since we can't use actual sound files)
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        switch(type) {
            case 'jump':
                oscillator.frequency.value = 400;
                gainNode.gain.value = 0.1;
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.1);
                break;
            case 'score':
                oscillator.frequency.value = 600;
                gainNode.gain.value = 0.1;
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.15);
                break;
            case 'gameover':
                oscillator.frequency.value = 200;
                gainNode.gain.value = 0.2;
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.3);
                break;
        }
    }
}

// ===== GAME STATE MANAGER =====
class GameState {
    constructor() {
        this.visuals = new VisualEffects();
        this.reset();
    }
    
    reset() {
        this.score = 0;
        this.levelIndex = 0;
        this.isPlaying = false;
        this.isPaused = false;
        this.isSlowMo = false;
        this.frameCount = 0;
        this.pipes = [];
        
        this.bird = {
            x: GAME_CONFIG.BIRD.START_X,
            y: GAME_CONFIG.BIRD.START_Y,
            size: GAME_CONFIG.BIRD.SIZE,
            velocity: 0,
            rotation: 0,
            trail: []
        };
        
        this.pipeConfig = {
            width: GAME_CONFIG.PIPE.WIDTH,
            gap: GAME_CONFIG.LEVELS[0].gap,
            speed: GAME_CONFIG.LEVELS[0].baseSpeed,
            spawnRate: GAME_CONFIG.PIPE.SPAWN_RATE,
            minGapY: GAME_CONFIG.PIPE.MIN_GAP_Y,
            maxGapY: GAME_CONFIG.PIPE.MAX_GAP_Y
        };
        
        this.ground = {
            height: GAME_CONFIG.GROUND_HEIGHT,
            offset: 0,
            color: 'linear-gradient(45deg, #4a2c1a, #6b4c2c)'
        };
        
        this.updateLevelParams();
    }
    
    updateLevelParams() {
        const level = GAME_CONFIG.LEVELS[this.levelIndex];
        this.pipeConfig.gap = level.gap;
        const baseSpeed = level.baseSpeed;
        this.pipeConfig.speed = this.isSlowMo ? baseSpeed / 2 : baseSpeed;
        if (this.pipeConfig.speed < 1) this.pipeConfig.speed = 1;
        
        // Update level progress bar
        const progressBar = document.getElementById('levelProgress');
        if (progressBar) {
            const nextThreshold = level.scoreThreshold;
            const progress = nextThreshold === Infinity ? 100 : 
                (this.score / nextThreshold) * 100;
            progressBar.style.width = Math.min(progress, 100) + '%';
        }
    }
    
    getCurrentLevel() {
        return GAME_CONFIG.LEVELS[this.levelIndex];
    }
    
    incrementScore() {
        this.score++;
        const currentLevel = this.getCurrentLevel();
        
        if (this.levelIndex < GAME_CONFIG.LEVELS.length - 1 && 
            this.score >= currentLevel.scoreThreshold) {
            this.levelIndex++;
            this.updateLevelParams();
            return true;
        }
        return false;
    }
}

// ===== UI RENDERER =====
class UIRenderer {
    constructor(canvasId, gameState) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.gameState = gameState;
        
        this.messageBox = document.getElementById(GAME_CONFIG.MESSAGE_ID);
        this.scoreText = document.getElementById('scoreText');
        this.levelText = document.getElementById('levelText');
        this.pauseIndicator = document.getElementById(GAME_CONFIG.PAUSE_ID);
        this.slowMoButton = document.getElementById(GAME_CONFIG.SLOW_MO_BUTTON_ID);
        this.levelProgress = document.getElementById('levelProgress');
    }
    
    updateScoreDisplay() {
        if (this.scoreText) this.scoreText.textContent = this.gameState.score;
        if (this.levelText) this.levelText.textContent = `LEVEL ${this.gameState.levelIndex + 1}`;
        
        // Update level progress
        if (this.levelProgress) {
            const currentLevel = this.gameState.getCurrentLevel();
            const nextThreshold = currentLevel.scoreThreshold;
            const progress = nextThreshold === Infinity ? 100 : 
                (this.gameState.score / nextThreshold) * 100;
            this.levelProgress.style.width = Math.min(progress, 100) + '%';
        }
    }
    
    updateSlowMoButton() {
        if (this.slowMoButton) {
            this.slowMoButton.classList.toggle('active', this.gameState.isSlowMo);
            this.slowMoButton.innerHTML = this.gameState.isSlowMo ? 
                '<div class="btn-shine"></div><i class="fas fa-clock"></i><span class="btn-text">Normal</span><div class="btn-glow"></div>' : 
                '<div class="btn-shine"></div><i class="fas fa-hourglass-half"></i><span class="btn-text">Slow Motion</span><div class="btn-glow"></div>';
        }
    }
    
    showStartScreen() {
        if (!this.messageBox) return;
        this.messageBox.style.display = 'block';
        if (this.pauseIndicator) this.pauseIndicator.style.display = 'none';
    }
    
    showGameOver() {
        if (!this.messageBox) return;
        this.messageBox.innerHTML = `
            <div class="message-content">
                <div class="message-icon">
                    <i class="fas fa-skull"></i>
                </div>
                <h2>✦ GAME OVER ✦</h2>
                <p class="highlight">Score: ${this.gameState.score}</p>
                <p style="margin:10px 0; color:var(--accent-cyan);">Level ${this.gameState.levelIndex + 1}</p>
                <button id="exitButton" class="premium-btn" style="margin:20px auto 0; padding:15px 40px;">
                    <div class="btn-shine"></div>
                    <i class="fas fa-home"></i> Main Menu
                    <div class="btn-glow"></div>
                </button>
                <p class="restart-prompt">Tap canvas to restart</p>
            </div>
        `;
        this.messageBox.style.display = 'block';
        if (this.pauseIndicator) this.pauseIndicator.style.display = 'none';
    }
    
    hideMessageBox() {
        if (this.messageBox) this.messageBox.style.display = 'none';
    }
    
    setPauseVisible(visible) {
        if (this.pauseIndicator) {
            this.pauseIndicator.style.display = visible ? 'flex' : 'none';
        }
    }
    
    // Enhanced Drawing Methods
    drawBird() {
        if (!this.ctx) return;
        
        const bird = this.gameState.bird;
        const size = bird.size;
        
        // Calculate rotation
        const maxVel = 10;
        bird.rotation = Math.min(
            GAME_CONFIG.BIRD.MAX_ROTATION,
            Math.max(-GAME_CONFIG.BIRD.MAX_ROTATION, 
            bird.velocity / maxVel * GAME_CONFIG.BIRD.MAX_ROTATION)
        );
        
        this.ctx.save();
        this.ctx.translate(bird.x, bird.y);
        this.ctx.rotate(bird.rotation);
        
        // Draw trail effect
        for (let i = 0; i < bird.trail.length; i++) {
            const trail = bird.trail[i];
            this.ctx.globalAlpha = 0.2 * (i / bird.trail.length);
            this.ctx.fillStyle = '#00ffff';
            this.ctx.beginPath();
            this.ctx.ellipse(trail.x - bird.x, trail.y - bird.y, 
                size * 0.8, size * 0.6, 0, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.globalAlpha = 1;
        
        // Body with enhanced gradient
        const gradient = this.ctx.createRadialGradient(-5, -5, 2, 0, 0, size * 1.5);
        gradient.addColorStop(0, '#ffff00');
        gradient.addColorStop(0.5, '#ffaa00');
        gradient.addColorStop(1, '#ff5500');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, size * 1.2, size, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Glow effect
        this.ctx.shadowColor = '#00ffff';
        this.ctx.shadowBlur = 20;
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
        
        // Beak
        this.ctx.fillStyle = '#ffaa00';
        this.ctx.beginPath();
        this.ctx.moveTo(size * 1.2, 0);
        this.ctx.lineTo(size * 1.8, -size / 4);
        this.ctx.lineTo(size * 1.8, size / 4);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.strokeStyle = '#ff5500';
        this.ctx.stroke();
        
        // Wing with animation
        const wingAngle = Math.sin(Date.now() * 0.01) * 0.2;
        this.ctx.save();
        this.ctx.translate(-size * 0.3, size * 0.2);
        this.ctx.rotate(wingAngle);
        this.ctx.fillStyle = 'rgba(255, 165, 0, 0.8)';
        this.ctx.fillRect(-size * 0.3, -size * 0.1, size, size * 0.4);
        this.ctx.restore();
        
        // Eye with glow
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(size * 0.5, -size * 0.4, 3, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.arc(size * 0.5, -size * 0.4, 1.5, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(size * 0.3, -size * 0.5, 0.5, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
        
        // Update trail
        bird.trail.push({ x: bird.x, y: bird.y });
        if (bird.trail.length > 5) bird.trail.shift();
    }
    
    drawPipe(pipe) {
        if (!this.ctx) return;
        
        const cfg = this.gameState.pipeConfig;
        const colors = GAME_CONFIG.PIPE.COLORS;
        const flangeH = 15;
        const flangeW = cfg.width + 10;
        
        // Top pipe with enhanced gradient
        const gradientTop = this.ctx.createLinearGradient(pipe.x, 0, pipe.x + cfg.width, pipe.y);
        gradientTop.addColorStop(0, '#00ff00');
        gradientTop.addColorStop(0.5, '#00cc00');
        gradientTop.addColorStop(1, '#009900');
        
        this.ctx.fillStyle = gradientTop;
        this.ctx.shadowColor = '#00ff00';
        this.ctx.shadowBlur = 10;
        this.ctx.fillRect(pipe.x, 0, cfg.width, pipe.y);
        this.ctx.fillRect(pipe.x - 5, pipe.y - flangeH, flangeW, flangeH);
        this.ctx.shadowBlur = 0;
        
        this.ctx.strokeStyle = '#00ffff';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(pipe.x - 5, pipe.y - flangeH, flangeW, flangeH);
        this.ctx.strokeRect(pipe.x, 0, cfg.width, pipe.y - flangeH);
        
        // Bottom pipe
        const bottomY = pipe.y + cfg.gap;
        const bottomH = this.canvas.height - bottomY - this.gameState.ground.height;
        
        const gradientBottom = this.ctx.createLinearGradient(pipe.x, bottomY, pipe.x + cfg.width, bottomY + bottomH);
        gradientBottom.addColorStop(0, '#00ff00');
        gradientBottom.addColorStop(0.5, '#00cc00');
        gradientBottom.addColorStop(1, '#009900');
        
        this.ctx.fillStyle = gradientBottom;
        this.ctx.shadowColor = '#00ff00';
        this.ctx.shadowBlur = 10;
        this.ctx.fillRect(pipe.x, bottomY, cfg.width, bottomH);
        this.ctx.fillRect(pipe.x - 5, bottomY, flangeW, flangeH);
        this.ctx.shadowBlur = 0;
        
        this.ctx.strokeStyle = '#00ffff';
        this.ctx.strokeRect(pipe.x - 5, bottomY, flangeW, flangeH);
        this.ctx.strokeRect(pipe.x, bottomY + flangeH, cfg.width, bottomH - flangeH);
    }
    
    drawGround() {
        if (!this.ctx) return;
        
        const ground = this.gameState.ground;
        const groundY = this.canvas.height - ground.height;
        
        // Ground gradient
        const gradient = this.ctx.createLinearGradient(0, groundY, 0, this.canvas.height);
        gradient.addColorStop(0, '#8B4513');
        gradient.addColorStop(0.5, '#5D3A1A');
        gradient.addColorStop(1, '#2C1A0D');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, groundY, this.canvas.width, ground.height);
        
        // Top border with glow
        this.ctx.shadowColor = '#00ffff';
        this.ctx.shadowBlur = 15;
        this.ctx.strokeStyle = '#00ffff';
        this.ctx.lineWidth = 8;
        this.ctx.beginPath();
        this.ctx.moveTo(0, groundY + 4);
        this.ctx.lineTo(this.canvas.width, groundY + 4);
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
        
        // Animated pattern
        this.ctx.fillStyle = '#8B6B4D';
        const patternSize = 30;
        for (let x = -patternSize + (ground.offset % patternSize); 
             x < this.canvas.width; 
             x += patternSize) {
            this.ctx.fillRect(x, groundY + 15, patternSize * 0.5, 15);
        }
    }
    
    draw() {
        if (!this.ctx) return;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Dynamic sky gradient based on score
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#001122');
        gradient.addColorStop(0.3, '#113344');
        gradient.addColorStop(0.7, '#225566');
        gradient.addColorStop(1, '#114455');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw stars
        this.ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 50; i++) {
            const x = (i * 37 + this.gameState.frameCount) % this.canvas.width;
            const y = (i * 23) % (this.canvas.height - 100);
            const brightness = 0.5 + 0.5 * Math.sin(Date.now() * 0.001 + i);
            this.ctx.globalAlpha = brightness * 0.5;
            this.ctx.fillRect(x, y, 2, 2);
        }
        this.ctx.globalAlpha = 1;
        
        // Draw game elements
        this.gameState.pipes.forEach(pipe => this.drawPipe(pipe));
        this.drawGround();
        this.drawBird();
        
        // Pause overlay
        if (this.gameState.isPaused) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
}

// ===== GAME CONTROLLER =====
class GameController {
    constructor() {
        this.state = new GameState();
        this.ui = new UIRenderer(GAME_CONFIG.CANVAS_ID, this.state);
        this.loopInterval = null;
        
        this.handleCanvasClick = this.handleCanvasClick.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.toggleSlowMo = this.toggleSlowMo.bind(this);
        this.pauseGame = this.pauseGame.bind(this);
        this.exitToMenu = this.exitToMenu.bind(this);
        this.gameLoop = this.gameLoop.bind(this);
        
        window.gameController = this;
    }
    
    init() {
        // Initialize AOS
        if (window.AOS) {
            AOS.init({
                duration: 1000,
                once: true,
                offset: 100
            });
        }
        
        // Initialize particles
        this.state.visuals.initParticles();
        
        // Get elements
        this.mobilePauseBtn = document.getElementById(GAME_CONFIG.MOBILE_PAUSE_ID);
        this.mobileExitBtn = document.getElementById(GAME_CONFIG.MOBILE_EXIT_ID);
        this.slowMoBtn = document.getElementById(GAME_CONFIG.SLOW_MO_BUTTON_ID);
        this.soundToggle = document.getElementById(GAME_CONFIG.SOUND_TOGGLE_ID);
        
        // Event listeners
        if (this.ui.canvas) {
            this.ui.canvas.addEventListener('click', this.handleCanvasClick);
            this.ui.canvas.addEventListener('touchstart', this.handleCanvasClick, { passive: false });
        }
        window.addEventListener('keydown', this.handleKeyDown);
        
        if (this.slowMoBtn) {
            this.slowMoBtn.addEventListener('click', this.toggleSlowMo);
        }
        
        if (this.mobilePauseBtn) {
            this.mobilePauseBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.pauseGame();
            });
        }
        
        if (this.mobileExitBtn) {
            this.mobileExitBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.exitToMenu();
            });
        }
        
        if (this.soundToggle) {
            this.soundToggle.addEventListener('click', () => {
                this.state.visuals.toggleSound();
            });
        }
        
        document.addEventListener('click', (e) => {
            if (e.target.id === 'exitButton' || e.target.closest('#exitButton')) {
                this.exitToMenu();
            }
        });
        
        this.ui.updateSlowMoButton();
        this.ui.showStartScreen();
        this.ui.draw();
    }
    
    handleCanvasClick(e) {
        e.preventDefault();
        
        if (!this.state.isPlaying) {
            this.startGame();
        } else if (!this.state.isPaused) {
            this.jump();
            this.state.visuals.playSound('jump');
            
            // Create ripple effect
            const rect = this.ui.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.state.visuals.createJumpRipple(x, y);
        }
    }
    
    handleKeyDown(e) {
        if (e.key === ' ' || e.key === 'Space' || e.key === 'ArrowUp') {
            e.preventDefault();
        }
        
        if (e.key === 'ArrowUp') {
            if (this.state.isPlaying && !this.state.isPaused) {
                this.jump();
                this.state.visuals.playSound('jump');
            } else if (!this.state.isPlaying) {
                this.startGame();
            }
        }
        
        if (e.key === ' ' || e.key === 'Space') {
            if (this.state.isPlaying) {
                this.pauseGame();
            } else {
                this.exitToMenu();
            }
        }
    }
    
    jump() {
        const factor = this.state.isSlowMo ? 0.75 : 1;
        this.state.bird.velocity = GAME_CONFIG.BIRD.JUMP_POWER * factor;
    }
    
    startGame() {
        if (this.loopInterval) {
            clearInterval(this.loopInterval);
            this.loopInterval = null;
        }
        
        this.state.reset();
        this.state.isPlaying = true;
        this.state.isPaused = false;
        
        this.ui.updateScoreDisplay();
        this.ui.updateSlowMoButton();
        this.ui.hideMessageBox();
        this.ui.setPauseVisible(false);
        
        this.loopInterval = setInterval(this.gameLoop, 1000 / GAME_CONFIG.FPS);
    }
    
    pauseGame() {
        if (!this.state.isPlaying) return;
        
        this.state.isPaused = !this.state.isPaused;
        this.ui.setPauseVisible(this.state.isPaused);
    }
    
    exitToMenu() {
        if (this.loopInterval) {
            clearInterval(this.loopInterval);
            this.loopInterval = null;
        }
        
        this.state.reset();
        this.ui.updateScoreDisplay();
        this.ui.updateSlowMoButton();
        this.ui.showStartScreen();
        this.ui.setPauseVisible(false);
        this.ui.draw();
    }
    
    gameOver() {
        this.state.isPlaying = false;
        this.state.isPaused = false;
        
        if (this.loopInterval) {
            clearInterval(this.loopInterval);
            this.loopInterval = null;
        }
        
        this.state.visuals.playSound('gameover');
        this.state.visuals.shakeScreen();
        
        this.ui.setPauseVisible(false);
        this.ui.showGameOver();
        this.ui.draw();
    }
    
    toggleSlowMo() {
        this.state.isSlowMo = !this.state.isSlowMo;
        this.state.updateLevelParams();
        this.ui.updateSlowMoButton();
    }
    
    updateBird() {
        if (this.state.isPaused) return;
        
        const factor = this.state.isSlowMo ? 0.5 : 1;
        this.state.bird.velocity += GAME_CONFIG.BIRD.GRAVITY * factor;
        this.state.bird.y += this.state.bird.velocity * factor;
        
        if (this.state.bird.velocity > GAME_CONFIG.BIRD.MAX_FALL) {
            this.state.bird.velocity = GAME_CONFIG.BIRD.MAX_FALL;
        }
    }
    
    updatePipes() {
        if (this.state.isPaused) return;
        
        this.state.pipes.forEach(p => p.x -= this.state.pipeConfig.speed);
        
        if (this.state.frameCount % this.state.pipeConfig.spawnRate === 0) {
            this.spawnPipe();
        }
        
        this.state.pipes = this.state.pipes.filter(
            p => p.x + this.state.pipeConfig.width > 0
        );
    }
    
    spawnPipe() {
        const cfg = this.state.pipeConfig;
        const minY = cfg.minGapY;
        const maxY = this.ui.canvas.height - this.state.ground.height - cfg.minGapY - cfg.gap;
        
        if (maxY > minY) {
            const y = Math.random() * (maxY - minY) + minY;
            this.state.pipes.push({
                x: this.ui.canvas.width,
                y: y,
                scored: false
            });
        }
    }
    
    updateGround() {
        if (this.state.isPaused) return;
        this.state.ground.offset += this.state.pipeConfig.speed;
        if (this.state.ground.offset >= this.ui.canvas.width) {
            this.state.ground.offset %= this.ui.canvas.width;
        }
    }
    
    checkCollisions() {
        if (this.state.isPaused) return false;
        
        const bird = this.state.bird;
        const cfg = this.state.pipeConfig;
        const canvas = this.ui.canvas;
        
        if (bird.y + bird.size > canvas.height - this.state.ground.height ||
            bird.y - bird.size < 0) {
            return true;
        }
        
        const radius = bird.size * 0.9;
        for (const pipe of this.state.pipes) {
            if (bird.x + radius > pipe.x && bird.x - radius < pipe.x + cfg.width) {
                if (bird.y - radius < pipe.y || bird.y + radius > pipe.y + cfg.gap) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    checkScore() {
        if (this.state.isPaused) return;
        
        for (const pipe of this.state.pipes) {
            if (!pipe.scored && pipe.x + this.state.pipeConfig.width < this.state.bird.x) {
                pipe.scored = true;
                const leveledUp = this.state.incrementScore();
                this.ui.updateScoreDisplay();
                this.state.visuals.playSound('score');
                
                if (leveledUp) {
                    this.state.visuals.playSound('levelup');
                }
            }
        }
    }
    
    gameLoop() {
        if (!this.state.isPlaying) return;
        
        if (!this.state.isPaused) {
            this.updateBird();
            this.updatePipes();
            this.updateGround();
            
            if (this.checkCollisions()) {
                this.gameOver();
                return;
            }
            
            this.checkScore();
            this.state.frameCount++;
        }
        
        this.ui.draw();
    }
}

// ===== Initialize Game =====
document.addEventListener('DOMContentLoaded', () => {
    try {
        const game = new GameController();
        game.init();
    } catch (error) {
        console.error('Failed to initialize game:', error);
    }
});