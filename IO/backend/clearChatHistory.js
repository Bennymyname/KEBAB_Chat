const fs = require('fs');
const path = require('path');

const chatHistoryFile = path.join(__dirname, 'chatHistory.json');

// Clear chat history by writing an empty array to the file
fs.writeFileSync(chatHistoryFile, JSON.stringify([], null, 2));
console.log('Chat history cleared');
