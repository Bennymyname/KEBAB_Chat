import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Chat.css';

const SERVER_IP = 'http://192.168.0.27:4000';
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
    const [fileName, setFileName] = useState('');
    const [chat, setChat] = useState([]);
    const [nickname, setNickname] = useState('');
    const navigate = useNavigate();
    const chatEndRef = useRef(null);

    useEffect(() => {
        const storedUserName = localStorage.getItem('username') || 'Guest';
        setNickname(storedUserName);

        const fetchChatHistory = async () => {
            try {
                const response = await axios.get(`${SERVER_IP}/chat-history`);
                setChat(response.data);
                scrollToBottom();
            } catch (err) {
                console.error('Error fetching chat history:', err);
            }
        };

        fetchChatHistory();

        socket.on('msg', (myData) => {
            setChat((prevChat) => [...prevChat, myData]);
        });

        socket.on('file-upload', (fileData) => {
            setChat((prevChat) => [...prevChat, fileData]);
        });

        return () => {
            socket.off('msg');
            socket.off('file-upload');
        };
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [chat]);

    const send = (e) => {
        e.preventDefault();
        const messageData = { userName: nickname, msg, sender: true, date_time: getDate() };
        socket.emit('msg', messageData);
        setMsg('');
    };

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setFileName(e.target.files[0].name);
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
            setFileName('');
            document.getElementById('fileInput').value = null;
        } catch (err) {
            console.error('Error uploading file:', err);
        }
    };

    const deleteFile = () => {
        setFile(null);
        setFileName('');
        document.getElementById('fileInput').value = null;
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
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

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
                    <div className="chatMsg">
                        {chat.map((myData, index) => (
                            <div key={index} className={myData.sender ? 'sender' : 'receiver'}>
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
                        <div ref={chatEndRef} />
                    </div>
                    <form onSubmit={send} className='chat-form'>
                        <div className='input-row'>
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
                        <div className='input-row'>
                            <input
                                type="file"
                                id="fileInput"
                                onChange={handleFileChange}
                                className='chat-file'
                            />
                            <label htmlFor="fileInput" className="file-label">File</label>
                            {fileName && (
                                <div className='file-info'>
                                    <span>{fileName}</span>
                                    <button onClick={deleteFile} className='delete-file'>Delete</button>
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
