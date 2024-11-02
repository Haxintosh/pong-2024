import * as PHYSIC from './physic.js';
import * as FW from './framework.js';
import * as UTILS from './utils.js';
import {Framework} from "./framework.js";

export class Pong {
    /**
     * pong game constructor
     * @param {Framework} framework the framework object to use
     * @param {...} options options for the game
     */
    constructor(framework, options) {
        this.framework = framework;
        this.options = options;
        this.balls = [];

        this.player1Score = 0;
        this.player2Score = 0;

        this.currentDT = 0;
        this.currentRandom = 0;
        this.volume = 0.5;

        this.init();
    }

    /**
     * initializes the game
     */
    init() {
        this.framework.engine.stop();
        this.player1 = this.framework.addRectangle(400, 300, this.options.paddleWidth, this.options.paddleHeight, this.options.paddleStyle);
        this.player1.position = new UTILS.Vec2(60, this.framework.canvas.height / 2);
        this.player1.userData.physicType = 'anchor';

        this.player2 = this.framework.addRectangle(this.framework.canvas.width - 60, this.framework.canvas.height / 2, this.options.paddleWidth, this.options.paddleHeight, this.options.paddleStyle);
        this.player2.userData.physicType = 'anchor';

        this.framework.paddle1 = this.player1;
        this.framework.paddle2 = this.player2;

        this.framework.volume = this.volume;

    }

    /**
     * starts a match based on the difficulty and type
     * @param {string} difficulty
     * @param {string} type
     */
    begin(difficulty, type) {
        this.framework.engine.start();
        // invalid difficulties
        if (difficulty !== 'easy' && difficulty !== 'medium' && difficulty !== 'hard' && difficulty !== 'impossible') return;
        this.difficulty = difficulty;
        if (type === 'single') {
            this.framework.isPaddle2Unlocked = true; // unlock since 2nd player is human
        }

        this.paramMap = {  // different parameters for different difficulties
            easy: {
                ballCount: 1,
                ballSpeed: 1,
                paddleSpeed: 5
            },
            medium: {
                ballCount: 2,
                ballSpeed: 2,
                paddleSpeed: 6
            },
            hard: {
                ballCount: 3,
                ballSpeed: 3,
                paddleSpeed: 6.5
            },
            impossible: {
                ballCount: 4,
                ballSpeed: 4,
                paddleSpeed: 6.5
            }
        }

        // add balls based on difficulty
        for (let i = 0; i < this.paramMap[difficulty].ballCount; i++) {
            let ball = this.framework.addBall(this.framework.canvas.width / 2, (this.framework.canvas.height / 2)*Math.random(), this.options.ballSize, this.options.ballStyle);
            ball.velocity = randomVector().scale(0.5); // ehh too hard for the player
            this.balls.push(ball);
        }

        // set the speed of the balls and paddles
        PHYSIC.PhysicalObject.MAX_SPEED = this.paramMap[difficulty].ballSpeed/2;
        Framework.PADDLE_SPEED = this.paramMap[difficulty].paddleSpeed;

        this.framework.callback = this.update.bind(this);
    }

    /**
     * updates the game state, synced with the engine
     * @param {number} deltaT
     */
    update(deltaT) {
        this.checkForGoal();
        this.scoreBoard();
        this.centerLine();
        if (!this.framework.isPaddle2Unlocked) { // only use ai if the 2nd paddle is locked (non-human)
            this.aiSolver();
        }

        // for the randomness of the ai
        this.currentDT += deltaT;
        if (this.currentDT > 500) {
            this.currentDT = 0;
            this.currentRandom = 0;
        }
    }

    /**
     * checks if a goal has been scored (if the ball is out of bounds)
     */
    checkForGoal() {
        // console.log(this.balls);
        for (let ball of this.balls) {
            if (ball.position.x < 0) { // if the ball is out of bounds
                this.player2Score++;
                FW.Framework.physicalObjects.splice(FW.Framework.physicalObjects.indexOf(ball), 1); // remove the ball from the physics engine
                this.balls.splice(this.balls.indexOf(ball), 1); // remove the ball from the balls array
                this.playSound('point.mp3');
            }
            if (ball.position.x > this.framework.canvas.width) {
                this.player1Score++;
                FW.Framework.physicalObjects.splice(FW.Framework.physicalObjects.indexOf(ball), 1);
                this.balls.splice(this.balls.indexOf(ball), 1);
                this.playSound('point.mp3');
            }

            if (this.player1Score === this.options.scoreToWin) { // win if enough score
                console.log('1 wins');
                this.win();
            }

            if (this.player2Score === this.options.scoreToWin) {
                console.log('2 wins!');
                this.win();
            }

            if (this.balls.length <= 0) { // add ball with a delay if there are no balls left
                setTimeout(() => {
                    this.addBackBall();
                }, 1000);
            }
        }
    }

    // DRAW
    /**
     * draws the center line
     */
    centerLine() {
        this.framework.ctx.beginPath();
        this.framework.ctx.strokeStyle = this.options.textStyle.strokeStyle;
        this.framework.ctx.lineWidth = this.options.centerLineStyle.lineWidth;
        this.framework.ctx.setLineDash(this.options.centerLineStyle.lineDash);
        this.framework.ctx.moveTo(this.framework.canvas.width / 2, 0);
        this.framework.ctx.lineTo(this.framework.canvas.width / 2, this.framework.canvas.height);
        this.framework.ctx.stroke();
        this.framework.ctx.closePath();
        this.framework.ctx.setLineDash([]);
    }

