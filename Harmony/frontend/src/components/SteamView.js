import React from 'react';
import '../../static/css/index.css';

function SteamView({ gameId, onClose }) {
  const steamWidgetUrl = gameId ? `https://store.steampowered.com/widget/${gameId}/` : "";

    return (
    <div className={`steam-view-container ${gameId ? 'visible' : ''}`}>
      <div className="steam-header">
        <span>STEAM STORE PREVIEW</span>
        <button className="close-steam-btn" onClick={onClose}>
          ✕ Close
        </button>
      </div>
      {gameId && (
        <iframe 
          src={steamWidgetUrl} 
          frameBorder="0" 
          width="100%" 
          height="100%"
          title="Steam Store"
        ></iframe>
      )}
    </div>
  );
}

export default SteamView;