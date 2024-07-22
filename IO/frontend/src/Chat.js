import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Chat.css';

const SERVER_IP = 'http://172.30.224.133:4000';
const socket = io(SERVER_IP);
const getDate = function () {
    const date = new Date();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const formattedTime = `${hours}:${minutes < 10 ? '0' : ''}${minutes}`;
    return formattedTime;
}

const Chat = () => {
    const [msg, setMsg] = useState('');
    const [file, setFile] = useState(null);
    const [chat, setChat] = useState([]);
    const [nickname, setNickname] = useState('');
    const navigate = useNavigate();
    const chatBoxRef = useRef(null);

    useEffect(() => {
        const storedUserName = localStorage.getItem('username') || 'Guest';
        setNickname(storedUserName);

        const fetchChatHistory = async () => {
            try {
                const response = await axios.get(`${SERVER_IP}/chat-history`);
                setChat(response.data);
            } catch (err) {
                console.error('Error fetching chat history:', err);
            }
        };

        fetchChatHistory();

        socket.on('msg', (myData) => {
            setChat((prevChat) => [...prevChat, myData]);
            scrollToBottom();
        });

        socket.on('file-upload', (fileData) => {
            setChat((prevChat) => [...prevChat, fileData]);
            scrollToBottom();
        });

        return () => {
            socket.off('msg');
            socket.off('file-upload');
        };
    }, []);

    const send = (e) => {
        e.preventDefault();
        const messageData = { userName: nickname, msg, sender: true, date_time: getDate() };
        socket.emit('msg', messageData);
        setMsg('');
    };

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
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
            const response = await axios.post(`${SERVER_IP}/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            const { fileName, filePath } = response.data;
            const fileData = { userName: nickname, fileName, filePath, sender: true, date_time: getDate() };
            socket.emit('file-upload', fileData);
            setFile(null);
            document.getElementById('fileInput').value = null;
        } catch (err) {
            console.error('Error uploading file:', err);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('username');
        navigate('/login');
    };

    const updateNickname = () => {
        const newNickname = prompt('Enter your new nickname:', nickname);
        if (newNickname) setNickname(newNickname);
    };

    const scrollToBottom = () => {
        if (chatBoxRef.current) {
            chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [chat]);

    return (
        <div className="App">
            <div className="header">
                <div className="nickname-section">
                    Nickname: <button onClick={updateNickname} className="nickname-edit">{nickname}</button>
                </div>
                <button onClick={handleLogout} className="logout-button">Log out</button>
            </div>
            <div className='contain'>
                <div className='contain-main'>
                    <div className="chatMsg" ref={chatBoxRef}>
                        {chat.map((myData, index) => (
                            <div key={index} className={myData.userName === nickname ? 'sender' : 'receiver'}>
                                <strong className='chat-strong'>{myData.userName}</strong>
                                {myData.msg && <div className='chat-send-p'>{myData.msg}</div>}
                                {myData.filePath && (
                                    <div className='chat-send-file'>
                                        <a href={myData.filePath} target="_blank" rel="noopener noreferrer">
                                            {myData.fileName}
                                        </a>
                                    </div>
                                )}
                                <div className='time'>{myData.date_time}</div>
                            </div>
                        ))}
                    </div>
                    <form onSubmit={send} className='chat-form'>
                        <div className="input-row">
                            <input
                                type="text"
                                placeholder="Type your message here"
                                value={msg}
                                onChange={(e) => setMsg(e.target.value)}
                                required
                                className='chat-input'
                            />
                            <button type="submit" className='chat-send'>Send</button>
                        </div>
                        <div className="input-row">
                            <label htmlFor="fileInput" className="file-label">File</label>
                            <input
                                type="file"
                                id="fileInput"
                                onChange={handleFileChange}
                                className='chat-file'
                            />
                            {file && (
                            <div className="file-info">
                                <span>{file.name}</span>
                                <button onClick={() => setFile(null)} className='delete-file'>Remove</button>
                            </div>
                        )}
                            <button onClick={uploadFile} className='chat-upload'>Upload File</button>
                        </div>
                        
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Chat;
