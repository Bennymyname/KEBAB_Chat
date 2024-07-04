import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './App.css';

// Connect to the server that is running on port 4000
const socket = io('http://localhost:4000');


function App() {
  const [msg, setMsg] = useState(''); // State for the message
  const [userName, setUserName] = useState(''); // State for the username
  const [chat, setChat] = useState([]); // State for the history of chats

  const send = (e) => {
    e.preventDefault(); // Have this will no have to enter username again after sending
    if (!userName) {
      alert('Please enter a username');
      return;
    }
    console.log(msg);
    socket.emit('msg', { userName, msg });
    setMsg(''); // reset the message input field after sending
  };

  useEffect(() => {
    // Add event listener for incoming messages
    // update chat state, when there is new message
    const messageListener = (myData) => {
      setChat((prevChat) => [...prevChat, myData]); 
    };

    socket.on('msg', messageListener);

    // Clean up the event listener when the component unmounts
    return () => {
      socket.off('msg', messageListener);
    };
  }, []);


  // blocks for sending message and displaying chat history
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
            <span><strong>{myData.userName}: </strong>{myData.msg}</span>
          </p>
        ))}
      </div>
    </div>
  );
}
//above is for display chat history


export default App;
