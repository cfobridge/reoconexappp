// LogoutButton.js
import React from 'react';
import { RiLogoutCircleRLine } from 'react-icons/ri';
import { useAuth } from './AuthContext';

const LogoutButton = ({ className }) => {
  const { logout } = useAuth();

  const handleLogout = (e) => {
    e.preventDefault();
    logout(); // Your logout logic
  };

  return (
    <a href="#" onClick={handleLogout} className={className}>
      <RiLogoutCircleRLine className="icon" />
      <span>Logout</span>
    </a>
  );
};

export default LogoutButton;
