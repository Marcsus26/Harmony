import React, { useState, useEffect } from 'react';
import '../../static/css/index.css';
import api from '../api.js';


function RightSidebar({ channels, activeChannelId, onSelectChannel, onChannelCreated, servers, onServerCreated, activeServerId, onSelectServer, currentUser, friends }) {
  const [showModal, setShowModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showServerModal, setShowServerModal] = useState(false);
  const [name, setName] = useState('');
  const [iconUrl, setIconUrl] = useState('');
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [isEditing, setIsEditing] = useState(false);

  const currentServer = servers.find(s => s.id === activeServerId);
  const isOwner = currentServer ? currentServer?.owner === currentUser?.id : true;

  const toggleFriend = (id) => {
    setSelectedFriends(prev => 
      prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
    );
  };

  const handleLeave = async () => {
    if (!window.confirm(`Are you sure you want to leave ${currentServer.name}?`)) return;

    try {
      await api.post(`/api/servers/${activeServerId}/leave/`);
      
      setShowServerModal(false);
      onSelectServer(null);
      onServerCreated();
      onSelectChannel(null);
    } catch (err) {
      alert("Error leaving server");
    }
  };

  const openCreateModal = () => {
    setIsEditing(false);
    setName('');
    setIconUrl('');
    setSelectedFriends([]);
    setShowServerModal(true);
  };


  const openEditModal = () => {
    if (!currentServer) return;
    setIsEditing(true);
    setName(currentServer.name);
    setIconUrl(currentServer.icon_url || '');
    setSelectedFriends(currentServer.users || []); 
    setShowServerModal(true);
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
      
      setShowServerModal(false);
      if (onServerCreated) onServerCreated(); // Refresh the list
    } catch (err) {
      alert(isEditing ? "Failed to update server" : "Failed to create server");
    }
  };

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

  const handleDelete = async () => {
  // Always good to double-check before deleting!
  if (!window.confirm(`Are you sure you want to delete "${currentServer.name}"? This cannot be undone.`)) {
    return;
  }

  try {
    await api.delete(`/api/servers/${activeServerId}/delete/`);
    
    setShowModal(false);
    
    if (onSelectServer) onSelectServer(null);
    
    if (onServerCreated) onServerCreated();
    onSelectChannel(null);
  } catch (err) {
    console.error(err);
    alert("Failed to delete server. Only the owner can delete a server.");
  }
};

  const handleCreateChannel = async (e) => {
    e.preventDefault();
    if (!activeServerId) return;

    try {
      await api.post(`/api/servers/${activeServerId}/channels/create/`, {
        name: newChannelName.toLowerCase().replace(/\s+/g, '-') 
      });
      setNewChannelName('');
      setShowModal(false);
      onChannelCreated();
    } catch (err) {
      alert("Error creating channel");
    }
  };

    return (
        <div className="right-sidebar">
            <div className="panel channel-panel">
            <p className="sidebar-label">SERVER CHANNELS</p>
            {activeServerId && (
          <button className="add-btn" onClick={() => setShowModal(true)}>+</button>
        )}
            {channels.map(chan => (
                <div key={chan.id} 
                    className={`channel-item ${activeChannelId === chan.id ? 'active' : ''}`}
                    onClick={() => onSelectChannel(chan.id)}># {chan.name}</div>
            ))}
            </div>
            {showModal && (
                <div className="modal-overlay">
                <div className="modal-content">
                    <h3>Create Channel</h3>
                    <form onSubmit={handleCreateChannel}>
                    <div className="input-group">
                        <label>CHANNEL NAME</label>
                        <div className="channel-input-wrapper">
                        <span className="hash-prefix">#</span>
                        <input 
                            required 
                            autoFocus
                            value={newChannelName} 
                            onChange={e => setNewChannelName(e.target.value)} 
                            placeholder="new-channel" 
                        />
                        </div>
                    </div>
                    <div className="modal-actions">
                        <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
                        <button type="submit" className="save-btn">Create Channel</button>
                    </div>
                    </form>
                </div>
                </div>
            )}
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

      {showServerModal && (
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
                      <span>{f.username}</span>
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
                <div className="left-actions">
                  {isEditing && (
                      isOwner ? (
                      <button type="button" className="delete-server-btn" onClick={handleDelete}>
                        Delete Server
                      </button>
                    ) : (
                      <button type="button" className="leave-server-btn" onClick={handleLeave}>
                        Leave Server
                      </button>
                    )
                  )}
                </div>
                <div className="right-actions">
                  <button type="button" className="cancel-btn" onClick={() => setShowServerModal(false)}>Back</button>
                  {isOwner && <button type="submit" className="save-btn">{isEditing ? 'Save Changes' : 'Create'}</button>}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
        </div>
    )
};

export default RightSidebar;