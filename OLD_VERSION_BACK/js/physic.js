import {Vec2} from './utils.js';

export class PhysicalObject {
    static GRAVITY = new Vec2(0, 0); // 0.000005
    static MAX_SPEED = 1;

    /**
     * @constructor PhysicalObject
     * @description PhysicalObject constructor
     * @param position {Vec2} - position of the object
     * @param velocity {Vec2} - velocity of the object
     * @param acceleration {Vec2} - acceleration of the object
     * @param mass {number} - mass of the object
     * @param vertices {Array<Vec2>} - vertices of the object
     * @param shape {string} - shape of the object
     * @param style {string} - color of the object
     * @param userData {Object} - user data
     */
    constructor(position, velocity, acceleration, mass, vertices, userData, shape, style) {
        this.position = position;
        this.previousPosition = position;
        this.velocity = velocity;
        this.acceleration = acceleration;
        this.mass = mass;
        this.mechanicalEnergy = mass * velocity.length() * velocity.length() / 2;
        this.vertices = vertices;
        this.center = position.copy();
        this.userData = userData;
        // this.id = crypto.randomUUID();
        //optional TODO
        this.shape = shape;
        this.style = style;
        this.userData.restitution = 1;
        this.userData.physicType = 'dynamic';
    }

    update(deltaT) {
        if (this.userData.physicType === 'border') {
            const displacement = this.position.sub(this.previousPosition);
            for (let i = 0; i < this.vertices.length; i++) {
                this.vertices[i] = this.vertices[i].add(displacement);
            }

            this.previousPosition = this.position;

            this.center = this.center.add(displacement);

            this.mechanicalEnergy = this.mass * this.velocity.length() * this.velocity.length() / 2;
            return;
        }

        this.acceleration = this.acceleration.add(PhysicalObject.GRAVITY);
        this.velocity = this.velocity.add(this.acceleration.scale(deltaT));

        if (this.velocity.length() > PhysicalObject.MAX_SPEED) {
            this.velocity = this.velocity.normalize().scale(PhysicalObject.MAX_SPEED);
        }

        const newPosition = this.position.add(this.velocity.scale(deltaT));

        const displacement = newPosition.sub(this.position);

        for (let i = 0; i < this.vertices.length; i++) {
            this.vertices[i] = this.vertices[i].add(displacement);
        }

        this.position = newPosition;

        this.mechanicalEnergy = (this.mass * this.velocity.length() * this.velocity.length() / 2) + this.mass * PhysicalObject.GRAVITY.length() * (window.innerHeight - this.position.y);

        this.previousPosition = this.position;

        this.center = this.center.add(displacement);
    }
}

export function polygon(nSides, radius, x, y, style) {
    const vertices = [];
    const angle = Math.PI * 2 / nSides;
    for (let i = 0; i < nSides; i++) {
        vertices.push(new Vec2(x + radius * Math.cos(i * angle), y + radius * Math.sin(i * angle)));
    }
    let userData = {
        nSides: nSides,
        radius: radius,
    }
    return new PhysicalObject(new Vec2(x, y), new Vec2(0, 0), new Vec2(0, 0), 1, vertices, {data: userData}, 'polygon', style);
}

export function rectangle(width, height, x, y, style) {
    const vertices = [
        new Vec2(x, y),
        new Vec2(x + width, y),
        new Vec2(x + width, y + height),
        new Vec2(x, y + height)
    ];
    let userData = {
        width: width,
        height: height,
        nSides: 4,
    }
    let o = new PhysicalObject(new Vec2(x, y), new Vec2(0, 0), new Vec2(0, 0), 1, vertices, {data: userData}, 'rectangle', style);
    o.center = new Vec2(x + width / 2, y + height / 2);
    return o;}

export function circle(radius, x, y, style) {
    const vertices = [];
    const angle = Math.PI * 2 / 360;
    for (let i = 0; i < 360; i++) {
        vertices.push(new Vec2(x + radius * Math.cos(i * angle), y + radius * Math.sin(i * angle)));
    }
    let userData = {
        radius: radius,
        nSides: 360,
        center: new Vec2(x, y),
    }
    return new PhysicalObject(new Vec2(x, y), new Vec2(0, 0), new Vec2(0, 0), 1, vertices, {data: userData}, 'circle', style);
}

