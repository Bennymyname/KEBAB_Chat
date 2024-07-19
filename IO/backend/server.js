const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fileUpload = require('express-fileupload');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
  }
});

const chatHistoryFile = path.join(__dirname, 'chatHistory.json');
const usersFile = path.join(__dirname, 'users.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(fileUpload());
app.use(express.static('uploads'));

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

// Function to load users from JSON file
function loadUsers() {
  let users = [];
  if (fs.existsSync(usersFile)) {
    try {
      const data = fs.readFileSync(usersFile, 'utf8');
      users = data ? JSON.parse(data) : [];
    } catch (err) {
      console.error('Error parsing users JSON:', err);
    }
  }
  return users;
}

// Signup endpoint
app.post('/signup', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const users = loadUsers();
  const existingUser = users.find((user) => user.username === username);
  if (existingUser) {
    return res.status(400).json({ error: 'Username already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = { username, password: hashedPassword };
  users.push(newUser);

  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
  res.status(201).json({ message: 'User created successfully' });
});

// Login endpoint
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const users = loadUsers();
  const user = users.find((user) => user.username === username);
  if (!user) {
    return res.status(400).json({ error: 'Invalid username or password' });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(400).json({ error: 'Invalid username or password' });
  }

  res.status(200).json({ message: 'Login successful' });
});

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

const PORT = 4000;
server.listen(PORT, () => {
  console.log(`Listening to port ${PORT}`);
});
