const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');
const settings = require('./settings.json');

app.use(express.static(path.join(__dirname, 'frontend')));

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || settings.port;
http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
