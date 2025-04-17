// src/components/rooms/RoomCard.js
import React from 'react';
import { Link } from 'react-router-dom';

const RoomCard = ({ room }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-bold text-indigo-600">{room.name}</h3>
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
          room.status === 'waiting' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {room.status === 'waiting' ? 'Waiting' : 'Playing'}
        </span>
      </div>
      
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <span className="text-sm text-gray-500">Players: </span>
          <span className="ml-1 text-sm font-medium">{room.players.length} / {room.maxPlayers}</span>
        </div>
      </div>
      
      <div className="flex -space-x-2 overflow-hidden mb-4">
        {room.players.slice(0, 5).map((player, index) => (
          <img
            key={index}
            src={player.user.avatar}
            alt={player.user.name}
            className="inline-block h-6 w-6 rounded-full ring-2 ring-white"
            title={player.user.name}
          />
        ))}
        {room.players.length > 5 && (
          <div className="flex items-center justify-center h-6 w-6 rounded-full bg-gray-200 ring-2 ring-white text-xs">
            +{room.players.length - 5}
          </div>
        )}
      </div>
      
      <Link 
        to={`/rooms/${room._id}`}
        className="block w-full text-center bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md text-sm transition-colors"
      >
        Join Room
      </Link>
    </div>
  );
};

export default RoomCard;