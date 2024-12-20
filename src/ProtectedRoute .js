import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './auth/AuthContext'; // Adjust the path if needed

const ProtectedRoute = ({ children }) => {
  const { token } = useAuth();

  return token ? children : <Navigate to="/signin" replace />;
};

export default ProtectedRoute;