import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Chat.css';

const SERVER_IP = 'http://127.0.0.1:4000';
const socket = io(SERVER_IP);
const getDate = function () {
    const date = new Date();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const fomattedTime = `${hours}:${minutes < 10 ? '0' : ''}${minutes}`;
    return fomattedTime;
}

const Chat = () => {
    const [msg, setMsg] = useState(''); // 定义消息状态
    const [file, setFile] = useState(null); // 定义文件状态
    const [chat, setChat] = useState([]); // 定义聊天记录状态
    const [nickname, setNickname] = useState(''); // 定义昵称状态
    const navigate = useNavigate(); // 用于导航

    useEffect(() => {
        const storedUserName = localStorage.getItem('username') || 'Guest'; // 获取存储的用户名
        setNickname(storedUserName); // 设置昵称为用户名

        const fetchChatHistory = async () => {
            try {
                const response = await axios.get(`${SERVER_IP}/chat-history`); // 获取聊天记录
                setChat(response.data); // 设置聊天记录状态
            } catch (err) {
                console.error('Error fetching chat history:', err);
            }
        };

        fetchChatHistory(); // 调用获取聊天记录函数

        socket.on('msg', (myData) => {
            setChat((prevChat) => [...prevChat, myData]); // 监听消息事件并更新聊天记录
        });

        return () => {
            socket.off('msg'); // 清除消息监听
        };
    }, []);

    const send = (e) => {
        e.preventDefault();
        const messageData = { userName: nickname, msg, sender: true, date_time: getDate() }; // 构建消息对象
        socket.emit('msg', messageData); // 发送消息
        setMsg(''); // 清空消息输入框
    };

    const handleFileChange = (e) => {
        setFile(e.target.files[0]); // 设置文件状态
    };

    const uploadFile = (e) => {
        e.preventDefault();
        if (!file) {
            alert('Please select a file to upload'); // 如果没有选择文件，显示提示
            return;
        }
        const formData = new FormData();
        formData.append('file', file); // 将文件添加到表单数据中
        axios.post(`${SERVER_IP}/upload`, formData).then(response => {
            const { fileName, filePath } = response.data;
            socket.emit('file-upload', { userName: nickname, fileName, filePath }); // 发送文件上传事件
            setFile(null); // 清空文件状态
        }).catch(err => {
            console.error('Error uploading file:', err);
        });
    };

    const handleLogout = () => {
        localStorage.removeItem('username'); // 移除存储的用户名
        navigate('/login'); // 导航到登录页面
    };

    const updateNickname = () => {
        const newNickname = prompt('Enter your new nickname:', nickname); // 提示输入新昵称
        if (newNickname) setNickname(newNickname); // 设置新昵称
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
                                <div className='chat-send-p'>{myData.msg}</div>
                                <div className='time'>{myData.date_time}</div>
                            </div>
                        ))}
                    </div>
                    <div onSubmit={send} className='chat-form'>
                        <input
                            type="text"
                            placeholder="Type your message here"
                            value={msg}
                            onChange={(e) => setMsg(e.target.value)}
                            required
                            className='chat-input'
                        />
                        <input
                            type="file"
                            id="fileInput"
                            onChange={handleFileChange}
                            className='chat-file'
                        />
                        <label htmlFor="fileInput" className="file-label">File</label>
                        <button type="submit" className='chat-send'>Send</button>
                    </div>
                </div>

            </div>


        </div>
    );
};

export default Chat;
