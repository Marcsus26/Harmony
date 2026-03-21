import React, { useState, useEffect } from 'react';
import api from '../api';
import '../../static/css/Profile.css';
import { useNavigate } from 'react-router-dom';
import logo from "../../static/images/logo.svg";

function MyProfile() {
  const [profile, setProfile] = useState({ profile_pic_url: '', bio: '' });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  // Load existing data
useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/api/profile/update/');
        setProfile({
          profile_pic_url: res.data.profile_pic_url || '',
          bio: res.data.bio || ''
        });
      } catch (err) {
        console.error("Could not load profile", err);
      }
    };
    fetchProfile();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.patch('/api/profile/update/', profile);
      
      setMessage("Profile updated successfully! ✨");
      setTimeout(() => navigate('/'), 1500); 
    } catch (err) {
      console.error("Update error:", err);
      setMessage("Failed to update profile.");
    }
  };

  return (
    <div className="profile-page-container">
      <div className="profile-card">
        
        {/* NEW: Visual Header with Live Preview */}
        <div className="profile-header">
          <h2>My Profile</h2>
          <div className="avatar-preview-wrapper">
            <img 
              src={profile.profile_pic_url || logo} 
              alt="Avatar Preview" 
              className="avatar-preview"
            />
          </div>
        </div>
        
        {message && <div className="status-msg">{message}</div>}

        <form onSubmit={handleUpdate}>
          <div className="input-group">
            <label>PROFILE PICTURE URL</label>
            <input 
              type="text" 
              value={profile.profile_pic_url}
              onChange={(e) => setProfile({...profile, profile_pic_url: e.target.value})}
              placeholder="e.g., https://imgur.com/my-avatar.png" 
            />
          </div>

          <div className="input-group">
            <label>ABOUT ME</label>
            <textarea 
              value={profile.bio}
              onChange={(e) => setProfile({...profile, bio: e.target.value})}
              placeholder="Tell us about yourself..."
              rows="4"
            />
          </div>

          <div className="button-group">
            <button type="button" className="cancel-btn" onClick={() => navigate('/')}>Cancel</button>
            <button type="submit" className="save-btn">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MyProfile;