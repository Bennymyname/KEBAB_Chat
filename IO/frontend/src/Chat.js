import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Chat.css';

const SERVER_IP = 'http://192.168.0.27:4000';
const socket = io(SERVER_IP);

const Chat = () => {
  const [msg, setMsg] = useState('');
  const [userName, setUserName] = useState('');
  const [chat, setChat] = useState([]);
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Load username from local storage or set default
    const storedUserName = localStorage.getItem('username') || 'Guest';
    setUserName(storedUserName);

    // Fetch chat history
    const fetchChatHistory = async () => {
      try {
        const response = await axios.get(`${SERVER_IP}/chat-history`);
        setChat(response.data);
      } catch (err) {
        console.error('Error fetching chat history:', err);
      }
    };

    fetchChatHistory();

    // Add event listener for incoming messages
    const messageListener = (myData) => {
      setChat((prevChat) => [...prevChat, myData]);
    };

    const fileListener = (fileData) => {
      setChat((prevChat) => [...prevChat, fileData]);
    };

    socket.on('msg', messageListener);
    socket.on('file-upload', fileListener);

    // Clean up the event listener when the component unmounts
    return () => {
      socket.off('msg', messageListener);
      socket.off('file-upload', fileListener);
    };
  }, []);

  const send = (e) => {
    e.preventDefault();
    if (!userName) {
      alert('Please enter a username');
      return;
    }
    console.log(msg);
    socket.emit('msg', { userName, msg });
    setMsg('');
  };

  const uploadFile = async (e) => {
    e.preventDefault();
    if (!file) {
      alert('Please select a file to upload');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post(`${SERVER_IP}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data) {
        const { fileName, filePath } = res.data;
        socket.emit('file-upload', { userName, fileName, filePath });
        setFileName('');
        setFile(null);
        setPreview(null);
        document.getElementById('fileInput').value = null; // Reset file input
      } else {
        console.error('No response data');
      }
    } catch (err) {
      console.error('Error uploading file:', err);
      if (err.response) {
        console.error('Response error:', err.response.data);
      }
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setFileName(selectedFile.name);

    if (selectedFile && selectedFile.type.startsWith('image/')) {
      const previewUrl = URL.createObjectURL(selectedFile);
      setPreview(previewUrl);
    } else {
      setPreview(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    navigate('/login');
  };

  return (
    <div className="App">
      <div className="header">
        <h1>Chat program using Socket.io</h1>
        <button onClick={handleLogout} className="logout-button">Logout</button>
      </div>
      <form onSubmit={send} className="chat">
        <input
          type="text"
          required
          placeholder="Username here..."
          name="username"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
        />
        <input
          type="text"
          required
          placeholder="Message here..."
          name="msg"
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
        />
        <button type="submit">Send</button>
      </form>
      <form onSubmit={uploadFile} className="chat">
        <input
          type="file"
          id="fileInput"
          onChange={handleFileChange}
        />
        <button type="submit">Upload</button>
      </form>
      <div className="chatMsg">
        {chat.map((myData, index) => (
          <p key={index}>
            {myData.timestamp && <span>{new Date(myData.timestamp).toLocaleString()}</span>}
            {myData.msg && <span><strong>{myData.userName}:</strong> {myData.msg}</span>}
            {myData.fileName && (
              <span>
                <strong>{myData.userName}:</strong> 
                {myData.filePath.match(/\.(jpeg|jpg|gif|png)$/) != null ? (
                  <img src={`${SERVER_IP}/${myData.fileName}`} alt={myData.fileName} style={{ maxWidth: '200px', maxHeight: '200px' }} />
                ) : (
                  <a href={`${SERVER_IP}/${myData.fileName}`} target="_blank" rel="noopener noreferrer">{myData.fileName}</a>
                )}
              </span>
            )}
          </p>
        ))}
      </div>
    </div>
  );
};

export default Chat;
