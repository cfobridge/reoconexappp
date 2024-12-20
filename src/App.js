import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { ThemeProvider, useTheme } from './componets/ThemeContext';
import { AuthProvider } from './auth/AuthContext'; 


import HomePage from './pages/home';
import SignIn from './auth/SignIn';
import SignUp from './auth/Signup';
import Files from './pages/files'; 
import Rtool from './pages/rtool'; 
import ProtectedRoute from './ProtectedRoute ';
const App = () => {
  const { theme } = useTheme();

  return (
    <div className={theme}>
     <AuthProvider>
      <Router>
        <Routes>
          <Route path="/rtool" element={<ProtectedRoute><Rtool /></ProtectedRoute>} />
          <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/signin" element={<SignIn />} />
          
            
        </Routes>
      </Router>
      </AuthProvider>
    </div>
  );
};

const Root = () => (
  <ThemeProvider>
    <App />
  </ThemeProvider>
);

export default Root;
