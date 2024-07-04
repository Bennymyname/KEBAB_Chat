import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './App.css'; // Import the CSS file

const socket = io('http://192.168.0.27:4000'); // Replace with your server's IP address

function App() {
  const [msg, setMsg] = useState('');
  const [userName, setUserName] = useState('');
  const [chat, setChat] = useState([]);

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

  useEffect(() => {
    // Add event listener for incoming messages
    const messageListener = (myData) => {
      setChat((prevChat) => [...prevChat, myData]);
    };

    socket.on('msg', messageListener);

    // Clean up the event listener when the component unmounts
    return () => {
      socket.off('msg', messageListener);
    };
  }, []);

  return (
    <div className="App">
      <h1>Chat program using Socket.io</h1>
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
      <div className="chatMsg">
        {chat.map((myData, index) => (
          <p key={index}>
            <strong>{myData.userName}:</strong> <span>{myData.msg}</span>
          </p>
        ))}
      </div>
    </div>
  );
}

export default App;
