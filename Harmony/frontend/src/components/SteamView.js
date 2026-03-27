import React, { useState, useEffect } from 'react';
import api from '../api.js';
import ReactPlayer from 'react-player';


function SteamView({ gameId, onClose }) {
  const [trailerUrl, setTrailerUrl] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!gameId) return;
    const fetchDetails = async () => {
      try {
        const response = await api.get(`/api/steam-details/${gameId}/`);
        setTrailerUrl(response.data.trailer_url);
      } catch (err) {
        setTrailerUrl('');
      }
    };
    fetchDetails();
  }, [gameId]);

  const steamWidgetUrl = gameId ? `https://store.steampowered.com/widget/${gameId}/` : "";

  return (
    <div className={`steam-view-container ${gameId ? 'visible' : ''}`}>
      <div className="steam-header">
        <span>STEAM PREVIEW</span>
        <button className="close-steam-btn" onClick={onClose}>✕ Close</button>
      </div>

        <div className="steam-content-scroll">
        {trailerUrl ? (
          <div className="trailer-wrapper">
            <ReactPlayer 
              src={trailerUrl}
              playing={true} 
              controls={true}
              muted={true}
              width="100%"
              height="auto"
              config={{
                file: {
                  forceHLS: true,
                  attributes: {
                    // This helps with CORS issues from Steam's CDN
                    crossOrigin: 'anonymous', 
                    style: { width: '100%', height: '100%', objectFit: 'cover' }
                  }
                }
              }}
            />
          </div>
        ) : (
          <div className="no-trailer">Loading trailer...</div>
        )}

        {/* WIDGET SECTION */}
        {gameId && (
          <div className="widget-wrapper">
            <iframe 
              src={steamWidgetUrl} 
              frameBorder="0" 
              width="100%" 
              height="200px"
              title="Steam Store"
            ></iframe>
          </div>
        )}
      </div>
    </div>
  );
}

export default SteamView;