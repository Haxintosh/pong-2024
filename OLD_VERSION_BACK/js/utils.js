export class Vec2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    add(v) {
        return new Vec2(this.x + v.x, this.y + v.y);
    }

    sub(v) {
        return new Vec2(this.x - v.x, this.y - v.y);
    }

    dot(v) {
        return this.x * v.x + this.y * v.y;
    }

    cross(v) {
        return this.x * v.y - this.y * v.x;
    }

    scale(s) {
        return new Vec2(this.x * s, this.y * s);
    }

    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    copy() {
        return new Vec2(this.x, this.y);
    }

    normalize() {
        let length = this.length();
        return new Vec2(this.x / length, this.y / length);
    }

    random() {
        return new Vec2(Math.random(), Math.random());
    }

    distance(v) {
        return Math.sqrt((this.x - v.x) ** 2 + (this.y - v.y) ** 2);
    }
}

let globalIterationCount = 0;
const MAX_ITERATION_COUNT = 6; // BUGFIX: inf loop

export function furthestVertex(vertices, direction) {
    let max = -Infinity;
    let maxPoint = new Vec2(0, 0);
    for (let p of vertices) {
        let projection = p.dot(direction);
        if (projection > max) {
            max = projection;
            maxPoint = p;
        }
    }
    return maxPoint;
}

export function support(verticesA, verticesB, direction) {
    return furthestVertex(verticesA, direction).sub(furthestVertex(verticesB, direction.scale(-1)));
}

let direction = new Vec2(0, 0);
let simplexVertices = [] // Array<Vec2> shared by all functions
export function gjk(verticesA, verticesB) {
    // see https://medium.com/@mbayburt/walkthrough-of-the-gjk-collision-detection-algorithm-80823ef5c774
    globalIterationCount = 0; // BUG FIX
    simplexVertices = [];

    // support point 1: random direction
    direction = new Vec2(1, 0);
    let point = support(verticesA, verticesB, direction);
    simplexVertices.push(point);

    // support point 2: towards the origin
    direction = point.scale(-1);

    while (true) {
        let newPoint = support(verticesA, verticesB, direction);

        // if point does not pass the origin in the direction = no collision
        if (newPoint.dot(direction) <= 0) {
            return false; // no collision
        }

        simplexVertices.push(newPoint);

        if (checkSimplex()) {
            return true; // collision
        }
    }
}

function checkSimplex() {
    globalIterationCount++;
    if (globalIterationCount > MAX_ITERATION_COUNT) return true;
    if (simplexVertices.length === 2) {
        return checkLineSimplex();
    } else if (simplexVertices.length === 3) {
        return checkTriangleSimplex();
    }
    return false;
}

function checkLineSimplex() {
    let [A, B] = simplexVertices;
    let AB = B.sub(A);
    let AO = A.scale(-1);

    if (AB.dot(AO) > 0) {
        direction = AB.cross(AO) > 0 ? new Vec2(-AB.y, AB.x) : new Vec2(AB.y, -AB.x);
    } else {
        simplexVertices = [A];
        direction = AO;
    }
    return false;
}

function checkTriangleSimplex() {
    let [A, B, C] = simplexVertices;

    let AB = B.sub(A);
    let AC = C.sub(A);
    let AO = A.scale(-1);

    let ABPerp = AB.cross(AO) < 0 ? new Vec2(-AB.y, AB.x) : new Vec2(AB.y, -AB.x);
    let ACPerp = AC.cross(AO) < 0 ? new Vec2(-AC.y, AC.x) : new Vec2(AC.y, -AC.x);

    if (AB.dot(AO) > 0 && ABPerp.dot(AO) > 0) {
        simplexVertices = [A, B];
        direction = ABPerp;
    } else if (AC.dot(AO) > 0 && ACPerp.dot(AO) > 0) {
        simplexVertices = [A, C];
        direction = ACPerp;
    } else {
        return true;
    }

    return false;
}

export function epa(simplex, verticesA, verticesB) {
    // BROKEN!!!!!!!!!!!!!!!!!!
    // see https://winter.dev/articles/epa-algorithm/
    let minDistance = Infinity;
    let minIndex;
    let minNormal;

    while (true) {
        minDistance = Infinity;

        for (let i = 0; i < simplex.length; i++) {
            let j = (i + 1) % simplex.length;

            let vertexI = simplex[i];
            let vertexJ = simplex[j];

            let edge = vertexJ.copy().sub(vertexI);

            let normal = new Vec2(edge.y, -edge.x).normalize();

            let dist = normal.dot(vertexI);
            if (dist < 0) {
                dist = -dist;
                normal = normal.scale(-1);
            }

            if (dist < minDistance) {
                minDistance = dist;
                minNormal = normal;
                minIndex = j;
            }
        }

        let s = support(verticesA, verticesB, minNormal);
        let supportDist = minNormal.dot(s);

        if (Math.abs(supportDist - minDistance) <= 1e-4) {
            return {
                penetrationDepth: minDistance,
                minNormal: minNormal
            };
        } else {
            simplex.splice(minIndex, 0, s);
        }
    }
}

export function resolveCollision(a, b) { // TODO check the shapes are clipping extremely close, this causes the objects to jitter
    let dist = distance(a.position, b.position);
    let massSum = a.mass + b.mass;
    let impact = a.position.sub(b.position);
    let vDiff = a.velocity.sub(b.velocity);

    let top = 2 * b.mass * vDiff.dot(impact);
    let bottom = massSum * dist * dist;
    let scalar = top / bottom;
    let impulse = impact.scale(scalar);
    a.velocity = a.velocity.sub(impulse.scale(1 / a.mass));

    impulse = impact.scale(-scalar);
    b.velocity = b.velocity.sub(impulse.scale(1 / b.mass));
}

function distance(a, b) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}