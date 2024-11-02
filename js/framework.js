import * as ENGINE from './engine.js';
import * as UTIL from './utils.js';
import * as PHYSIC from './physic.js';

export class Framework {
    static physicalObjects = [];
    static PADDLE_SPEED = 5;

    constructor(canvas, width, height, options, styles) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = width;
        this.height = height;
        this.options = options;
        this.styles = styles;
        this.totalEk = 0;
        this.paddle1 = null;
        this.paddle2 = null;
        this.isPaddle2Unlocked = false;
        this.keys = {
            w: false,
            s: false,
            aUp: false,
            aDown: false
        };

        this.callback = null;
        this.volume = 0.5;
    }


    // INITIALIZATION
    init() {
        // starts the engine
        this.engine = new ENGINE.Engine(120, this.render.bind(this));
        this.engine.init();
        [this.canvas.height, this.canvas.width] = [this.height, this.width];
        this.parseOptions();
        this.attachEventListeners();
    }

    // RENDER METHODS
    render(deltaT) {
        this.clear();
        this.edge();
        let intersected = this.collisionCheck();
        if (intersected) {
            this.collisionResponse(intersected);
        }

        this.movePlayer();

        this.updatePhysics(deltaT);

        if (this.callback) {
            this.callback();
        }

        this.drawPhysicalObjects();


        // for (let i of intersected) {
        //     if (i[2]) {
        //         console.log("COLLISION NORMAL: ", i[2]);
        //         this.drawCollisionNormal(this.ctx, i[0], i[1], i[2]);
        //         this.engine.stop();
        //     }
        // }

        if (this.options.debug) {
            // console.log("FPS: ", this.engine.fpsEstimate);
            // console.log("Delta T: ", deltaT);
            // console.log("Engine: ", this.engine);
            // console.log("Physical Objects: ", Framework.physicalObjects);
        }
    }

    // Add to the physicalObjects array so that physics apply to them
    addPhysicalObject(physicalObject) {
        Framework.physicalObjects.push(physicalObject);
    }

    removePhysicalObject(physicalObject) {
        Framework.physicalObjects = Framework.physicalObjects.filter(i => i !== physicalObject);
    }


    // Wrappers for the physic.js functions
    addBall(x, y, radius, style) {
        let ball = PHYSIC.circle(x, y, radius, style);
        this.addPhysicalObject(ball);
        return ball;
    }

    addRectangle(x, y, width, height, style) {
        let rect = PHYSIC.rectangle(x, y, width, height, style);
        this.addPhysicalObject(rect);
        return rect;
    }

    movePlayer() {
        // moves the paddles depending on the key pressed
        if (this.keys.w) {
            this.paddle1.position.y -= Framework.PADDLE_SPEED;
        }
        if (this.keys.s) {
            this.paddle1.position.y += Framework.PADDLE_SPEED;
        }
        if (!this.isPaddle2Unlocked) return;
        if (this.keys.aUp) {
            this.paddle2.position.y -= Framework.PADDLE_SPEED;
        }
        if (this.keys.aDown) {
            this.paddle2.position.y += Framework.PADDLE_SPEED;
        }
    }

    // DRAW METHODS
    clear() {
        this.ctx.setLineDash([]);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = this.styles.backgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        if (this.options.debug) {
            this.ctx.fillStyle = this.styles.textColor;
            this.ctx.font = '20px Arial';
            this.ctx.fillText(`FPS: ${Math.round(this.engine.fpsEstimate)}`, 20, 20);

            this.ctx.fillText(`Total Ek: ${this.totalEk}`, 20, 40);

        }
    }

    // draws the physical objects
    drawPhysicalObjects() {
        for (let i of Framework.physicalObjects) {
            if (i.shape === "circle") { // special case for circle since they don't have vertices
                this.drawCircle(i.position.x, i.position.y, i.userData.data.radius, i.style);
                continue;
            }
            this.ctx.fillStyle = i.style.fillStyle;
            this.ctx.strokeStyle = i.style.strokeStyle;
            this.ctx.lineWidth = i.style.lineWidth;
            this.ctx.beginPath();
            // we go to each vertex and draw a line to the next vertex
            this.ctx.moveTo(i.vertices[0].x, i.vertices[0].y);
            for (let j = 1; j < i.vertices.length; j++) {
                this.ctx.lineTo(i.vertices[j].x, i.vertices[j].y);
            }
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();
        }
    }

    // circle drawing method
    drawCircle(x, y, radius, style) {
        this.ctx.fillStyle = style.fillStyle;
        this.ctx.strokeStyle = style.strokeStyle;
        this.ctx.lineWidth = style.lineWidth;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();

    }

    // debug function, normal from collision
    drawCollisionNormal(ctx, a, b, normal) {
        if (isNaN(a.position.x) || isNaN(a.position.y) || isNaN(b.position.x) || isNaN(b.position.y)) return;
        ctx.beginPath();
        ctx.moveTo(a.position.x, a.position.y);
        ctx.lineTo(a.position.x + normal.x * 100, a.position.y + normal.y * 100); // collision normal
        ctx.stroke();
    }


    // COLLISION HANDLING
    edge() {
        for (let i of Framework.physicalObjects) {
            if (i.userData.physicType === 'border') { // if it's a border, we don't do anything
                continue;
            }

            // // SIDE: RIGHT
            // if (i.position.x > this.canvas.width - i.userData.data.radius) {
            //     i.position.x = this.canvas.width - i.userData.data.radius;
            //     i.velocity.x *= -1;
            //     // SIDE: LEFT
            // } else if (i.position.x < i.userData.data.radius) {
            //     i.position.x = i.userData.data.radius;
            //     i.velocity.x *= -1;
            // }

            // inverts the velocity when the ball hits the wall
            // SIDE: BOTTOM
            if (i.position.y > this.canvas.height - i.userData.data.radius) {
                i.position.y = this.canvas.height - i.userData.data.radius;
                i.velocity.y *= -1;
                this.playSound('wall.wav'); // playsound when ball hits wall
                // SIDE: TOP
            } else if (i.position.y < i.userData.data.radius) {
                i.position.y = i.userData.data.radius;
                i.velocity.y *= -1;
                this.playSound('wall.wav');
            }
        }
    }

    collisionCheck() {
        // wrapper for the utils.js collision detection
        let intersecteds = [];
        for (const i of Framework.physicalObjects) {

            for (const j of Framework.physicalObjects) {
                if (i === j || j.userData.physicType === 'border') {
                    continue;
                }
                // special case for circle-rectangle collision
                if ((i.shape === 'circle' && j.shape === 'rectangle') || (i.shape === 'rectangle' && i.shape === 'circle')) {
                    if (j.shape === 'circle') {
                        [i, j] = [j, i]; // flips for the correct order
                    }
                    let isCollide = UTIL.circleRect(i, j);
                    if (isCollide.collision) {
                        intersecteds.push([i, j, isCollide.normal]);
                        continue;
                    } // push into array to resolve later
                }

                // circle-circle collision
                if (i.userData.data.radius + j.userData.data.radius > i.position.distance(j.position)) {
                    intersecteds.push([i, j]);
                }
            }
        }
        return intersecteds;
    }

    // wrapper for the utils.js resolveCollision
    collisionResponse(intersecteds) {
        for (const i of intersecteds) {
            let [a, b, normal] = i;
            // special case for circle-rectangle collision
            if ((a.shape === 'rectangle' || b.shape === 'rectangle') && normal) {
                if (a.shape === 'rectangle') { // flips for the correct orders
                    [a, b] = [b, a];
                }
                UTIL.resolveCircleRectCollision(a, b, normal);
                this.playSound('paddle.wav'); // playsound when ball hits paddle
                continue;
            }
            UTIL.resolveCollision(a, b, normal);
        }
    }

    updatePhysics(deltaT) {
        // calls the update method on each instanc of PhysicalObject
        let totalEk = 0;
        for (let i of Framework.physicalObjects) {
            i.update(deltaT);
            if (!isNaN(i.mechanicalEnergy)) {
                totalEk += i.mechanicalEnergy;
            }
        }
        this.totalEk = totalEk; // sum of Ek, check for energy conservation
    }

    // UTILS
    parseOptions() {
        // parse the different options for the framework class
        if (this.options) {
            if (this.options.adaptive) { // adapts to the window
                this.canvas.width = window.innerWidth;
                this.canvas.height = window.innerHeight;
                window.addEventListener('resize', () => {
                    this.canvas.width = window.innerWidth
                    this.canvas.height = window.innerHeight
                });
            }
            if (this.options.fixed) { // fixed width and height
                this.canvas.width = this.width;
                this.canvas.height = this.height;
            }
            if (this.options.centered) { // centered canvas
                this.canvas.style.position = 'absolute';
                this.canvas.style.top = '50%';
                this.canvas.style.left = '50%';
                this.canvas.style.transform = 'translate(-50%, -50%)';
            }
        }
    }

    attachEventListeners() {
        // event listeners for moving the paddles
        // keydown and up for smoother motion
        addEventListener('keydown', (e) => {
            if (e.key === 'w') {
                this.keys.w = true;
            }
            if (e.key === 's') {
                this.keys.s = true;
            }
            if (e.key === 'ArrowUp') {
                this.keys.aUp = true;
            }
            if (e.key === 'ArrowDown') {
                this.keys.aDown = true;
            }
        });

        addEventListener('keyup', (e) => {
            if (e.key === 'w') {
                this.keys.w = false;
            }
            if (e.key === 's') {
                this.keys.s = false;
            }
            if (e.key === 'ArrowUp') {
                this.keys.aUp = false;
            }
            if (e.key === 'ArrowDown') {
                this.keys.aDown = false;
            }
        });
    }
    // plays sound
    playSound(sound) {
        let audio = new Audio('/audio/' + sound);
        audio.volume = this.volume * 2;
        audio.play();
    }
}