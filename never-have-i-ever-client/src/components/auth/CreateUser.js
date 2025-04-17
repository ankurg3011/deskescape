// src/components/auth/CreateUser.js
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { generateAvatarUrl } from '../../utils/helpers';
import { toast } from 'react-toastify';

const CreateUser = () => {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { createUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Please enter a name');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Generate avatar URL based on name
      const avatar = generateAvatarUrl(name);
      
      // Create user
      await createUser({ name, avatar });
      
      toast.success('Welcome to Never Have I Ever!');
      navigate('/rooms');
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error(error.response?.data?.message || 'Failed to create user');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6 text-center text-indigo-600">
          Join the Game
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
              What should we call you?
            </label>
            <input
              id="name"
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter your nickname"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={20}
              required
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
            disabled={isLoading}
          >
            {isLoading ? 'Creating...' : 'Let\'s Play!'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateUser;