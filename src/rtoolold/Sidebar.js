import React, { useState } from 'react';
import { AiOutlineLogin, AiOutlineLogout } from 'react-icons/ai';
import { useAuth } from '../auth/AuthContext';
import './Sidebar.css';
import { PiFileCsvLight } from 'react-icons/pi';

const Sidebar = () => {
  const [activeSubMenu, setActiveSubMenu] = useState(null);
  const { fileSchemaData, user } = useAuth();  // Access fileSchemaData and user
  const [droppedNodes, setDroppedNodes] = useState([]);  // Track dropped nodes

  const handleDragStart = (event, type, icon, fileSchemaId) => {
    event.dataTransfer.setData('nodeType', JSON.stringify({ type, icon, fileSchemaId }));
  };

  const handleDrop = (event, type) => {
    const droppedNode = event.dataTransfer.getData('nodeType');
    if (droppedNode) {
      const parsedNode = JSON.parse(droppedNode);

      if (type === 'RECONCILIATION') {
        // Create the reconciliation node with required structure
        const newNode = {
          node_id: `reconcile_node_${droppedNodes.length + 1}`, // Unique node ID
          node_type: 'RECONCILIATION',
          dependencies: ['ingest_node_1', 'ingest_node_2'], // Add the dependencies (this can be dynamic)
          reconciliation_node: {
            reconciliation_type: 'ONE_TO_ONE',
            matching_rules: [
              {
                lhs_column: {
                  file_schema_id: '20',
                  column_name: 'BUSINESS_FORMAT_DATE',
                },
                rhs_column: {
                  file_schema_id: '18',
                  column_name: 'Transaction Date',
                },
                matching_type: 'EXACT_MATCH',
              },
              {
                lhs_column: {
                  file_schema_id: '20',
                  column_name: 'CASHIER_CREDIT',
                },
                rhs_column: {
                  file_schema_id: '18',
                  column_name: 'Transaction Amount',
                },
                matching_type: 'EXACT_MATCH',
              },
            ],
          },
        };

        // Add the new node to dropped nodes state
        setDroppedNodes((prevNodes) => [...prevNodes, newNode]);
      }
    }
  };

  const handleSubMenuToggle = (index) => {
    setActiveSubMenu(activeSubMenu === index ? null : index);
  };

  if (!fileSchemaData?.clientFileSchemas) {
    return <div>Loading...</div>; // Show loading message until data is available
  }

  return (
    <div className="sidebars">

      <div className="menu-item">
        <span>Uploaded Files (Data Ingestion)</span>
        {fileSchemaData.clientFileSchemas.map((schema, index) => (
          <div key={schema.fileSchemaId}>
            <div className="file-node" onClick={() => handleSubMenuToggle(index)}>
              <span>{schema.fileName}</span>
              <span className="file-id">({schema.fileSchemaId})</span>
            </div>

            {activeSubMenu === index && (
              <div className="submenu">
                <div
                  draggable
                  onDragStart={(e) =>
                    handleDragStart(e, 'DATA_INGESTION', 'PiFileCsvLight', schema.fileSchemaId)
                  }
                  className="draggable-node"
                >
                  <PiFileCsvLight /> {schema.fileName}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div
        className="menu-item"
        onClick={() => handleSubMenuToggle('reconciliation')}
        onDrop={(e) => handleDrop(e, 'RECONCILIATION')}
        onDragOver={(e) => e.preventDefault()}
      >
        <span>Reconciliation</span>
        {activeSubMenu === 'reconciliation' && (
          <div className="submenu">
            <div
              draggable
              onDragStart={(e) =>
                handleDragStart(e, 'RECONCILIATION', 'AiOutlineLogout', null)
              }
              className="draggable-node"
            >
              <AiOutlineLogout /> RECONCILIATION
            </div>
          </div>
        )}
      </div>

      {/* Render dropped reconciliation nodes */}
      {droppedNodes.length > 0 && (
        <div>
          <h3>Dropped Reconciliation Nodes</h3>
          <pre>{JSON.stringify(droppedNodes, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
