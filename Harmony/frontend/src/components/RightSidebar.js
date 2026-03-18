import React, { useState } from 'react';
import '../../static/css/index.css';


function RightSidebar({ channels, suggestedGames }) {
    return (
        <div className="right-sidebar">
            <div className="panel channel-panel">
            <p className="sidebar-label">SERVER CHANNELS</p>
            {channels.map(chan => (
                <div key={chan} className="channel-item"># {chan}</div>
            ))}
            </div>
            
            <div className="panel games-panel">
            <p className="sidebar-label">RECOMENDED FOR YOU</p>
            {suggestedGames.map(game => (
                <div key={game.title} className="game-card">
                <img src={game.img} alt="game" />
                <span>{game.title}</span>
                </div>
            ))}
            </div>
        </div>
    )
};

export default RightSidebar;