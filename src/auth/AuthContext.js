// AuthContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('authToken'));
  const [user, setUser] = useState(null);
  const [fileSchemaData, setFileSchemaData] = useState([]); // State for file schema

  // Function to fetch file schema with Authorization header
  const fetchFileSchema = async (userId, token) => {
    try {
      const response = await fetch(`http://34.70.96.246:8080/api/reconciliation/file_schemas?user_id=${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch schema data');
      const data = await response.json();
      console.log("Fetched file schema data:", data); // Log data to verify
      setFileSchemaData(data); // Update file schema data in state
    } catch (error) {
      console.error('Error fetching schema data:', error);
    }
  };

  const login = (token, userDetails) => {
    setToken(token);
    setUser(userDetails);
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(userDetails));

    // Fetch schema with authorization after login
    fetchFileSchema(userDetails.id, token);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setFileSchemaData([]); // Clear schema data on logout
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  };

  const setFileSchema = (schemaData) => {
    setFileSchemaData(schemaData); // Method to update the file schema
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setToken(storedToken);
        // Fetch schema data on app load if user and token are present
        fetchFileSchema(parsedUser.id, storedToken);
      } catch (e) {
        console.error("Failed to parse user data:", e);
      }
    }
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, login, logout, fileSchemaData, setFileSchema }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
