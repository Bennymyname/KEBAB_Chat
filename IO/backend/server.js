

// Importing express and socket.io
const app = require('express')();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin: '*',
  }
});

// server listening to incoming connections
io.on('connection', (socket) => {
  console.log('Connected');
  // listening to msg
  socket.on('msg', (mydata) => {

    // when msg is received, send it to all the clients
    console.log('Server received: ', mydata);
    io.emit('msg', mydata);
  });
});

// server listening to port 4000, so clients should all use 4000
server.listen(4000, () => {
  console.log('Listening to port 4000');
});
