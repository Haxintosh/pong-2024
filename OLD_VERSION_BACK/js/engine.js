/**
 * @class Engine
 * @description Represents an animation engine that controls the refresh rate and frame updates.
 */
export class Engine {

    /**
     * @constructor Engine
     * @param {number} stableRefreshRate - fps cap
     * @param {function} animateCallback - callback
     * @description engine constructor
     * @returns {Engine}
     */
    constructor(stableRefreshRate, animateCallback) {
        this.stableRefreshRate = stableRefreshRate;
        this.minTimePerFrame = 1000 / stableRefreshRate;
        this.animateCallback = animateCallback;
        this.lastFrameTime = 0;
        this.lastTimeStamp = 0;
        this.fpsEstimate = 0;
        this.isRunning = true;
        return this;
    }


    /**
     * @returns {void}
     * @description starts the engine
     */
    init() {
        this.loop();
    }

    /**
     * @returns {number}
     * @description loop and limits framerate according to fps limit
     * (stable fps for different refresh rate because of rAF)
     */
    loop() {
        let deltaT = performance.now() - this.lastTimeStamp;
        if (!this.isRunning) deltaT = 0;
        if (deltaT >= Math.floor(this.minTimePerFrame)) {
            this.lastFrameTime = deltaT;
            this.lastTimeStamp = performance.now();
            this.fpsEstimate = 1000 / deltaT
            this.animateCallback(deltaT);
        }
        requestAnimationFrame(this.loop.bind(this));
        return deltaT
    }

    /**
     * @returns {boolean}
     * @description stops the engine
     */
    stop() {
        if (this.isRunning) {
            this.isRunning = false;
            return true;
        }
        return false;
    }

    /**
     * @returns {boolean}
     * @description starts the engine
     */
    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            return true;
        }
        return false;
    }

}