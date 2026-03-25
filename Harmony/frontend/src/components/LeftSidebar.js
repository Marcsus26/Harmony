import React, { useState, useEffect } from 'react';
import '../../static/css/index.css';
import logo from "../../static/images/logo.svg";
import api from '../api.js';
import UserStatsChart from './UserStatChart.js';
import PendingRequestsModal from './PendingRequests.js';

// A simple divider component for the sidebar
function SidebarDivider({ label }) {
    return (
        <div className="sidebar-divider">
            <span className="divider-line"></span>
            {label && <span className="divider-label">{label}</span>}
            <span className="divider-line"></span>
        </div>
    )
};

// Suggestion Item: Shows the users that "interest" the user
function SuggestedFriendItem({ name, game, avatar }) {
    return (
        <div className="sidebar-item suggestion">
            <div className="avatar-wrapper">
            <img src={avatar} className="sidebar-avatar" alt={name} />
            <div className="status-dot online"></div>
            </div>
            <div className="item-details">
            <span className="username">{name}</span>
            <span className="current-game">Playing: {game}</span>
            </div>
            <button className="add-friend-btn">+</button>
        </div>
    )
};

// A single Friend row in the sidebar
function FriendItem({ name, status, avatar }) {
    return (
        <div className="sidebar-item">
            <div className="avatar-wrapper">
            <img src={avatar} className="sidebar-avatar" alt={name} />
            <div className={`status-dot ${status ? 'online' : 'offline'}`}></div>
            </div>
            <span>{name}</span>
        </div>
    )
};

function AddFriendModal({ isOpen, onClose }) {
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleSendRequest = async () => {
    try {
      const response = await api.post('/api/friends/send/', { username });
      setMessage({ text: response.data.message, type: 'success' });
      setUsername('');
      setTimeout(onClose, 1500);
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Something went wrong";
      setMessage({ text: errorMsg, type: 'error' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="friend-modal">
        <h3>Add a Friend</h3>
        <p>Enter their username to send a request.</p>
        
        <input 
          type="text" 
          placeholder="Username..." 
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        {message.text && (
          <div className={`message ${message.type}`}>{message.text}</div>
        )}

        <div className="friend-modal-actions">
          <button onClick={onClose} className="cancel-btn">Cancel</button>
          <button onClick={handleSendRequest} className="send-btn">Send Request</button>
        </div>
      </div>
    </div>
  );
}

function Sidebar({ friends, currentUser, userStats }) {

  // Fake suggestions data
  const suggestions = [
    { id: 101, name: "Slayer_X", game: "Counter-Strike 2", avatar: logo },
    { id: 102, name: "DotaQueen", game: "Dota 2", avatar: logo },
  ];

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isRequestsOpen, setIsRequestsOpen] = useState(false);
  const [requestCount, setRequestCount] = useState(0);

  const checkCount = async () => {
      const res = await api.get('/api/friends/pending/');
      setRequestCount(res.data.length);
    };
  // Poll for request count every minute
  useEffect(() => {
    checkCount();
    const interval = setInterval(checkCount, 60000);
    return () => clearInterval(interval);
  }, []);

  function handleRequestsClose() {
    setIsRequestsOpen(false); 
    checkCount();
  }

  return (
    <div className="sidebar">
      <div className="top-sections">
        <div className="friends-section">
          <p className="sidebar-label">DIRECT MESSAGES</p>
          {friends.map(f => <FriendItem key={f.id} name={f.username} status={f.is_online} avatar={f.avatar === '' ? logo : f.avatar} />)}
        </div>
        <SidebarDivider label="SUGGESTED PLAYERS" />

        <div className="suggestions-section">
          {suggestions.map(s => <SuggestedFriendItem key={s.id} {...s} />)}
        </div>

        {/* NOUVELLE SECTION : Statistiques Hexagonales */}
            <div className="panel stats-panel">
                <p className="sidebar-label">YOUR GAMING PROFILE</p>
                <UserStatsChart stats={userStats} />
            </div>
      </div>
      <button className="add-friend-trigger" onClick={() => setIsModalOpen(true)}>
            + Add Friend
      </button>
      <button className="add-friend-trigger" onClick={() => setIsRequestsOpen(true)}>
        Friend Requests
        {requestCount > 0 && <span className="badge">{requestCount}</span>}
      </button>
      <PendingRequestsModal isOpen={isRequestsOpen} onClose={handleRequestsClose} />
      <AddFriendModal 
      isOpen={isModalOpen} 
      onClose={() => setIsModalOpen(false)} 
    />
    </div>
  );
};

export default Sidebar;