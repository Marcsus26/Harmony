import React, { useState } from 'react';
import '../../static/css/index.css';
import logo from "../../static/images/logo.svg";

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

// Suggestion Item: Shows the game that "interests" the user
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
            <div className={`status-dot ${status}`}></div>
            </div>
            <span>{name}</span>
        </div>
    )
};

// A single Server row in the panel
function ServerItem({ icon, name }) {
    return (
        <div className="server-item">
        <div className="server-icon">{icon}</div>
        <span>{name}</span>
        </div>
    )
};

function Sidebar({ friends, servers }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Sort friends so online ones are at the top
  const sortedFriends = [...friends].sort((a, b) => 
    a.status === 'online' ? -1 : 1
  );
  // Fake suggestions data
  const suggestions = [
    { id: 101, name: "Slayer_X", game: "Counter-Strike 2", avatar: logo },
    { id: 102, name: "DotaQueen", game: "Dota 2", avatar: logo },
  ];

  return (
    <div className="sidebar">
      <div className="top-sections">
        <div className="friends-section">
          <p className="sidebar-label">DIRECT MESSAGES</p>
          {sortedFriends.map(f => <FriendItem key={f.id} {...f} />)}
        </div>
        <SidebarDivider label="SUGGESTED PLAYERS" />

        <div className="suggestions-section">
          {suggestions.map(s => <SuggestedFriendItem key={s.id} {...s} />)}
        </div>
      </div>
      <div className={`server-panel ${isExpanded ? 'expanded' : ''}`}>
        <div className="panel-header" onClick={() => setIsExpanded(!isExpanded)}>
          <span>SERVERS</span>
          <span>{isExpanded ? '▼' : '▲'}</span>
        </div>
        {isExpanded && (
          <div className="server-list">
            {servers.map(server => (
              <ServerItem key={server.id} {...server} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;