    /**
     * draws the score board
     */
    scoreBoard() {
        // the difficulty
        this.framework.ctx.textAlign = 'center';
        this.framework.ctx.font = '100px IBM';
        this.framework.ctx.fillStyle = '#D3D3D3';
        this.framework.ctx.fillText(capitalizeFirstLetter(this.difficulty), this.framework.canvas.width / 2 , this.framework.canvas.height/2);
        // the score
        this.framework.ctx.font = this.options.textStyle.font;
        this.framework.ctx.fillStyle = this.options.textStyle.fillStyle;
        this.framework.ctx.fillText(this.player1Score, this.framework.canvas.width / 4, 75);
        this.framework.ctx.fillText(this.player2Score, this.framework.canvas.width * 3 / 4, 75);
    }


    /**
     * called when a player wins
     */
    win() {
        this.playSound('end.mp3');
        setTimeout(() => {
                let messageElement = document.getElementById('winMessage');
                hideAll();
                document.querySelector('.gameOverContainer').style.visibility = "visible";
                document.querySelector('.gameOverContainer').style.zIndex = "100";
                if (this.player1Score === this.options.scoreToWin) {
                    messageElement.innerText = 'PLAYER 1 WON';
                }
                if (this.player2Score === this.options.scoreToWin) {
                    messageElement.innerText = 'PLAYER 2 WON';
                }

            }, 1000);
        this.framework.engine.stop();
    }

    /**
     * adds a ball back to the game
     */
    addBackBall(){
        let ball = this.framework.addBall(this.framework.canvas.width / 2, this.framework.canvas.height / 2, this.options.ballSize, this.options.ballStyle);
        ball.velocity = randomVector().scale(0.75);
        this.balls.push(ball);
    }

    /**
     * the ai solver for the 2nd player, see utils.js
     */
    aiSolver(){
        let closestBall = null;
        let minDistance = Infinity;

        // get the closest ball
        this.balls.forEach(ball => {
            const distance = this.player2.position.distance(ball.position);
            if (distance < minDistance) {
                minDistance = distance;
                closestBall = ball;
            }
        });

        if (closestBall) {
            let predictedY = UTILS.predictAtX( this.player2.position.x - 15, closestBall, this.framework.canvas.height);
            if (predictedY < 0 || !predictedY) predictedY = this.framework.canvas.height / 2;
            if (this.framework.options.debug) {
                this.framework.drawCircle(this.player2.position.x - 5, predictedY, 5, {
                    fillStyle: 'red',
                    strokeStyle: 'red',
                    lineWidth: 1
                });
            }
            // randomize the ai a bit depending on the difficulty
            if (this.difficulty === 'easy') {
                if (this.currentRandom === 0) {
                    this.currentRandom = Math.random() * 250 * randomSign();
                }
            } else if (this.difficulty === 'medium') {
                if (this.currentRandom === 0) {
                    this.currentRandom = Math.random() * 150 * randomSign();
                }
            } else if (this.difficulty === 'hard') {
                if (this.currentRandom === 0) {
                    this.currentRandom = Math.random() * 80 * randomSign();
                }
            }
            // move the paddle
            this.goToY(predictedY + this.currentRandom, this.player2);
        }

    }


    /**
     * moves the paddle to a certain y
     * @param {number} y the target y
     * @param {PhysicalObject} paddle the paddle to move
     */
    goToY(y, paddle) {
        if (paddle.position.y < y) {
            // no change if within speed
            if (paddle.position.y + Framework.PADDLE_SPEED > y || paddle.position.y + Framework.PADDLE_SPEED > this.framework.canvas.height) {
                return;
            }
            paddle.position.y += Framework.PADDLE_SPEED;
        } else if (paddle.position.y > y) {

            paddle.position.y -= Framework.PADDLE_SPEED;
        }
    }

    /**
     * plays a sound
     * @param {string} sound
     */
    playSound(sound) {
        let audio = new Audio('/audio/' + sound);
        audio.volume = this.volume*2;
        audio.play();
    }
}

// UTILS
/**
 * returns a random vector
 * @returns {Vec2}
 */
function randomVector() {
    // decide which side is random
    const side = Math.floor(Math.random() * 4);
    switch (side) {
        case 0:
            return new UTILS.Vec2(Math.random() * 2 - 1, -1);
        case 1:
            return new UTILS.Vec2(Math.random() * 2 - 1, 1);
        case 2:
            return new UTILS.Vec2(-1, Math.random() * 2 - 1);
        case 3:
            return new UTILS.Vec2(Math.random() * 2 - 1, Math.random() * 2 - 1);
    }
}

/**
 * capitalizes the first letter of a string
 * @param string
 * @returns {string}
 */
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * returns a random sign
 * @returns {number}
 */
function randomSign() {
    return Math.random() < 0.5 ? -1 : 1;
}

/**
 * hides all the html pages
 */
function hideAll() {
    let pages = ['.mainPageContainer', '.gameContainer', '.optionsContainer', '.gameEnterContainer', '.gameOverContainer'];
    for (let i = 0; i < pages.length; i++) {
        document.querySelector(pages[i]).style.visibility = "hidden";
        document.querySelector(pages[i]).style.zIndex = "-100";
    }
}

