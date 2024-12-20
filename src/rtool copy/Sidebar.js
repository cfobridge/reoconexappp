// Sidebar.js
import React from 'react';
import { AiOutlineLogin, AiOutlineLogout } from 'react-icons/ai';
import { LiaObjectGroupSolid } from 'react-icons/lia';
import { FaGooglePlay } from "react-icons/fa";
import './Sidebar.css';

const Sidebar = ({ generateJSONAndRun }) => {
  const handleDragStart = (event, nodeInfo) => {
    event.dataTransfer.setData('nodeType', JSON.stringify(nodeInfo));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="sidebar">
      <h2 className="sidebar-title">Components</h2>

      {/* Data Ingestion Node */}
      <div
        className="sidebar-item draggable-node"
        draggable
        onDragStart={(e) =>
          handleDragStart(e, {
            type: 'Data Ingestion',
            icon: 'AiOutlineLogin',
            title: 'Data Ingestion',
          })
        }
      >
        <AiOutlineLogin className="icon" /> <span>Data Ingestion</span>
      </div>

      {/* Preprocessing Node */}
      <div
        className="sidebar-item draggable-node"
        draggable
        onDragStart={(e) =>
          handleDragStart(e, {
            type: 'Preprocessing',
            icon: 'LiaObjectGroupSolid',
            title: 'Preprocessing',
          })
        }
      >
        <LiaObjectGroupSolid className="icon" /> <span>Preprocessing</span>
      </div>

      {/* Reconciliation Node */}
      <div
        className="sidebar-item draggable-node"
        draggable
        onDragStart={(e) =>
          handleDragStart(e, {
            type: 'Reconciliation',
            icon: 'AiOutlineLogout',
            title: 'Reconciliation',
          })
        }
      >
        <AiOutlineLogout className="icon" /> <span>Reconciliation</span>
      </div>

      {/* Run Button */}

      <div
        className=" recon_btn" onClick={generateJSONAndRun}
        
      >
        <FaGooglePlay className="icon" /> <span>Runz</span>
      </div>
    </div>
  );
};

export default Sidebar;
