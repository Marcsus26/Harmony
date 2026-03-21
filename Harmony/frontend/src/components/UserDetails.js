import '../../static/css/index.css';
import React, { useState, useEffect } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';

function UserAccount({ setAuth }){
  const [showSettings, setShowSettings] = useState(false);
  const [profile, setProfile] = useState({ profile_pic_url: '', bio: '' });
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

  const goToSteam = () => {
    setShowSettings(false);
    navigate('/steam-settings');
  };

  useEffect(() => {
    const fetchProfile = async () => {
    const res = await api.get('/api/profile/update/'); // No headers needed!
    setProfile({
      profile_pic_url: res.data.profile_pic_url,
      bio: res.data.bio
    });
    };
    fetchProfile();
  }, []);

  return (
    <div className="user-nav">
      <button className="avatar-btn" onClick={() => setShowSettings(!showSettings)}>
        <img src={profile.profile_pic_url} alt="user" />
      </button>

      {showSettings && (
        <div className="settings-dropdown">
          <ul>
            <li onClick={goToProfile}>My Profile</li>
            <li onClick={goToSteam}>Steam Integration</li>
            <li className="logout" onClick={handleLogout}>Log Out</li>
          </ul>
        </div>
      )}
    </div>
  );
};


export default UserAccount;