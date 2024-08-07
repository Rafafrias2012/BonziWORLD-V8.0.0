const socket = io();

const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const currentTime = document.getElementById('current-time');
const loginWindow = document.getElementById('login-window');
const loginButton = document.getElementById('login-button');
const nicknameInput = document.getElementById('nickname');
const roomIdInput = document.getElementById('room-id');

let stage, bonzi, speechBubble, nametag;
let nickname = '';
let roomId = '';

loginButton.addEventListener('click', login);
sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

function login() {
    nickname = nicknameInput.value.trim() || 'Default';
    roomId = roomIdInput.value.trim() || 'Default';
    loginWindow.style.display = 'none';
    socket.emit('join', { nickname, roomId });
    initBonzi();
}

function initBonzi() {
    const canvas = document.getElementById('bonziCanvas');
    stage = new createjs.Stage(canvas);

    const spriteSheet = new createjs.SpriteSheet({
        images: ['https://bonziworld.org/img/agents/purple.png'],
        frames: { width: 200, height: 160 },
        animations: {
            idle: 0,
            enter: [277, 302, 'idle', 0.25],
            leave: [16, 39, 40, 0.25]
        }
    });

    bonzi = new createjs.Sprite(spriteSheet, 'idle');
    bonzi.x = Math.random() * (canvas.width - 200);
    bonzi.y = Math.random() * (canvas.height - 160);

    stage.addChild(bonzi);

    speechBubble = new createjs.Text('', '14px Arial', '#000000');
    speechBubble.visible = false;
    stage.addChild(speechBubble);

    nametag = new createjs.Text(nickname, '12px Arial', '#000000');
    nametag.visible = true;
    stage.addChild(nametag);

    makeDraggable(bonzi);

    createjs.Ticker.framerate = 30;
    createjs.Ticker.addEventListener('tick', tick);

    bonzi.gotoAndPlay('enter');
}

function makeDraggable(obj) {
    obj.on('mousedown', function(evt) {
        this.offset = { x: this.x - evt.stageX, y: this.y - evt.stageY };
    });

    obj.on('pressmove', function(evt) {
        this.x = evt.stageX + this.offset.x;
        this.y = evt.stageY + this.offset.y;
    });
}

function tick(event) {
    updateSpeechBubble();
    updateNametag();
    stage.update(event);
}

function updateSpeechBubble() {
    if (speechBubble.visible) {
        speechBubble.x = bonzi.x + 100;
        speechBubble.y = bonzi.y - speechBubble.getMeasuredHeight() - 10;
    }
}

function updateNametag() {
    nametag.x = bonzi.x + 100 - nametag.getMeasuredWidth() / 2;
    nametag.y = bonzi.y + 160;
}

function sendMessage() {
    if (messageInput.value.trim() !== '') {
        socket.emit('chat message', { nickname, message: messageInput.value });
        speak(messageInput.value);
        messageInput.value = '';
    }
}

function speak(text) {
    speechBubble.text = text;
    speechBubble.visible = true;
    setTimeout(() => { speechBubble.visible = false; }, 3000);

    let url = "https://www.tetyys.com/SAPI4/SAPI4?text=" + encodeURIComponent(text) + "&voice=" + encodeURIComponent("Sam") + "&pitch=150&speed=100";
    var audio = new Audio(url);
    audio.play();
}

socket.on('chat message', (data) => {
    console.log(`${data.nickname}: ${data.message}`);
});

function updateTime() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    currentTime.textContent = `${hours}:${minutes}`;
}

updateTime();
setInterval(updateTime, 60000);

window.addEventListener('resize', () => {
    const canvas = document.getElementById('bonziCanvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - 30;
    stage.updateViewport(canvas.width, canvas.height);
});
