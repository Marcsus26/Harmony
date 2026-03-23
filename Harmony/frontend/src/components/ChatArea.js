import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import api from '../api.js';
import EmojiPicker from 'emoji-picker-react';
import logo from '../../static/images/logo.svg';
import '../../static/css/index.css';

function ChatArea({ messages, activeChannelId, onMessageSent }) {
  const [text, setText] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const scrollableContainerRef = useRef(null);
  const isFirstLoad = useRef(true);

  useEffect(() => {
    isFirstLoad.current = true;
  }, [activeChannelId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setShowPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    onMessageSent();

    const interval = setInterval(() => {
      onMessageSent();
    }, 3000); 

    return () => clearInterval(interval);
  }, [activeChannelId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
  };

  useEffect(() => {
    const container = scrollableContainerRef.current;
    if (container && messages.length > 0) {
      const { scrollTop, scrollHeight, clientHeight } = container;
      
      const isAtBottom = scrollHeight - scrollTop <= clientHeight + 150;
      
      if (isFirstLoad.current || isAtBottom) {
        scrollToBottom();
        isFirstLoad.current = false;
      }
    }
  }, [messages]);

  const onEmojiClick = (emojiData) => {
    setText(prev => prev + emojiData.emoji);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activeChannelId) return;

    try {
      await api.post(`/api/channels/${activeChannelId}/messages/send/`, {
        content: text
      });
      setText(""); // Clear the input
      if (onMessageSent) onMessageSent(); // Trigger refresh in App.js
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  const EmojiIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24">
    <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
  </svg>
);

  const showBar = (activeChannelId != null);
  
  return (
    <div className='App-backround'>
      <div className="chat-wrapper">
        <div className="message-list" ref={scrollableContainerRef}>
          {messages.map((msg) => (
          <div className="discord-message">
            <img src={msg.author_avatar === '' ? logo : msg.author_avatar} alt="avatar" className="avatar" />
            <div className="message-content">
              <div className="message-header">
                <span className="username">{msg.author_name}</span>
                <span className="timestamp">{new Date(msg.timestamp).toLocaleTimeString()}</span>
              </div>
              <div className="text">{msg.content}</div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
        </div>
        {activeChannelId && (
          <form className="input-container" onSubmit={handleSendMessage}>
            <div className="input-wrapper" ref={pickerRef}>
              {showPicker && (
                <div className="emoji-picker-container">
                  <EmojiPicker 
                    theme="dark" 
                    onEmojiClick={onEmojiClick}
                    autoFocusSearch={false}
                  />
                </div>
              )}
              <input 
                className="discord-input"
                placeholder="Message this channel"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <button 
                type="button" 
                className="emoji-button"
                onClick={() => setShowPicker(!showPicker)}
              >
                <EmojiIcon/>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ChatArea;