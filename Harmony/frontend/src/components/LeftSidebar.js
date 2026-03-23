import React, { useState, useEffect } from 'react';
import '../../static/css/index.css';
import logo from "../../static/images/logo.svg";
import api from '../api.js';

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

function Sidebar({ friends, servers, onServerCreated, activeServerId, onSelectServer }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [iconUrl, setIconUrl] = useState('');
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [isEditing, setIsEditing] = useState(false);

  const currentServer = servers.find(s => s.id === activeServerId);

  const toggleFriend = (id) => {
    setSelectedFriends(prev => 
      prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
    );
  };

  const openCreateModal = () => {
    setIsEditing(false);
    setName('');
    setIconUrl('');
    setSelectedFriends([]);
    setShowModal(true);
  };


  const openEditModal = () => {
    if (!currentServer) return;
    setIsEditing(true);
    setName(currentServer.name);
    setIconUrl(currentServer.icon_url || '');
    setSelectedFriends(currentServer.users || []); 
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await api.patch(`/api/servers/${activeServerId}/update-members/`, {
          users: selectedFriends,
          name: name,
          icon_url: iconUrl
        });
      } else {
        // POST new server
        await api.post('/api/servers/create/', {
          name: name,
          icon_url: iconUrl,
          users: selectedFriends
        });
      }
      
      setShowModal(false);
      if (onServerCreated) onServerCreated(); // Refresh the list
    } catch (err) {
      alert(isEditing ? "Failed to update server" : "Failed to create server");
    }
  };

  // Sort friends so online ones are at the top
  const sortedFriends = [...friends].sort((a, b) => 
    a.status === 'online' ? -1 : 1
  );
  // Fake suggestions data
  const suggestions = [
    { id: 101, name: "Slayer_X", game: "Counter-Strike 2", avatar: logo },
    { id: 102, name: "DotaQueen", game: "Dota 2", avatar: logo },
  ];

  const getServerInitials = (name) => {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .substring(0, 3)
    .toUpperCase();
  };

  useEffect(() => {
    onServerCreated();
  }, []);

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
        <div className="panel-header">
          <div onClick={() => setIsExpanded(!isExpanded)} style={{cursor: 'pointer'}}>
            <span>SERVERS</span>
            <span>{isExpanded ? ' ▼' : ' ▲'}</span>
          </div>
          <div className="panel-buttons">
            {activeServerId && (
              <button className="edit-server-btn" onClick={openEditModal} title="Manage Server">⚙️</button>
            )}
            <button className="add-server-btn" onClick={openCreateModal}>+</button>
          </div>
        </div>

        {isExpanded && (
          <div className="server-list">
            {servers.map(server => (
              <div key={server.id} 
                onClick={() => onSelectServer(server.id)} 
                className={`server-item ${activeServerId === server.id ? 'active' : ''}`}
                title={server.name}>
                <div className="server-icon">
                  {server.icon_url ? <img src={server.icon_url} alt="" /> : <span>{getServerInitials(server.name)}</span>}
                </div>
                <div className='server-name'>{server.name}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{isEditing ? 'Manage Server' : 'Create Your Server'}</h3>
            <p>{isEditing ? 'Update your server details or member list.' : 'Give your new server a personality.'}</p>
            
            <form onSubmit={handleSave}>
              <div className="input-group">
                <label>SERVER NAME</label>
                <input required value={name} onChange={e => setName(e.target.value)} placeholder="Enter server name" />
              </div>

              <div className="input-group">
                <label>ICON URL (OPTIONAL)</label>
                <input value={iconUrl} onChange={e => setIconUrl(e.target.value)} placeholder="https://..." />
              </div>

              <div className="member-select-section">
                <label>{isEditing ? 'MANAGE MEMBERS' : 'INVITE FRIENDS'}</label>
                <div className="member-list-scroll">
                  {friends.map(f => (
                    <div key={f.id} className="member-select-item">
                      <span>{f.name}</span>
                      <input 
                        type="checkbox" 
                        checked={selectedFriends.includes(f.id)} 
                        onChange={() => toggleFriend(f.id)} 
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>Back</button>
                <button type="submit" className="save-btn">{isEditing ? 'Save Changes' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;