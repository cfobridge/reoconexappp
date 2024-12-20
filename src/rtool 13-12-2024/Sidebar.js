// src/components/Sidebar.js
import React, { useState } from 'react';
import { AiOutlineLogin, AiOutlineLogout } from 'react-icons/ai';
import { LiaObjectGroupSolid } from 'react-icons/lia';
import { FaGooglePlay, FaSave } from 'react-icons/fa';
import './Sidebar.css';
import ReconciliationSubmenu from './ReconciliationSubmenu';

const Sidebar = ({ generateJSONAndRun, saveReconciliation, onSelectReconciliation }) => {
  const [isSavePopupOpen, setIsSavePopupOpen] = useState(false);
  const [customReconciliationId, setCustomReconciliationId] = useState('');

  const handleSaveClick = () => {
    if (customReconciliationId.trim()) {
      saveReconciliation(customReconciliationId);
      setIsSavePopupOpen(false);
      setCustomReconciliationId(''); // Clear the input field after saving
    } else {
      alert('Please enter a valid reconciliation name.');
    }
  };

  // Helper function to handle drag start (placed inside the component)
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

      {/* Run Reconciliation */}
      <div className="recon_btn" onClick={generateJSONAndRun}>
        <FaGooglePlay className="icon" /> <span>Run</span>
      </div>

      {/* Save Reconciliation */}
      <div className="sidebar-item" onClick={() => setIsSavePopupOpen(true)}>
        <FaSave className="icon" /> <span>Save</span>
      </div>

      {/* Reconciliation Submenu */}
      <ReconciliationSubmenu onSelectReconciliation={onSelectReconciliation} />

      {/* Save Reconciliation Popup */}
      {isSavePopupOpen && (
        <div className="save-popup">
          <div className="popup-content">
            <h3>Save Reconciliation</h3>
            <input
              type="text"
              placeholder="Enter Reconciliation Name"
              value={customReconciliationId}
              onChange={(e) => setCustomReconciliationId(e.target.value)}
              className="custom-id-input"
            />
            <div className="popup-actions">
              <button className="save-btn" onClick={handleSaveClick}>
                Save
              </button>
              <button className="cancel-btn" onClick={() => setIsSavePopupOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
