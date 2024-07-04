const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*', // Allow all origins
  }
});

io.on('connection', (socket) => {
  console.log('Connected');
  socket.on('msg', (mydata) => {
    console.log('Server received: ', mydata);
    io.emit('msg', mydata);
  });
});

const PORT = 4000; // Choose your preferred port
server.listen(PORT, () => {
  console.log(`Listening to port ${PORT}`);
});
