import React, { useState, useEffect } from 'react';
import { AiOutlineLogin, AiOutlineLogout } from 'react-icons/ai';
import { useAuth } from './AuthProvider';
import './Sidebar.css';

const Sidebar = () => {
  const [activeSubMenu, setActiveSubMenu] = useState(null);
  const { fileSchemaData, user } = useAuth();  // Access fileSchemaData and user

  const handleDragStart = (event, type, icon) => {
    event.dataTransfer.setData('nodeType', JSON.stringify({ type, icon }));
  };

  const handleSubMenuToggle = (index) => {
    setActiveSubMenu(activeSubMenu === index ? null : index);
  };

  // Ensure fileSchemaData is available before rendering
  if (!fileSchemaData?.clientFileSchemas) {
    return <div>Loading...</div>; // Show loading message until data is available
  }

  return (
    <div className="sidebars">
      <div className="menu-item">
        <span>Main Node</span>
        <p>User ID: {user?.id}</p>
        <div
          draggable
          onDragStart={(e) => handleDragStart(e, 'Request', 'AiOutlineLogin')}
          className="draggable-node"
        >
          <AiOutlineLogin /> Request
        </div>
      </div>

      {fileSchemaData.clientFileSchemas.map((schema, index) => (
        <div className="menu-item" key={schema.fileSchemaId} onClick={() => handleSubMenuToggle(index)}>
          <span>{schema.fileName}</span> {/* Display the file name here */}
          {activeSubMenu === index && (
            <div className="submenu">
              {/* Display each schema column */}
              {schema.fileSchema.map((column, colIndex) => (
                <div
                  key={colIndex}
                  draggable
                  onDragStart={(e) => handleDragStart(e, column.columnName, 'AiOutlineLogin')}
                  className="draggable-node"
                >
                  <AiOutlineLogin /> {column.columnName} 
                  {column.dataType ? ` (${column.dataType})` : ''} 
                  {column.datetimeFormat ? ` [${column.datetimeFormat}]` : ''}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Static submenu for reference */}
      <div className="menu-item" onClick={() => handleSubMenuToggle('static')}>
        <span>Static Submenu</span>
        {activeSubMenu === 'static' && (
          <div className="submenu">
            <div
              draggable
              onDragStart={(e) => handleDragStart(e, 'Static Subnode 1', 'AiOutlineLogin')}
              className="draggable-node"
            >
              <AiOutlineLogin /> Static Subnode 1
            </div>
            <div
              draggable
              onDragStart={(e) => handleDragStart(e, 'Static Subnode 2', 'AiOutlineLogout')}
              className="draggable-node"
            >
              <AiOutlineLogout /> Static Subnode 2
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
