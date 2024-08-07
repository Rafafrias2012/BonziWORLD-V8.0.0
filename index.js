const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');
const settings = require('./settings.json');

app.use(express.static(path.join(__dirname, 'frontend')));

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('join', (data) => {
        socket.join(data.roomId);
        socket.nickname = data.nickname;
        socket.roomId = data.roomId;
        console.log(`${socket.nickname} joined room ${socket.roomId}`);
        io.to(socket.roomId).emit('user joined', { nickname: socket.nickname });
    });

    socket.on('chat message', (data) => {
        io.to(socket.roomId).emit('chat message', { nickname: socket.nickname, message: data.message });
    });

    socket.on('disconnect', () => {
        console.log(`${socket.nickname} disconnected`);
        io.to(socket.roomId).emit('user left', { nickname: socket.nickname });
    });
});

const PORT = process.env.PORT || settings.port;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
