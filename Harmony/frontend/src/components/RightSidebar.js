import React, { useState, useEffect } from 'react';
import '../../static/css/index.css';
import api from '../api.js';


function RightSidebar({ channels, activeChannelId, onSelectChannel, onChannelCreated, activeServerId }) {
  const [showModal, setShowModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');

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
        </div>
    )
};

export default RightSidebar;