// src/components/rooms/RoomList.js
import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import RoomCard from './RoomCard';
import { AuthContext } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

const RoomList = () => {
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useContext(AuthContext);

  useEffect(() => {
    fetchRooms();
    
    // Poll for room updates every 10 seconds
    const interval = setInterval(fetchRooms, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await api.get('/rooms', {
        params: { status: 'waiting' }
      });
      setRooms(response.data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      toast.error('Failed to load rooms');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Available Rooms</h2>
        <Link 
          to="/rooms/create" 
          className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md text-sm transition-colors"
        >
          Create Room
        </Link>
      </div>
      
      {rooms.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">No rooms available at the moment</p>
          <Link 
            to="/rooms/create" 
            className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md text-sm transition-colors"
          >
            Create a Room
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {rooms.map(room => (
            <RoomCard key={room._id} room={room} />
          ))}
        </div>
      )}
    </div>
  );
};

export default RoomList;