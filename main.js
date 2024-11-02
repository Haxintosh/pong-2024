import './style.css';
import * as FW from './js/framework.js';
import * as GAME from './js/game.js';

import * as B_UTILS from './OLD_VERSION_BACK/js/utils.js';
import * as B_FW from './OLD_VERSION_BACK/js/framework.js';


let canvas = document.getElementById('gameCanvas');
let mainFw = new FW.Framework(canvas, 800, 600, {adaptive: false, centered: true, debug: false, fixed:true}, {
    backgroundColor: 'white',
    textColor: 'black'
});

mainFw.init();
setUpBackground();
let options = {
    ballSize : 20,
    ballStyle : {
        fillStyle: '#ffcc00',
        strokeStyle: '#ffcc00',
        lineWidth: 1
    },
    paddleWidth: 10,
    paddleHeight: 80,
    paddleStyle: {
        fillStyle: 'black',
        strokeStyle: 'black',
        lineWidth: 1
    },
    paddle1UpKey: 'w',
    paddle1DownKey: 's',
    paddle2UpKey: 'ArrowUp',
    paddle2DownKey: 'ArrowDown',

    textStyle: {
        fillStyle: 'black',
        strokeStyle: 'black',
        lineWidth: 1,
        font: '50px IBM'
    },

    centerLineStyle: {
        strokeStyle: 'black',
        lineWidth: 5,
        lineDash: [20, 20]
    },

    scoreToWin: 5,
}

let mainGame = null;
let isAudioInit = false;
let bgm = null;


function setUpBackground(){
    let canvas = document.getElementById('backgroundCanvas');
    let bgFw = new B_FW.Framework(canvas, 800, 600, {adaptive: true, centered: true, debug: false}, {
        backgroundColor: 'white',
        textColor: 'black'
    });
    bgFw.init();
    for (let i = 0; i < 12; i++) {
        let randomShape = bgFw.createPolygon(6, 30, Math.random() * 500, Math.random() * 500, {
            fillStyle: "#ffcc00",
            strokeStyle: 'black',
            lineWidth: 2
        });
        randomShape.velocity = new B_UTILS.Vec2(-Math.random(), Math.random());
    }
}

let currentGamemode = null;
let currentDifficulty = null;

let difficulty_buttons = document.getElementsByClassName('difficulty');
let gamemode_buttons = document.getElementsByClassName('gamemodeButton');
let isGameStarted = false;
let startButton = document.getElementById('go');
startButton.disabled = true;
startButton.style.color = '#696969';
startButton.addEventListener('click', () => {
    if (startButton.disabled) return;
    if (isGameStarted) return;
    isGameStarted = true;
    startButton.style.color = '#ffffff';
    startButton.style.backgroundColor = '#000000';
    setTimeout(() => {
        hideAll();
        document.querySelector('.gameContainer').style.visibility = "visible";
        document.querySelector('.gameContainer').style.zIndex = "100";
        if (currentGamemode === 'pvp') currentGamemode = 'single';
        updateOptions();
        mainGame = new GAME.Pong(mainFw, options);
        mainGame.begin(currentDifficulty, currentGamemode);
    }, 500);
});

for (let button of difficulty_buttons){
    button.addEventListener('click', () => {
        currentDifficulty = button.id;
        resetButtons(difficulty_buttons);
        button.style.backgroundColor = '#ffcc00';
        checkEnableStart();
    });
}

for (let button of gamemode_buttons){
    button.addEventListener('click', () => {
        currentGamemode = button.id;
        resetButtons(gamemode_buttons);
        button.style.backgroundColor = '#ffcc00';
        checkEnableStart();
    });
}

function resetButtons(buttons) {
    for (let button of buttons){
        button.style.backgroundColor = '#f9f9f9';
    }
}

function checkEnableStart(){
    if (currentGamemode && currentDifficulty){
        document.getElementById('go').disabled = false;
        document.getElementById('go').style.color = 'black';
    }
}

function hideAll() {
    let pages = ['.mainPageContainer', '.gameContainer', '.optionsContainer', '.gameEnterContainer', '.gameOverContainer'];
    for (let i = 0; i < pages.length; i++) {
        document.querySelector(pages[i]).style.visibility = "hidden";
        document.querySelector(pages[i]).style.zIndex = "-100";
    }
}


// HANDLE VALUE SLIDERS
let volume = document.getElementById('volumeSlider').innerHTML;
let volumeSlider = document.getElementById('volumeSlider');

volumeSlider.oninput = function() {
    volume = this.value;
    if (mainGame) {
        mainGame.volume = volume/100;
        mainGame.framework.volume = volume/100;
    }
    if (bgm) {
        bgm.volume = this.value/200;
    }
}

function getConfig() {
    let ballSize = document.getElementById('ballSizeSlider').value;

    let paddleWidth = document.getElementById('paddleWidthSlider').value;

    let paddleHeight = document.getElementById('paddleHeightSlider').value;

    return {
        ballSize: ballSize,
        paddleWidth: paddleWidth,
        paddleHeight: paddleHeight
    }
}

function updateOptions() {
    let config = getConfig();
    if (config.ballSize == 5 || config.paddleWidth == 5 || config.paddleHeight == 5) return;
    options.ballSize = parseInt(config.ballSize);
    options.paddleWidth = parseInt(config.paddleWidth);
    options.paddleHeight = parseInt(config.paddleHeight);
    console.log(options);
    return options;
}

addEventListener('mousedown', () => {
    if (!isAudioInit) {
        playBGM();
        isAudioInit = true;
    }
});
function playBGM() {
    bgm = new Audio('/audio/bgm.mp3');
    bgm.loop = true;
    bgm.volume = 0.5/2;
    bgm.play();
}