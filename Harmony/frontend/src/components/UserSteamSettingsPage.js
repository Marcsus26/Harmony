import React, { useState, useEffect } from 'react';
import api from '../api';
import '../../static/css/Profile.css'; // Reusing your profile styles
import { useNavigate } from 'react-router-dom';

function SteamIntegration({ onSteamLinked }) {
  const [steamId, setSteamId] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSteamData = async () => {
      try {
        const res = await api.get('/api/auth/me/');
        setSteamId(res.data.steam_id || '');
      } catch (err) {
        console.error("Error fetching Steam ID", err);
      }
    };
    fetchSteamData();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsError(false);
    try {
      // We only send the steam_id field
      await api.patch('/api/auth/me/', { steam_id: String(steamId) });
      if (typeof onSteamLinked === 'function') {
        onSteamLinked();
      }
      setMessage("Steam ID linked successfully!");
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      setIsError(true);
      setMessage("Failed to update Steam ID.");
    }
  };

  return (
    <div className="profile-page-container">
      <div className="profile-card">
        <div className="profile-header">
          <h2>Steam Integration</h2>
        </div>

        {message && (
          <div className={isError ? "status-msg error" : "status-msg"}>
            {message}
          </div>
        )}

        <form onSubmit={handleUpdate}>
          <div className="input-group">
            <label>STEAM 64 ID</label>
            <input 
              type="text" 
              value={steamId}
              onChange={(e) => setSteamId(e.target.value)}
              placeholder="e.g., 76561198000000000" 
            />
            <p className="input-help">
              You can find your SteamID64 in your Steam Account Details.
            </p>
          </div>

          <div className="button-group">
            <button type="button" className="cancel-btn" onClick={() => navigate('/')}>
              Cancel
            </button>
            <button type="submit" className="save-btn steam-btn">
              Connect Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SteamIntegration;