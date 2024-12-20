// HomePage.js
import React from 'react';
import FileUploadPopup from '../fileupload/up';
import { useAuth } from '../auth/AuthContext';
import Slidebar from '../layout/Slidebar';
import './HomePage.css';

const HomePage = () => {
  const { user } = useAuth();
  return (
    <div className="homepage-container">
      <Slidebar />
      <section className="home-content">
        <div className="header">
          <h1>Dashboard</h1>
          <p>Welcome, {user?.emailAddress}</p>
        </div>
        <FileUploadPopup />
        {/* Add your main content here */}
      </section>
    </div>
  );
};

export default HomePage;
