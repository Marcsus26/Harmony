import './App.css';
import logo from './logo.svg';
import React, { useState } from 'react';


// 1. Right Sidebar Components
const RightSidebar = ({ channels, suggestedGames }) => (
  <div className="right-sidebar">
    <div className="panel channel-panel">
      <p className="sidebar-label">SERVER CHANNELS</p>
      {channels.map(chan => (
        <div key={chan} className="channel-item"># {chan}</div>
      ))}
    </div>
    
    <div className="panel games-panel">
      <p className="sidebar-label">RECOMENDED FOR YOU</p>
      {suggestedGames.map(game => (
        <div key={game.title} className="game-card">
          <img src={game.img} alt="game" />
          <span>{game.title}</span>
        </div>
      ))}
    </div>
  </div>
);

// 2. User Account & Settings
const UserAccount = ({ avatar }) => {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="user-nav">
      <button className="avatar-btn" onClick={() => setShowSettings(!showSettings)}>
        <img src={avatar} alt="user" />
      </button>

      {showSettings && (
        <div className="settings-dropdown">
          <ul>
            <li>My Profile</li>
            <li>Steam Integration</li>
            <li>Privacy Settings</li>
            <li className="logout">Log Out</li>
          </ul>
        </div>
      )}
    </div>
  );
};

// A simple divider component for the sidebar
const SidebarDivider = ({ label }) => (
  <div className="sidebar-divider">
    <span className="divider-line"></span>
    {label && <span className="divider-label">{label}</span>}
    <span className="divider-line"></span>
  </div>
);

// Suggestion Item: Shows the game that "interests" the user
const SuggestedFriendItem = ({ name, game, avatar }) => (
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
);

// A single Friend row in the sidebar
const FriendItem = ({ name, status, avatar }) => (
  <div className="sidebar-item">
    <div className="avatar-wrapper">
      <img src={avatar} className="sidebar-avatar" alt={name} />
      <div className={`status-dot ${status}`}></div>
    </div>
    <span>{name}</span>
  </div>
);

// A single Server row in the panel
const ServerItem = ({ icon, name }) => (
  <div className="server-item">
    <div className="server-icon">{icon}</div>
    <span>{name}</span>
  </div>
);

const Sidebar = ({ friends, servers }) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

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

const ChatArea = ({ messages }) => {
  return (
    <div className='App-backround'>
      <div className="chat-wrapper">
        <div className="message-list">
          {messages.map((msg) => (
            <DiscordMessage key={msg.id} {...msg} />
          ))}
        </div>
        
        <div className="input-container">
          <input className="discord-input" placeholder="Message #general" />
        </div>
      </div>
    </div>
  );
};

function DiscordMessage({ user, time, text, avatar }) {
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
  );
}

function App() {

  const friends = [
    { id: 1, name: "Nelly", status: "online", avatar: logo },
    { id: 2, name: "User123", status: "offline", avatar: logo },
    { id: 3, name: "CodingWizard", status: "online", avatar: logo },
    { id: 4, name: "Gamer99", status: "online", avatar: logo },
  ];
  const fakeMessages = [
    { id: 1, user: "Nelly", time: "Today at 12:00 PM", text: "Yo, did you see the new update?", avatar: logo },
    { id: 2, user: "User123", time: "Today at 12:01 PM", text: "The CSS is finally working!", avatar: logo },
  ];

  const servers = [
    { id: 1, name: "The Dev Hub", icon: "DH" },
    { id: 2, name: "Gaming Zone", icon: "GZ" },
    { id: 3, name: "Study Group", icon: "SG" },
  ];

  const [channels] = useState(["general", "dev-log", "voice-chat"]);
  const [suggestedGames] = useState([
    { title: "Helldivers 2", img: logo },
    { title: "Elden Ring", img: logo }
  ]);

  return (
    <div className="app-container">
      <Sidebar friends={friends} servers={servers} />
      
      <main className="main-content">
        <UserAccount avatar={logo} />
        <ChatArea messages={fakeMessages} />
      </main>

      <RightSidebar channels={channels} suggestedGames={suggestedGames} />
    </div>
  );
}

export default App;