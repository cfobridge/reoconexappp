
// HomePage.js
import React, { useState } from 'react';
import FileUploadPopup from '../fileupload/up';

const Files = () => {
  return (
    <div style={{ display: 'flex' }}>
      <FileUploadPopup/>
    </div>
  );
};

export default Files;
