import '../../static/css/index.css';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function UserAccount({ avatar, setAuth }){
  const [showSettings, setShowSettings] = useState(false);
  const navigate = useNavigate();

  const goToProfile = () => {
    setShowSettings(false); // Close the menu first
    navigate('/profile'); // Move to the profile page
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    if (setAuth) setAuth(false);
    navigate('/login');
  };

  return (
    <div className="user-nav">
      <button className="avatar-btn" onClick={() => setShowSettings(!showSettings)}>
        <img src={avatar} alt="user" />
      </button>

      {showSettings && (
        <div className="settings-dropdown">
          <ul>
            <li onClick={goToProfile}>My Profile</li>
            <li>Steam Integration</li>
            <li>Privacy Settings</li>
            <li className="logout" onClick={handleLogout}>Log Out</li>
          </ul>
        </div>
      )}
    </div>
  );
};


export default UserAccount;