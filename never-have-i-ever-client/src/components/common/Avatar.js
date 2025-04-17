// src/components/common/Avatar.js
import React from 'react';

const Avatar = ({ 
  user, 
  size = 'medium', 
  showStatus = false,
  className = '' 
}) => {
  const name = user?.displayName || user?.username || 'User';
  const initials = name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
  
  const sizes = {
    small: 'w-8 h-8 text-xs',
    medium: 'w-10 h-10 text-sm',
    large: 'w-16 h-16 text-lg',
    xlarge: 'w-24 h-24 text-2xl'
  };
  
  const bgColors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500'
  ];
  
  // Use a deterministic color based on username
  const colorIndex = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % bgColors.length;
  const bgColor = bgColors[colorIndex];
  
  return (
    <div className={`relative ${className}`}>
      <div className={`${sizes[size]} ${bgColor} rounded-full flex items-center justify-center text-white font-medium`}>
        {user?.photoURL ? (
          <img 
            src={user.photoURL} 
            alt={name} 
            className="w-full h-full rounded-full object-cover" //arpit , daksh , shubham
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>
      
      {showStatus && user?.isOnline && (
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></span>
      )}
    </div>
  );
};

export default Avatar;