
// HomePage.js
import React, { useState } from 'react';
import GraphEnvironment from '../rtool/GraphEnvironment';
import { useAuth } from '../auth/AuthContext';

const Rtool = () => {
  const { user } = useAuth();
  return (
    <div className="app-container">
      <GraphEnvironment />
    </div>
  );
};

export default Rtool;
