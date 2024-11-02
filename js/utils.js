/**
 * A class representing a 2D vector
 * @class Vec2
 */
export class Vec2 {
    /**
     * the constructor for a 2D vector
     * @constructor Vec2
     * @param {number} x
     * @param {number} y
     */
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    /**
     * adds two vectors
     * @param {Vec2} v
     * @returns {Vec2}
     */
    add(v) {
        return new Vec2(this.x + v.x, this.y + v.y);
    }

    /**
     * subtracts two vectors
     * @param {Vec2} v
     * @returns {Vec2}
     */
    sub(v) {
        return new Vec2(this.x - v.x, this.y - v.y);
    }

    /**
     * multiplies two vectors
     * @param {Vec2} v
     * @returns {number}
     */
    dot(v) {
        return this.x * v.x + this.y * v.y;
    }

    /**
     * cross product of two vectors
     * @param {Vec2} v
     * @returns {number}
     */
    cross(v) {
        return this.x * v.y - this.y * v.x;
    }

    /**
     * scales a vector by a scalar
     * @param {number} s
     * @returns {Vec2}
     */
    scale(s) {
        return new Vec2(this.x * s, this.y * s);
    }

    /**
     * returns the length of the vector
     * @returns {number}
     */
    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    /**
     * returns a copy of the vector
     * @returns {Vec2}
     */
    copy() {
        return new Vec2(this.x, this.y);
    }

    /**
     * returns the normalized vector
     * @returns {Vec2}
     */
    normalize() {
        let length = this.length();
        return new Vec2(this.x / length, this.y / length);
    }

    /**
     * calculates the distance between two vectors
     * @param {Vec2} v
     * @returns {number}
     */
    distance(v) {
        return Math.sqrt((this.x - v.x) ** 2 + (this.y - v.y) ** 2);
    }
}

/**
 * resolves collision between two circles while preserving total kinetic energy (100% elastic collision)
 * @param {PhysicalObject} a the first object
 * @param {PhysicalObject} b the second object
 * @param collisionNormal {Vec2} the collision normal // NOT USED FOR NOW
 */
export function resolveCollision(a, b, collisionNormal) {
    if (a.shape === 'rectangle' || b.shape === 'rectangle') { // circle-rectangle collision
        return;
    }
    // if (!collisionNormal) return;
    // console.log("VEC A BEFORE", as.velocity)
    // console.log("VEC B BEFORE", b.velocity)
    // console.log("RESOLVING", a, b)

    let distance = a.position.distance(b.position); // distance between the two circles

    if (distance < (a.userData.data.radius + b.userData.data.radius)) { // if the circles are colliding
        // the math follows pretty much https://en.wikipedia.org/wiki/Elastic_collision#Derivation_of_solution
        let normal = b.position.sub(a.position).normalize();
        let relativeVelocity = b.velocity.sub(a.velocity);
        let speed = relativeVelocity.dot(normal);

        if (speed > 0) return;

        let impulse = (2 * speed) / (a.mass + b.mass);
        let impulseVec = normal.scale(impulse);

        a.velocity = a.velocity.add(impulseVec.scale(b.mass));
        b.velocity = b.velocity.sub(impulseVec.scale(a.mass));


        if (isNaN(a.velocity.x) || isNaN(a.velocity.y)) {
            a.velocity = new Vec2(0, 0);
        }
        if (isNaN(b.velocity.x) || isNaN(b.velocity.y)) {
            b.velocity = new Vec2(0, 0);
        }


        a.position = a.position.add(normal.scale(0.1));
        b.position = b.position.sub(normal.scale(0.1));

        // console.log("VEC A AFTER", a.velocity)
        // console.log("VEC B AFTER", b.velocity)
    }
}

/**
 * resolves a circle & rect collision using the normal
 * @param {PhysicalObject} circle the circle
 * @param {PhysicalObject} rect the rectangle
 * @param {Vec2} normal the collision normal
 */
