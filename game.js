// Game constants and ratios (relative to canvas size)
const PADDLE_WIDTH_RATIO = 0.15; // 15% of canvas width
const PADDLE_HEIGHT_RATIO = 0.025; // 2.5% of canvas height
const BALL_RADIUS_RATIO = 0.01; // 1% of canvas width
const BLOCK_WIDTH_RATIO = 0.04; // Reduced from 0.08 to 0.04 (half width)
const BLOCK_HEIGHT_RATIO = 0.015; // Reduced from 0.03 to 0.015 (half height)
const BLOCK_PADDING_RATIO = 0.005; // Reduced from 0.01 to 0.005 (half padding)
const BLOCK_ROWS = 10; // Doubled from 5 to 10
const BLOCK_COLS = 16; // Doubled from 8 to 16
const PADDLE_SPEED_RATIO = 0.01; // 1% of canvas width
const BALL_SPEED_INCREASE = 1.2; // 20% speed increase per level
const INITIAL_BLOCK_ROWS = 10;
const MAX_BLOCK_ROWS = 20; // Maximum number of rows to prevent overcrowding

// Get canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('scoreValue');

// Set canvas size based on window size
function resizeCanvas() {
    // Make the canvas 80% of the smaller screen dimension
    const size = Math.min(window.innerWidth * 0.8, window.innerHeight * 0.8);
    canvas.width = size;
    canvas.height = size * 0.75; // 4:3 aspect ratio

    // Update game measurements based on canvas size
    PADDLE_WIDTH = canvas.width * PADDLE_WIDTH_RATIO;
    PADDLE_HEIGHT = canvas.height * PADDLE_HEIGHT_RATIO;
    BALL_RADIUS = canvas.width * BALL_RADIUS_RATIO;
    BLOCK_WIDTH = canvas.width * BLOCK_WIDTH_RATIO;
    BLOCK_HEIGHT = canvas.height * BLOCK_HEIGHT_RATIO;
    BLOCK_PADDING = canvas.width * BLOCK_PADDING_RATIO;
    PADDLE_SPEED = canvas.width * PADDLE_SPEED_RATIO;

    // Reset paddle and ball positions
    paddle.width = PADDLE_WIDTH;
    paddle.height = PADDLE_HEIGHT;
    paddle.y = canvas.height - 40;
    paddle.x = canvas.width / 2 - PADDLE_WIDTH / 2;

    ball.radius = BALL_RADIUS;
    ball.speed = PADDLE_SPEED * 0.8;
    ball.x = paddle.x + paddle.width/2;
    ball.y = paddle.y - ball.radius;

    // Reinitialize blocks with new sizes
    initBlocks();
}

// Game objects with initial values
const paddle = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    dx: 0
};

const ball = {
    x: 0,
    y: 0,
    radius: 0,
    dx: 0,
    dy: 0,
    speed: 0
};

let blocks = [];
let score = 0;
let gameStarted = false;
let lives = 3;
let level = 1;
let currentBlockRows = INITIAL_BLOCK_ROWS;

// Sound system
const SOUNDS = {
    brick: new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'),
    paddle: new Audio('https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3')
};

// Initialize sounds
SOUNDS.brick.volume = 0.3;
SOUNDS.paddle.volume = 0.4;

// Function to play sound with error handling and sound overlap support
function playSound(soundType) {
    const sound = SOUNDS[soundType];
    if (sound) {
        // Reset the sound to start
        sound.currentTime = 0;
        // Play the sound with error handling
        sound.play().catch(error => {
            console.log("Error playing sound:", error);
        });
    }
}

// Initialize blocks
function initBlocks(rows = currentBlockRows) {
    blocks = [];
    const totalBlockWidth = BLOCK_COLS * (BLOCK_WIDTH + BLOCK_PADDING);
    const startX = (canvas.width - totalBlockWidth) / 2;

    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < BLOCK_COLS; j++) {
            blocks.push({
                x: startX + j * (BLOCK_WIDTH + BLOCK_PADDING),
                y: i * (BLOCK_HEIGHT + BLOCK_PADDING) + BLOCK_PADDING + 40,
                width: BLOCK_WIDTH,
                height: BLOCK_HEIGHT,
                color: `hsl(${i * 360/rows}, 70%, 50%)`
            });
        }
    }
}

// Draw functions
function drawPaddle() {
    ctx.fillStyle = '#0095DD';
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
}

