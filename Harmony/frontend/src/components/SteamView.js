import React from 'react';
import '../../static/css/index.css';

function SteamView({ gameId, onClose }) {
  const steamWidgetUrl = `https://store.steampowered.com/widget/${gameId}/`;

  return (
    <div className="steam-view-container">
      <div className="steam-header">
        <button className="close-steam-btn" onClick={onClose}>
          ✕ Close Store Page
        </button>
      </div>
      <iframe 
        src={steamWidgetUrl} 
        frameBorder="0" 
        width="100%" 
        height="100%"
        title="Steam Store"
      ></iframe>
    </div>
  );
}

export default SteamView;