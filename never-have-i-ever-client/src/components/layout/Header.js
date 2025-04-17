import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import Avatar from '../common/Avatar';

const Header = () => {
  const { currentUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-blue-600 text-white shadow">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">Never Have I Ever</Link>

        <nav className="hidden md:flex space-x-6">
          <Link to="/rooms" className="hover:text-blue-200">Rooms</Link>
          <Link to="/leaderboard" className="hover:text-blue-200">Leaderboard</Link>
        </nav>

        <div className="flex items-center">
          {currentUser ? (
            <>
              <Avatar src={currentUser.avatarUrl} alt={currentUser.name} />
              <span className="ml-2">{currentUser.name}</span>
              <button
                onClick={handleLogout}
                className="ml-4 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="ml-4 bg-white text-blue-600 px-3 py-1 rounded hover:bg-gray-100"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
