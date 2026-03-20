import '../../static/css/index.css';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
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

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await axios.get('http://127.0.0.1:8000/api/profile/update/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProfile({
          profile_pic_url: res.data.profile_pic_url || '',
          bio: res.data.bio || ''
        });
      } catch (err) {
        console.error("Error fetching profile", err);
      }
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