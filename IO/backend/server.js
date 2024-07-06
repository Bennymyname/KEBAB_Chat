const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fileUpload = require('express-fileupload');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*', // Allow all origins for Socket.io
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
  }
});

const chatHistoryFile = path.join(__dirname, 'chatHistory.json');

// Apply CORS middleware globally
app.use(cors());
app.use(fileUpload());
app.use(express.static('uploads')); // Serve uploaded files

// Ensure the uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Function to load chat history from JSON file
function loadChatHistory() {
  let chatHistory = [];
  if (fs.existsSync(chatHistoryFile)) {
    try {
      const data = fs.readFileSync(chatHistoryFile, 'utf8');
      chatHistory = data ? JSON.parse(data) : [];
    } catch (err) {
      console.error('Error parsing chat history JSON:', err);
    }
  }
  return chatHistory;
}

io.on('connection', (socket) => {
  console.log('Connected');

  // Load and send chat history to new clients
  const chatHistory = loadChatHistory();
  socket.emit('history', chatHistory);

  socket.on('msg', (mydata) => {
    const messageData = { ...mydata, timestamp: new Date().toISOString() };
    const chatHistory = loadChatHistory();
    chatHistory.push(messageData);
    fs.writeFileSync(chatHistoryFile, JSON.stringify(chatHistory, null, 2));
    io.emit('msg', messageData);
  });

  socket.on('file-upload', (fileData) => {
    const fileUploadData = { ...fileData, timestamp: new Date().toISOString() };
    const chatHistory = loadChatHistory();
    chatHistory.push(fileUploadData);
    fs.writeFileSync(chatHistoryFile, JSON.stringify(chatHistory, null, 2));
    io.emit('file-upload', fileUploadData);
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

    res.json({ fileName: file.name, filePath: `http://192.168.0.27:4000/uploads/${file.name}` });
  });
});

// Endpoint to clear chat history
app.post('/clear-chat', (req, res) => {
  fs.writeFileSync(chatHistoryFile, JSON.stringify([], null, 2));
  res.send('Chat history cleared');
});

const PORT = 4000;
server.listen(PORT, () => {
  console.log(`Listening to port ${PORT}`);
});
