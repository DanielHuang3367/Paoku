class Game
{
    constructor()
    {
        this.player = document.getElementById('player');
        this.obstaclesContainer = document.getElementById('obstacles');
        this.itemsContainer = document.getElementById('items');
        this.startScreen = document.getElementById('startScreen');
        this.startBtn = document.getElementById('startBtn');
        this.scoreElement = document.getElementById('score');
        this.livesElement = document.getElementById('lives');
        this.comboElement = document.getElementById('combo');

        this.state = {
            isRunning: false,
            isJumping: false,
            isSliding: false,
            score: 0,
            lives: 3,
            combo: 0,
            speed: 5,
            lastObstacleTime: 0,
            lastItemTime: 0,
            shieldTime: 0,
            gameStartTime: 0
        };

        this.setupEventListeners();
    }

    setupEventListeners()
    {
        this.startBtn.addEventListener('click', () => this.startGame());
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') this.jump();
            if (e.code === 'ArrowDown') this.slide();
        });
    }

    startGame()
    {
        this.state = {
            isRunning: true,
            isJumping: false,
            isSliding: false,
            score: 0,
            lives: 3,
            combo: 0,
            speed: 5,
            lastObstacleTime: 0,
            lastItemTime: 0,
            shieldTime: 0,
            gameStartTime: Date.now()
        };

        this.startScreen.style.display = 'none';
        this.obstaclesContainer.innerHTML = '';
        this.itemsContainer.innerHTML = '';
        this.updateUI();
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    gameLoop()
    {
        if (!this.state.isRunning) return;

        this.updateDifficulty();
        this.generateObstacles();
        this.generateItems();
        this.updateGameElements();
        this.checkCollisions();
        this.updateUI();

        if (this.state.lives > 0) {
            requestAnimationFrame(this.gameLoop.bind(this));
        } else {
            this.gameOver();
        }
    }

    updateDifficulty()
    {
        const elapsedMinutes = (Date.now() - this.state.gameStartTime) / 30000;
        this.state.speed = 5 + Math.floor(elapsedMinutes) * 0.5;
        if (elapsedMinutes % 2 > 1.9 && this.state.lives > 1) {
            this.state.lives--;
        }
    }

    generateObstacles()
    {
        const now = Date.now();
        const baseInterval = 1500 / (1 + this.state.score / 500);
        const randomInterval = baseInterval * (0.8 + Math.random() * 0.4);

        if (now - this.state.lastObstacleTime > randomInterval) {
            this.createObstacle();
            this.state.lastObstacleTime = now;
        }
    }

    createObstacle()
    {
        const obstacle = document.createElement('div');
        obstacle.className = 'obstacle';

        const isHigh = Math.random() > 0.5;
        obstacle.classList.add(isHigh ? 'high' : 'low');

        obstacle.style.right = '0px';
        this.obstaclesContainer.appendChild(obstacle);
    }

    generateItems()
    {
        const now = Date.now();
        if (now - this.state.lastItemTime > 3000) {
            this.createItem();
            this.state.lastItemTime = now;
        }
    }

    createItem()
    {
        const item = document.createElement('div');
        item.className = 'item';

        const isCoin = Math.random() > 0.3;
        item.classList.add(isCoin ? 'coin' : 'shield');

        item.style.right = '0px';
        item.style.bottom = `${50 + Math.random() * 150}px`;
        this.itemsContainer.appendChild(item);
    }

    updateGameElements()
    {
        document.querySelectorAll('.obstacle').forEach(obs => {
            const currentRight = parseFloat(obs.style.right) || 0;
            obs.style.right = `${currentRight + this.state.speed}px`;

            if (currentRight > window.innerWidth) {
                obs.remove();
                this.state.combo++;
            }
        });

        document.querySelectorAll('.item').forEach(item => {
            const currentRight = parseFloat(item.style.right) || 0;
            item.style.right = `${currentRight + this.state.speed}px`;

            if (currentRight > window.innerWidth) {
                item.remove();
            }
        });

        if (this.state.shieldTime > 0) {
            this.state.shieldTime -= 16/1000;
            if (this.state.shieldTime <= 0) {
                this.player.style.boxShadow = 'none';
            }
        }
    }

   checkCollisions()
    {
        const playerRect = this.player.getBoundingClientRect();
        document.querySelectorAll('.obstacle').forEach(obs => {
            const obsRect = obs.getBoundingClientRect();

            if (this.isColliding(playerRect, obsRect)) {
                if (this.state.shieldTime <= 0) {
                    this.handleCollision();
                }
                obs.remove();
            }
        });

        document.querySelectorAll('.item').forEach(item => {
            const itemRect = item.getBoundingClientRect();

            if (this.isColliding(playerRect, itemRect)) {
                this.collectItem(item);
                item.remove();
            }
        });
    }

    isColliding(rect1, rect2)
    {
        return !(rect1.right < rect2.left || rect1.left > rect2.right || rect1.bottom < rect2.top || rect1.top > rect2.bottom);
    }

    handleCollision()
    {
        this.state.lives--;
        this.state.combo = 0;
        this.state.shieldTime = 1;
        this.player.style.boxShadow = '0 0 10px 5px rgba(255,255,0,0.7)';

        if (this.state.lives <= 0) {
            this.state.isRunning = false;
        }
    }

    collectItem(item)
    {
        if (item.classList.contains('coin')) {
            const comboBonus = 1 + this.state.combo * 0.2;
            this.state.score += Math.floor(10 * comboBonus);
        } else if (item.classList.contains('shield')) {
            this.state.shieldTime = 5;
            this.player.style.boxShadow = '0 0 10px 5px rgba(0,255,255,0.7)';
        }
    }

    jump()
    {
        if (!this.state.isRunning || this.state.isJumping) return;

        this.state.isJumping = true;
        let jumpHeight = 0;
        const jumpUp = () => {
            jumpHeight += 10;
            this.player.style.bottom = `${jumpHeight}px`;

            if (jumpHeight > 120) {
                clearInterval(upInterval);
                const downInterval = setInterval(() => {
                    jumpHeight -= 10;
                    this.player.style.bottom = `${jumpHeight}px`;

                    if (jumpHeight <= 0) {
                        clearInterval(downInterval);
                        this.player.style.bottom = '0px';
                        this.state.isJumping = false;
                    }
                }, 20);
            }
        };

        const upInterval = setInterval(jumpUp, 20);
    }

    slide()
    {
        if (!this.state.isRunning || this.state.isSliding || this.state.isJumping) return;

        this.state.isSliding = true;
        this.player.style.height = '40px';
        this.player.style.transform = 'translateY(40px)';

        setTimeout(() => {
            this.player.style.height = '80px';
            this.player.style.transform = 'translateY(0)';
            this.state.isSliding = false;
        }, 1000);
    }

    updateUI()
    {
        this.scoreElement.textContent = this.state.score;
        this.livesElement.textContent = this.state.lives;
        this.comboElement.textContent = this.state.combo;
    }

    gameOver()
    {
        this.startScreen.style.display = 'flex';
        this.startBtn.textContent = '重新开始';
        alert(`游戏结束！最终得分: ${this.state.score}`);
    }
}

let game = new Game();

function start_Game() {
    game.constructor();
}