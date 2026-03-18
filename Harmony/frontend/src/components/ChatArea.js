import React, { useState } from 'react';
import '../../static/css/index.css';

function ChatArea({ messages }) {
  return (
    <div className='App-backround'>
      <div className="chat-wrapper">
        <div className="message-list">
          {messages.map((msg) => (
            <Message key={msg.id} {...msg} />
          ))}
        </div>
        
        <div className="input-container">
          <input className="discord-input" placeholder="Message #general" />
        </div>
      </div>
    </div>
  );
};

function Message({ user, time, text, avatar }) {
  return (
    <div className="discord-message">
      <img src={avatar} alt="avatar" className="avatar" />
      <div className="message-content">
        <div className="message-header">
          <span className="username">{user}</span>
          <span className="timestamp">{time}</span>
        </div>
        <div className="text">{text}</div>
      </div>
    </div>
  )};

  export default ChatArea;