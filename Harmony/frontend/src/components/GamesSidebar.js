import React from 'react';
import '../../static/css/index.css';
import api from '../api.js';

function GamesSidebar({ suggestedGames, hasSteamLinked, isLoadingSuggestions, onSelectGame, setSuggestedGames, refreshStats, refreshGamesList }) {

    const handleRefuse = async (e, gameId) => {
    e.stopPropagation();
    
    setSuggestedGames(prev => prev.filter(g => g.id !== gameId));

    try {
      await api.post('/api/recommendations/refuse/', { game_id: String(gameId) });
      if (refreshStats) refreshStats();
    } catch (err) {
      console.error("Failed to save refusal", err);
    }
    };

    const handleLike = async (e, gameId) => {
    e.stopPropagation();

    try {
      await api.post('/api/recommendations/like/', { game_id: String(gameId) });
      if (refreshStats) refreshStats();
      if (refreshGamesList) refreshGamesList(); 
    } catch (err) {
      console.error("Failed to save like", err);
    }
  };
  return (
    <div className="games-sidebar">
      <div className="panel">
        <p className="sidebar-label">BASED ON THE GAMES YOU PLAY</p>
        
        {isLoadingSuggestions && (
          <div className="channel-item">Loading recommendations...</div>
        )}
        
        {!isLoadingSuggestions && !hasSteamLinked && (
          <div className="channel-item">Connect your Steam account to see suggestions.</div>
        )}
        
        {!isLoadingSuggestions && hasSteamLinked && suggestedGames.length === 0 && (
          <div className="channel-item">No recommendations found yet.</div>
        )}

        <div className="games-list">
          {suggestedGames.map(game => (
            <div key={game.id || game.title} className="game-card" onClick={() => onSelectGame(game.id)}>
              <img src={game.img} alt={game.title} />
              <div className="game-info">
                <div className="game-title">{game.title}</div>
                <div className="game-status">{game.genre}</div>
              </div>
              <button 
                className="refuse-btn" 
                onClick={(e) => handleRefuse(e, game.id)}
                title="Not interested">
                x
              </button>
              <button 
                className="like-btn" 
                onClick={(e) => handleLike(e, game.id)}
                title="Like this Game">
                ✓
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
export default GamesSidebar;