function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#0095DD';
    ctx.fill();
    ctx.closePath();
}

function drawBlocks() {
    blocks.forEach(block => {
        ctx.fillStyle = block.color;
        ctx.fillRect(block.x, block.y, block.width, block.height);
    });
}

// Collision detection
function collisionDetection() {
    // Ball-Paddle collision
    if (ball.y + ball.radius > paddle.y &&
        ball.x > paddle.x &&
        ball.x < paddle.x + paddle.width) {
        ball.dy = -ball.dy;
        const hitPoint = (ball.x - (paddle.x + paddle.width/2)) / (paddle.width/2);
        ball.dx = hitPoint * ball.speed;
        playSound('paddle');  // Updated to use string key
    }

    // Ball-Block collision
    blocks = blocks.filter(block => {
        if (ball.x + ball.radius > block.x &&
            ball.x - ball.radius < block.x + block.width &&
            ball.y + ball.radius > block.y &&
            ball.y - ball.radius < block.y + block.height) {
            ball.dy = -ball.dy;
            score += 10;
            scoreElement.textContent = score;
            playSound('brick');  // Updated to use string key
            return false;
        }
        return true;
    });
}

// Movement and controls
function movePaddle() {
    if (paddle.x + paddle.dx > 0 && paddle.x + paddle.dx + paddle.width < canvas.width) {
        paddle.x += paddle.dx;
    }
}

function moveBall() {
    if (!gameStarted) {
        ball.x = paddle.x + paddle.width/2;
        ball.y = paddle.y - ball.radius;
        return;
    }

    ball.x += ball.dx;
    ball.y += ball.dy;

    // Wall collisions
    if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
        ball.dx = -ball.dx;
    }
    if (ball.y - ball.radius < 0) {
        ball.dy = -ball.dy;
    }

    // Bottom collision (lose life)
    if (ball.y + ball.radius > canvas.height) {
        lives--;
        document.getElementById('livesValue').textContent = lives;
        gameStarted = false;
        
        if (lives <= 0) {
            // Game Over - Reset everything
            lives = 3;
            score = 0;
            level = 1;
            currentBlockRows = INITIAL_BLOCK_ROWS;
            ball.speed = PADDLE_SPEED * 0.8; // Reset to initial speed
            scoreElement.textContent = score;
            document.getElementById('livesValue').textContent = lives;
            initBlocks(currentBlockRows);
        }
        
        ball.dx = ball.speed;
        ball.dy = -ball.speed;
    }
}

// Add new function to handle level completion
function nextLevel() {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    setTimeout(() => {
        level++;
        document.getElementById('levelValue').textContent = level;
        currentBlockRows = Math.min(INITIAL_BLOCK_ROWS + level, MAX_BLOCK_ROWS);
        ball.speed *= BALL_SPEED_INCREASE;
        gameStarted = false;
        initBlocks(currentBlockRows);
        
        ball.x = paddle.x + paddle.width/2;
        ball.y = paddle.y - ball.radius;
        ball.dx = ball.speed;
        ball.dy = -ball.speed;
    }, 500);
}

// Game loop
function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawPaddle();
    drawBall();
    drawBlocks();
    
    movePaddle();
    moveBall();
    collisionDetection();
    
    // Check if all blocks are cleared
    if (blocks.length === 0) {
        nextLevel();
    } else {
        requestAnimationFrame(update);
    }
}

// Event listeners
window.addEventListener('resize', () => {
    resizeCanvas();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') paddle.dx = -PADDLE_SPEED;
    if (e.key === 'ArrowRight') paddle.dx = PADDLE_SPEED;
    if (e.key === ' ' && !gameStarted) {
        gameStarted = true;
        ball.dx = ball.speed;
        ball.dy = -ball.speed;
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' && paddle.dx < 0) paddle.dx = 0;
    if (e.key === 'ArrowRight' && paddle.dx > 0) paddle.dx = 0;
});

canvas.addEventListener('mousemove', (e) => {
    const canvasRect = canvas.getBoundingClientRect();
    const relativeX = e.clientX - canvasRect.left;
    if (relativeX > 0 && relativeX < canvas.width) {
        paddle.x = relativeX - paddle.width/2;
    }
});

canvas.addEventListener('click', () => {
    if (!gameStarted) {
        gameStarted = true;
        ball.dx = ball.speed;
        ball.dy = -ball.speed;
    }
});

// Initialize the game
resizeCanvas();
update(); 