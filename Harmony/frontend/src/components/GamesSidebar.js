import React from 'react';
import '../../static/css/index.css';

function GamesSidebar({ suggestedGames, hasSteamLinked, isLoadingSuggestions, onSelectGame }) {
  return (
    <div className="games-sidebar">
      <div className="panel">
        <p className="sidebar-label">RECOMMENDED FOR YOU</p>
        
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
                <span className="game-title">{game.title}</span>
                <span className="game-status">{game.genre}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default GamesSidebar;