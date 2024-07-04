const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fileUpload = require('express-fileupload');
const path = require('path');
const cors = require('cors'); // Import cors
const fs = require('fs'); // Import fs

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*', // Allow all origins for Socket.io
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
  }
});

// Apply CORS middleware globally
app.use(cors()); // Use cors middleware to allow cross-origin requests
app.use(fileUpload());
app.use(express.static('uploads')); // Serve uploaded files

// Ensure the uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

io.on('connection', (socket) => {
  console.log('Connected');
  socket.on('msg', (mydata) => {
    console.log('Server received: ', mydata);
    io.emit('msg', mydata);
  });

  socket.on('file-upload', (fileData) => {
    io.emit('file-upload', fileData);
  });
});

app.post('/upload', (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }

  let file = req.files.file;
  let uploadPath = path.join(__dirname, 'uploads', file.name);

  file.mv(uploadPath, (err) => {
    if (err) {
      return res.status(500).send(err);
    }

    res.json({ fileName: file.name, filePath: `http://192.168.0.27:4000/${file.name}` });
  });
});

const PORT = 4000;
server.listen(PORT, () => {
  console.log(`Listening to port ${PORT}`);
});
