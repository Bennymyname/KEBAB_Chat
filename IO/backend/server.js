const cors = require('cors');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fileUpload = require('express-fileupload');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*', // Allow requests from any origin
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
  }
});

const chatHistoryFile = path.join(__dirname, 'chatHistory.json');
const usersFile = path.join(__dirname, 'users.json');

// Load users from JSON file
let users = [];
if (fs.existsSync(usersFile)) {
  const data = fs.readFileSync(usersFile, 'utf8');
  users = data ? JSON.parse(data) : [];
}

// Apply CORS middleware globally
app.use(cors());
app.use(fileUpload());
app.use(express.static('uploads'));
app.use(express.json());

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

    res.json({ fileName: file.name, filePath: `${SERVER_IP}/uploads/${file.name}` });
  });
});

// Endpoint to clear chat history
app.post('/clear-chat', (req, res) => {
  fs.writeFileSync(chatHistoryFile, JSON.stringify([], null, 2));
  res.send('Chat history cleared');
});

// Endpoint to fetch chat history
app.get('/chat-history', (req, res) => {
  const chatHistory = loadChatHistory();
  res.json(chatHistory);
});

// User signup endpoint
app.post('/signup', async (req, res) => {
  const { username, password } = req.body;
  const userExists = users.find(user => user.username === username);

  if (userExists) {
    return res.status(400).json({ message: 'Username already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = { username, password: hashedPassword };
  users.push(newUser);
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));

  const token = jwt.sign({ username }, 'your_jwt_secret');
  res.json({ token });
});

// User login endpoint
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = users.find(user => user.username === username);

  if (!user) {
    return res.status(400).json({ message: 'Invalid username or password' });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: 'Invalid username or password' });
  }

  const token = jwt.sign({ username }, 'your_jwt_secret');
  res.json({ token });
});

const PORT = 4000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Listening to port ${PORT}`);
});
