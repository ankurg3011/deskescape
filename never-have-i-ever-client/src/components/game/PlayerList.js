// src/components/game/PlayerList.js
import React from 'react';
import Avatar from '../common/Avatar';

const PlayerList = ({ players, host }) => {
  return (
    <div className="bg-white rounded shadow p-4">
      <h2 className="text-lg font-bold mb-4">Players ({players.length})</h2>
      
      <ul className="space-y-2">
        {players.map((player) => (
          <li 
            key={player.user._id} 
            className="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
          >
            <div className="flex items-center">
              <Avatar name={player.user.name} url={player.user.avatar} size={8} />
              <span className="ml-2">{player.user.name}</span>
              {host._id === player.user._id && (
                <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                  Host
                </span>          //arpit , daksh , shubham
              )}
            </div>
            <div className="font-bold">{player.points} pts</div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PlayerList;