export function resolveCircleRectCollision(circle, rect, normal) {

    const relativeVelocity = circle.velocity;
    const speed = relativeVelocity.dot(normal);
    const impulse = -2 * speed;
    const impulseVec = normal.scale(impulse);

    circle.velocity = circle.velocity.add(impulseVec); // update the velocity of the circle using the impulse

    const closestPoint = getClosestPointOnRect(circle.position, rect);
    const penetrationDepth = circle.userData.data.radius - circle.position.distance(closestPoint); // to account for overlap

    circle.position = circle.position.add(normal.scale(penetrationDepth));
}

/**
 * checks if a circle and a rectangle are colliding
 * @param a {PhysicalObject} the circle
 * @param b {PhysicalObject} the rectangle
 * @returns {{collision: boolean, normal: Vec2}}
 */
export function circleRect(a, b) {
    const EPSILON = 0.0001; // margin of error
    // A IS THE CIRCLE
    let cx = a.position.x;
    let cy = a.position.y;
    let radius = a.userData.data.radius;

    // B IS THE RECTANGLE
    let rx = b.position.x - b.userData.data.width / 2;
    let ry = b.position.y - b.userData.data.height / 2;
    let rw = b.userData.data.width;
    let rh = b.userData.data.height;

    // nearest point rectangle to the circle center
    let testX = cx;
    let testY = cy;

    if (cx < rx) {
        testX = rx;
    } else if (cx > rx + rw) {
        testX = rx + rw;
    }
    if (cy < ry) {
        testY = ry;
    } else if (cy > ry + rh) {
        testY = ry + rh;
    }

    // dist between circle center & nearest point on rect
    let distX = cx - testX;
    let distY = cy - testY;
    let distance = Math.sqrt((distX * distX) + (distY * distY));

    let isColliding = distance <= (radius + EPSILON);

    let normal = new Vec2(0, 0);
    if (isColliding && distance > EPSILON) { // i love NaN
        normal.x = distX / distance;
        normal.y = distY / distance;
    }

    return {collision: isColliding, normal: normal };
}

/**
 * returns the closest point on a rectangle to a point
 * @param {Vec2} point the point
 * @param {PhysicalObject} rect the rectangle
 * @returns {Vec2} the closest point
 */
function getClosestPointOnRect(point, rect) {
    // see circle-rect collision above, same implementation
    // B IS THE RECTANGLE
    let rx = rect.position.x - rect.userData.data.width / 2;
    let ry = rect.position.y - rect.userData.data.height / 2;
    let rw = rect.userData.data.width;
    let rh = rect.userData.data.height;

    let testX = point.x;
    let testY = point.y;

    if (point.x < rx) {
        testX = rx;
    } else if (point.x > rx + rw) {
        testX = rx + rw;
    }
    if (point.y < ry) {
        testY = ry;
    } else if (point.y > ry + rh) {
        testY = ry + rh;
    }

    return new Vec2(testX, testY);
}


/**
 * gets the value of y given a x for the ball
 *
 * @param {number} targetX target x value
 * @param {PhysicalObject} obj the object to predict
 * @param {number} canvasHeight height of the canvas
 * @returns {number|null} predicted y value
 */
export function predictAtX(targetX, obj, canvasHeight) {
    if (!obj || !obj.velocity || !obj.position || obj.velocity.x <= 0 || !canvasHeight) {
        return null;
    }

    const timeToX = (targetX - obj.position.x) / obj.velocity.x;
    if (isNaN(timeToX) || timeToX < 0) {
        return null;
    }

    const radius = obj.userData.data.radius;
    const maxY = canvasHeight - radius;
    const minY = radius;

    let y = obj.position.y;
    let vy = obj.velocity.y;
    let t = 0;

    // simulate the ball's movement
    while (t < timeToX) {
        const timeToTop = (maxY - y) / vy;
        const timeToBottom = (minY - y) / vy;

        if (vy > 0) { // towards top wall
            if (t + timeToTop <= timeToX) {
                t += timeToTop;
                y = maxY;
                vy *= -1;
            } else {
                y += vy * (timeToX - t);
                t = timeToX;
            }
        } else { // towards bottom wall
            if (t + timeToBottom <= timeToX) {
                t += timeToBottom;
                y = minY;
                vy *= -1;
            } else {
                y += vy * (timeToX - t);
                t = timeToX;
            }
        }
        if(isNaN(y)){
            return null;
        }
    }
    return y;
}
