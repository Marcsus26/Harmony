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
function SuggestedFriendItem({ id, username, similarity_score, avatar, is_online }) {
    // Si l'utilisateur n'a pas d'avatar, on met le logo par défaut
    const avatarSrc = avatar ? avatar : logo;
    
    // State to handle the button feedback ('idle', 'loading', 'sent', 'error')
    const [requestStatus, setRequestStatus] = useState('idle');

    const handleAddFriend = async (e) => {
        e.stopPropagation(); // Prevents triggering any parent onClick events if you add them later
        if (requestStatus === 'sent' || requestStatus === 'loading') return;

        setRequestStatus('loading');
        try {
            await api.post('/api/friends/send/', { username: username });
            setRequestStatus('sent');
        } catch (err) {
            console.error("Failed to send request", err);
            setRequestStatus('error');
            // Revert back to the + button after 3 seconds if it failed
            setTimeout(() => setRequestStatus('idle'), 3000);
        }
    };

    return (
        <div className="sidebar-item suggestion">
            <div className="avatar-wrapper">
                <img src={avatarSrc} className="sidebar-avatar" alt={username} />
                <div className={`status-dot ${is_online ? 'online' : 'offline'}`}></div>
            </div>
            <div className="item-details">
                <span className="username">{username}</span>
                <span className="current-game">Similarity : {similarity_score}%</span>
            </div>
            
            <button 
                className="add-friend-btn" 
                onClick={handleAddFriend}
                disabled={requestStatus === 'sent' || requestStatus === 'loading'}
                style={{
                    color: requestStatus === 'sent' ? '#23a55a' : requestStatus === 'error' ? '#f23f42' : '',
                    cursor: requestStatus === 'sent' ? 'default' : 'pointer'
                }}
                title="Send Friend Request"
            >
                {requestStatus === 'loading' ? '...' : requestStatus === 'sent' ? '✓' : requestStatus === 'error' ? '✖' : '+'}
            </button>
        </div>
    )
};

function FriendStatsModal({ isOpen, onClose, friendName, stats, bio }) {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="stats-modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{friendName}'s Gaming Profile</h3>
                    <button className="close-x" onClick={onClose}>✕</button>
                </div>
                <div className="modal-body">
                    {stats ? (
                        <UserStatsChart stats={stats} />
                    ) : (
                        <p className="no-data">No stats available for this user.</p>
                    )}
                    <div className="modal-header">
                      {friendName}'s bio :
                      <br/>
                    </div>
                    {bio}
                </div>
            </div>
        </div>
    );
}

function FriendItem({ name, status, avatar, onClick }) {
    return (
        <div className="sidebar-item friend-row" onClick={onClick}>
            <div className="avatar-wrapper">
                <img src={avatar} className="sidebar-avatar" alt={name} />
                <div className={`status-dot ${status ? 'online' : 'offline'}`}></div>
            </div>
            <span>{name}</span>
            <div className="view-stats-hint">View Stats</div>
        </div>
    );
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

function Sidebar({ friends, currentUser, userStats, friendsStats }) {
// 1. On remplace les fausses données par un state vide
  const [suggestions, setSuggestions] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);

  const handleFriendClick = (friend) => {
      const stats = findFriendStats(friend.id);
      setSelectedFriend({ ...friend, stats });
      setIsStatsModalOpen(true);
    };

  const findFriendStats = (id) => {
    for (let i = 0; i< friendsStats.length; i++) {
      if (friendsStats[i][friendsStats[i].length - 1].id === id) {
        return friendsStats[i].slice(0, 6);
      }
    }
  }
  const [isRequestsOpen, setIsRequestsOpen] = useState(false);
  const [requestCount, setRequestCount] = useState(0);

  // 2. On crée un useEffect pour récupérer les suggestions au chargement
  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const res = await api.get('/api/players/suggested/');
        setSuggestions(res.data);
      } catch (error) {
        console.error("Erreur lors de la récupération des suggestions:", error);
      }
    };
    
    fetchSuggestions();
  }, [friends]);

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
          <p className="sidebar-label">YOUR FRIENDS</p>
          {friends.map(f => <FriendItem key={f.id} 
          name={f.username} 
          status={f.is_online} 
          avatar={f.avatar === '' ? logo : f.avatar}
          onClick={() => handleFriendClick(f)}/>)}
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
      <FriendStatsModal 
        isOpen={isStatsModalOpen} 
        onClose={() => setIsStatsModalOpen(false)}
        friendName={selectedFriend?.username}
        stats={selectedFriend?.stats}
        bio={selectedFriend?.bio}
      />
      <div className='sidebar-footer'>
      <button className="add-friend-trigger" onClick={() => setIsModalOpen(true)}>
            + Add Friend
      </button>
      <button className="add-friend-trigger" onClick={() => setIsRequestsOpen(true)}>
        Friend Requests
        {requestCount > 0 && <span className="badge">{requestCount}</span>}
      </button>
      </div>
      <PendingRequestsModal isOpen={isRequestsOpen} onClose={handleRequestsClose} />
      <AddFriendModal 
      isOpen={isModalOpen} 
      onClose={() => setIsModalOpen(false)} 
    />
    </div>
  );
};

export default Sidebar;