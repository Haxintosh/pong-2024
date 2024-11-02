import * as ENGINE from './engine.js';
import * as UTIL from './utils.js';
import * as PHYSIC from './physic.js';

export class Framework {
    static physicalObjects = [];

    constructor(canvas, width, height, options, styles) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = width;
        this.height = height;
        this.options = options;
        this.styles = styles;
    }

    init() {
        this.engine = new ENGINE.Engine(120, this.render.bind(this));
        this.engine.init();
        [this.canvas.height, this.canvas.width] = [this.height, this.width];
        this.parseOptions();
    }

    render(deltaT) {
        this.clear();
        this.edge();
        let intersected = this.collisionCheck();
        if (intersected) {
            this.collisionResponse(intersected);
        }

        this.updatePhysics(deltaT);
        this.outOfBoundCheck()

        this.drawPhysicalObjects();

        if (this.options.debug) {
            // console.log("FPS: ", this.engine.fpsEstimate);
            // console.log("Delta T: ", deltaT);
            // console.log("Engine: ", this.engine);
            // console.log("Physical Objects: ", Framework.physicalObjects);
        }
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = this.styles.backgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        if (this.options.debug) {
            this.ctx.fillStyle = this.styles.textColor;
            this.ctx.font = '20px Arial';
            this.ctx.fillText(`FPS: ${Math.round(this.engine.fpsEstimate)}`, 20, 20);
        }
    }

    parseOptions() {
        if (this.options) {
            if (this.options.adaptive) {
                this.canvas.width = window.innerWidth;
                this.canvas.height = window.innerHeight;
                window.addEventListener('resize', () => {
                    this.canvas.width = window.innerWidth;
                    this.canvas.height = window.innerHeight;
                });
            }
            if (this.options.centered) {
                this.canvas.style.position = 'absolute';
                this.canvas.style.top = '50%';
                this.canvas.style.left = '50%';
                this.canvas.style.transform = 'translate(-50%, -50%)';
            }
        }
    }

    // I/O METHODS
    addPhysicalObject(physicalObject) {
        Framework.physicalObjects.push(physicalObject);
    }

    addBorder() {
        let border = new PHYSIC.rectangle(this.canvas.width, 10, 0, 0, {
            fillStyle: 'black',
            strokeStyle: 'black',
            lineWidth: 2
        });
        border.userData.physicType = 'border';
        let border2 = new PHYSIC.rectangle(10, this.canvas.height, 0, 0, {
            fillStyle: 'black',
            strokeStyle: 'black',
            lineWidth: 2
        });
        border2.userData.physicType = 'border';
        let border3 = new PHYSIC.rectangle(this.canvas.width, 10, 0, this.canvas.height - 10, {
            fillStyle: 'black',
            strokeStyle: 'black',
            lineWidth: 2
        });
        border3.userData.physicType = 'border';
        let border4 = new PHYSIC.rectangle(10, this.canvas.height, this.canvas.width - 10, 0, {
            fillStyle: 'black',
            strokeStyle: 'black',
            lineWidth: 2
        });
        border4.userData.physicType = 'border';

        this.addPhysicalObject(border);
        this.addPhysicalObject(border2);
        this.addPhysicalObject(border3);
        this.addPhysicalObject(border4);
    }

    createPolygon(nSides, radius, x, y, style) {
        let o = new PHYSIC.polygon(nSides, radius, x, y, style);
        this.addPhysicalObject(o);
        return o;
    }

    createRectangle(width, height, x, y, style) {
        let o = new PHYSIC.rectangle(width, height, x, y, style);
        this.addPhysicalObject(o);
        return o;
    }

    createCircle(radius, x, y, style) {
        let o = new PHYSIC.circle(radius, x, y, style);
        this.addPhysicalObject(o);
        return o;
    }


    // ANIMATE METHODS
    drawPhysicalObjects() {
        for (let i of Framework.physicalObjects) {
            this.ctx.fillStyle = i.style.fillStyle;
            this.ctx.strokeStyle = i.style.strokeStyle;
            this.ctx.beginPath();
            this.ctx.moveTo(i.vertices[0].x, i.vertices[0].y);
            for (let j = 1; j < i.vertices.length; j++) {
                this.ctx.lineTo(i.vertices[j].x, i.vertices[j].y);
            }
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();
            this.drawCircle(i.center.x, i.center.y, 2, {
                fillStyle: 'black',
                strokeStyle: 'black',
                lineWidth: 2
            })
        }
    }

    drawCircle(x, y, radius, style) {
        this.ctx.fillStyle = style.fillStyle;
        this.ctx.strokeStyle = style.strokeStyle;
        this.ctx.lineWidth = style.lineWidth;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
    }

    edge() {
        for (let i of Framework.physicalObjects) {
            if (i.userData.physicType === 'border') {
                continue;
            }

            if (i.position.x > this.canvas.width - i.userData.data.radius) {
                i.position.x = this.canvas.width - i.userData.data.radius;
                i.velocity.x *= -1;
            } else if (i.position.x < i.userData.data.radius) {
                i.position.x = i.userData.data.radius;
                i.velocity.x *= -1;
            }

            if (i.position.y > this.canvas.height - i.userData.data.radius) {
                i.position.y = this.canvas.height - i.userData.data.radius;
                i.velocity.y *= -1;
            } else if (i.position.y < i.userData.data.radius) {
                i.position.y = i.userData.data.radius;
                i.velocity.y *= -1;
            }
        }
    }

    collisionCheck() {
        if (Framework.physicalObjects.length < 2) {
            return;
        }
        let intersected = [];

        for (let i = 0; i < Framework.physicalObjects.length; i++) {
            for (let j = i + 1; j < Framework.physicalObjects.length; j++) {
                if (Framework.physicalObjects[i].userData.physicType === 'border' && Framework.physicalObjects[j].userData.physicType === 'border') {
                    continue;
                }
                let isCollide = UTIL.gjk(Framework.physicalObjects[i].vertices, Framework.physicalObjects[j].vertices);
                if (isCollide) {
                    // Framework.physicalObjects[i].userData.collisionResp = isCollide; // EPA currently hangs the code, so we using basic collision response for now
                    // Framework.physicalObjects[j].userData.collisionResp = isCollide;
                    // let collisionInfo = UTIL.epa(isCollide.simplexVertices, Framework.physicalObjects[i].vertices, Framework.physicalObjects[j].vertices);
                    intersected.push([Framework.physicalObjects[i], Framework.physicalObjects[j]]);
                }
            }
        }
        return intersected;
    }

    collisionResponse(intersected) {
        for (let i of intersected) {
            let [a, b, collisionInfo] = i;
            UTIL.resolveCollision(a, b);
        }
    }

    updatePhysics(deltaT) {
        for (let i of Framework.physicalObjects) {
            i.update(deltaT);
        }
    }

    outOfBoundCheck() {
        // for (let i of Framework.physicalObjects) {
        //     if (i.position.x > this.canvas.width + i.userData.data.radius || i.position.x < -i.userData.data.radius || i.position.y > this.canvas.height + i.userData.data.radius || i.position.y < -i.userData.data.radius) {
        //         Framework.physicalObjects.splice(Framework.physicalObjects.indexOf(i), 1);
        //     }
        //     if (i.mechanicalEnergy < 0.001) {
        //         i.velocity = new UTIL.Vec2(0, 0);
        //         i.userData.physicType = 'border';
        //     }
        // }

    }
}