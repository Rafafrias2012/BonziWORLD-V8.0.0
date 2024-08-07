const socket = io();

const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const currentTime = document.getElementById('current-time');
const loginWindow = document.getElementById('login-window');
const loginButton = document.getElementById('login-button');
const nicknameInput = document.getElementById('nickname');
const roomIdInput = document.getElementById('room-id');

let stage, bonzi, speechBubble, nametag;
let nickname = localStorage.getItem('nickname') || '';
let roomId = '';
let bonzis = {};
let nametags = {};

nicknameInput.value = nickname;

loginButton.addEventListener('click', login);
sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

function login() {
    nickname = nicknameInput.value.trim() || 'Default';
    localStorage.setItem('nickname', nickname);
    roomId = roomIdInput.value.trim() || 'Default';
    loginWindow.style.display = 'none';
    socket.emit('join', { nickname, roomId });
    initBonzi();
}

function initBonzi() {
    const canvas = document.getElementById('bonziCanvas');
    stage = new createjs.Stage(canvas);
    stage.enableMouseOver();

    createjs.Touch.enable(stage);

    const spriteSheet = new createjs.SpriteSheet({
        images: ['https://bonziworld.org/img/agents/purple.png'],
        frames: { width: 200, height: 160 },
        animations: {
            idle: 0,
            enter: [277, 302, 'idle', 0.25],
            leave: [16, 39, 'gone', 0.25],
            gone: 40
        }
    });

    bonzi = createBonzi(nickname, spriteSheet);
    bonzis[nickname] = bonzi;

    stage.addChild(bonzi);

    speechBubble = new createjs.Text('', '14px Arial', '#000000');
    speechBubble.visible = false;
    stage.addChild(speechBubble);

    createjs.Ticker.framerate = 30;
    createjs.Ticker.addEventListener('tick', tick);

    bonzi.gotoAndPlay('enter');

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
}

function createBonzi(nickName, spriteSheet) {
    const newBonzi = new createjs.Sprite(spriteSheet, 'idle');
    newBonzi.x = Math.random() * (stage.canvas.width - 200);
    newBonzi.y = Math.random() * (stage.canvas.height - 160);

    const newNametag = new createjs.Text(nickName, '12px Arial', '#000000');
    newNametag.textAlign = 'center';
    stage.addChild(newNametag);
    nametags[nickName] = newNametag;

    makeDraggable(newBonzi);

    return newBonzi;
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
    updateNametags();
    stage.update(event);
}

function updateSpeechBubble() {
    if (speechBubble.visible) {
        speechBubble.x = bonzi.x + 100;
        speechBubble.y = bonzi.y - speechBubble.getMeasuredHeight() - 10;
    }
}

function updateNametags() {
    for (let nick in nametags) {
        if (bonzis[nick]) {
            nametags[nick].x = bonzis[nick].x + 100;
            nametags[nick].y = bonzis[nick].y + 165;
        }
    }
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

socket.on('user joined', (data) => {
    console.log(`${data.nickname} joined the room`);
    if (data.nickname !== nickname && !bonzis[data.nickname]) {
        const newBonzi = createBonzi(data.nickname, bonzi.spriteSheet);
        bonzis[data.nickname] = newBonzi;
        newBonzi.gotoAndPlay('enter');
    }
});

socket.on('user left', (data) => {
    console.log(`${data.nickname} left the room`);
    if (bonzis[data.nickname]) {
        bonzis[data.nickname].gotoAndPlay('leave');
        bonzis[data.nickname].on('animationend', function() {
            if (this.currentAnimation === 'gone') {
                stage.removeChild(bonzis[data.nickname]);
                stage.removeChild(nametags[data.nickname]);
                delete bonzis[data.nickname];
                delete nametags[data.nickname];
            }
        });
    }
});

function updateTime() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    currentTime.textContent = `${hours}:${minutes}`;
}

function resizeCanvas() {
    const canvas = document.getElementById('bonziCanvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - 30;
    stage.updateViewport(canvas.width, canvas.height);
}

updateTime();
setInterval(updateTime, 60000);
