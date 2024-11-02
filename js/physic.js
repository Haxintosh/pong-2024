import * as UTILS from './utils.js';
import {Vec2} from "./utils.js";

/**
 * objects taking into account physics
 * @class PhysicalObject
 * @description PhysicalObject class
 */
export class PhysicalObject {
    static GRAVITY = new UTILS.Vec2(0, 0); // 0.000005
    static MAX_SPEED = 0.5;
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
        this.shape = shape;
        this.style = style;
        this.userData.restitution = 1;
        this.userData.physicType = 'dynamic';
    }

    /**
     * updates the object's position based on the physics
     * @param {number} deltaT time elapsed since the last update
     */
    update(deltaT) {
            if (isNaN(deltaT) || deltaT <= 0) {
                console.error('Invalid deltaT:', deltaT);
                return;
            }

            this.acceleration = this.acceleration.add(PhysicalObject.GRAVITY); // External forces
            this.velocity = this.velocity.add(this.acceleration.scale(deltaT)); // Update velocity based on acceleration

            if (this.velocity.length() > PhysicalObject.MAX_SPEED) { // Limit the speed
                this.velocity = this.velocity.normalize().scale(PhysicalObject.MAX_SPEED);
            }

            const newPosition = this.position.add(this.velocity.scale(deltaT)); // Update position based on velocity

            if (isNaN(newPosition.x) || isNaN(newPosition.y)) { // BUGFIX: NaN position
                return;
            }

            this.position = newPosition;

            // update vertices based on the position
            if (this.shape === 'rectangle') {
                const halfWidth = this.userData.data.width / 2;
                const halfHeight = this.userData.data.height / 2;
                this.vertices = [
                    new UTILS.Vec2(this.position.x - halfWidth, this.position.y - halfHeight),
                    new UTILS.Vec2(this.position.x + halfWidth, this.position.y - halfHeight),
                    new UTILS.Vec2(this.position.x + halfWidth, this.position.y + halfHeight),
                    new UTILS.Vec2(this.position.x - halfWidth, this.position.y + halfHeight)
                ];
            }

            // Ek = 1/2 * m * v^2
            this.mechanicalEnergy = (this.mass * this.velocity.length() * this.velocity.length() / 2) + this.mass * PhysicalObject.GRAVITY.length() * (window.innerHeight - this.position.y);

            this.previousPosition = this.position;

            this.center = this.position.add(new UTILS.Vec2(this.userData.data.width / 2, this.userData.data.height / 2));
    }
}


/**
 * creates a circle object of class PhysicalObject
 * @param {number} x the x coordinate
 * @param {number} y the y coordinate
 * @param {number} radius the radius of the circle
 * @param {...} style the style for drawing
 * @returns {PhysicalObject}
 */
export function circle(x, y, radius, style) {
    const vertices = [];
    let userData = {
        radius: radius,
        nSides: 0,
        center: new UTILS.Vec2(x, y),
    }
    return new PhysicalObject(new UTILS.Vec2(x, y), new UTILS.Vec2(0, 0), new UTILS.Vec2(0, 0), 1, vertices, {data: userData}, 'circle', style);
}

/**
 * creates a polygon object of class PhysicalObject
 * @param {number} x the x coordinate
 * @param {number} y the y coordinate
 * @param {number} width width of the rect
 * @param {number} height height of the rect
 * @param {...} style
 * @returns {PhysicalObject}
 */
export function rectangle(x, y, width, height, style) {
    // create vertices
    let vertices = [
        new UTILS.Vec2(x, y),
        new UTILS.Vec2(x + width, y),
        new UTILS.Vec2(x + width, y + height),
        new UTILS.Vec2(x, y + height)
    ];
    let userData = {
        width: width,
        height: height,
        nSides: 4,
        center: new UTILS.Vec2(x + width / 2, y + height / 2),
        radius: height / 2
    }
    let o = new PhysicalObject(new UTILS.Vec2(x+width/2, y+height/2), new UTILS.Vec2(0, 0), new UTILS.Vec2(0, 0), 1, vertices, {data: userData}, 'rectangle', style);
    o.center = new UTILS.Vec2(x + width / 2, y + height / 2);
    return o;
}

