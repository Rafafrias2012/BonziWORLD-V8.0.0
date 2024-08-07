const socket = io();

const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const currentTime = document.getElementById('current-time');

sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

function sendMessage() {
    if (messageInput.value.trim() !== '') {
        socket.emit('chat message', messageInput.value);
        messageInput.value = '';
    }
}

socket.on('chat message', (msg) => {
    // In this version, we're not displaying messages in a chat log
    console.log('Received message:', msg);
});

function updateTime() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    currentTime.textContent = `${hours}:${minutes}`;
}

updateTime();
setInterval(updateTime, 60000);
      
