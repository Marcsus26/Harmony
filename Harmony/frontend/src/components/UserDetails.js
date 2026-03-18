import React, { useState } from 'react';
import '../../static/css/index.css';


function UserAccount({ avatar }){
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

export default UserAccount;