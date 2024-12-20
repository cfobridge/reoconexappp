import React, { useState, useCallback } from 'react';
import ReactFlow, { Controls, Background, useNodesState, useEdgesState, addEdge } from 'reactflow';
import 'reactflow/dist/style.css';
import Sidebar from './Sidebar';
import CustomNode from './CNode';
import CustomEdge from './CEdge';
import { useAuth } from '../auth/AuthContext';

const edgeTypes = {
  default: CustomEdge,
};

function GraphComponent() {
  const { user, token } = useAuth();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [droppedNodes, setDroppedNodes] = useState([]);
  const [reconciliationId, setReconciliationId] = useState(1); // State for reconciliation_id

  const onDragOver = useCallback((event) => {
    event.preventDefault();
  }, []);

  const onDrop = useCallback((event) => {
    event.preventDefault();
    const nodeData = JSON.parse(event.dataTransfer.getData('nodeType'));
    const rect = event.target.getBoundingClientRect();
    const offset = 100;
    const position = {
      x: event.clientX - rect.left - offset,
      y: event.clientY - rect.top - offset,
    };

    const newNode = {
      id: (nodes.length + 1).toString(),
      data: { label: nodeData.type, icon: nodeData.icon, fileSchemaId: nodeData.fileSchemaId },
      position: position,
      type: 'custom',
    };

    setNodes((nds) => [...nds, newNode]);

    if (nodeData.type === 'RECONCILIATION') {
      const newReconciliationNode = {
        node_id: `reconcile_node_${droppedNodes.length + 1}`,
        node_type: 'RECONCILIATION',
        dependencies: ['ingest_node_1', 'ingest_node_2'],
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

      setDroppedNodes((prevNodes) => [...prevNodes, newReconciliationNode]);
    }
  }, [nodes, droppedNodes]);

  const onConnect = useCallback((connection) => {
    setEdges((eds) => addEdge({ ...connection, type: 'default' }, eds));
  }, [setEdges]);

  const generateJSON = () => {
    const user_id = user?.id || '6';

    const nodesData = nodes.map((node, index) => {
      if (node.data.fileSchemaId !== null) {
        return {
          node_id: `ingest_node_${index + 1}`,
          node_type: node.data.label,
          dependencies: [],
          data_ingestion_node: {
            user_id: user_id,
            file_schema_id: node.data.fileSchemaId,
          },
        };
      }
      return null;
    }).filter((node) => node !== null);

    const reconciliationNodes = droppedNodes.map((node) => ({
      node_id: node.node_id,
      node_type: node.node_type,
      dependencies: node.dependencies,
      reconciliation_node: node.reconciliation_node,
    }));

    const json = {
      user_id: user_id,
      reconciliation_id: reconciliationId, // Use the current reconciliation_id
      nodes: [...nodesData, ...reconciliationNodes],
    };

    fetch('http://34.70.96.246:8080/api/reconciliation/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(json),
    })
    .then(response => response.ok ? response.json() : Promise.reject('Network response was not ok.'))
    .then(data => console.log('Success:', data))
    .catch(error => console.error('Error:', error));
  };

  const incrementReconciliationId = () => {
    setReconciliationId((prevId) => prevId + 1); // Increment reconciliation_id
  };

  const openResponseInNewTab = () => {
    const fileSchemaIds = new Set();
  
    nodes.forEach((node) => {
      if (node.data.fileSchemaId) {
        fileSchemaIds.add(node.data.fileSchemaId);
      }

      if (node.data.label === "RECONCILIATION" && node.reconciliation_node) {
        node.reconciliation_node.matching_rules.forEach((rule) => {
          if (rule.lhs_column?.file_schema_id) {
            fileSchemaIds.add(rule.lhs_column.file_schema_id);
          }
          if (rule.rhs_column?.file_schema_id) {
            fileSchemaIds.add(rule.rhs_column.file_schema_id);
          }
        });
      }
    });

    const fileSchemaArray = Array.from(fileSchemaIds);

    const downloadNext = (index) => {
      if (index >= fileSchemaArray.length) {
        console.log('All downloads triggered.');
        return;
      }

      const fileSchemaId = fileSchemaArray[index];
      const url = `http://34.70.96.246:8080/api/reconciliation/output?user_id=${user?.id}&file_schema_id=${fileSchemaId}&reconciliation_id=${reconciliationId}`; // Use the current reconciliation_id

      fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
        .then(response => response.ok ? response.json() : Promise.reject('Network response was not ok.'))
        .then(data => {
          const downloadUrl = data.download_url;
          if (downloadUrl) {
            window.open(downloadUrl, '_blank');
            setTimeout(() => downloadNext(index + 1), 1000);
          } else {
            console.error('Download URL not found in response.');
            setTimeout(() => downloadNext(index + 1), 1000);
          }
        })
        .catch(error => {
          console.error('Fetch data error:', error);
          setTimeout(() => downloadNext(index + 1), 1000);
        });
    };

    downloadNext(0);
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div
        style={{ flexGrow: 1, height: '100vh' }}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={{ custom: CustomNode }}
          edgeTypes={edgeTypes}
          fitView
        >
          <Controls />
          <Background />
        </ReactFlow>
      </div>
      <div>
        <button onClick={() => { generateJSON(); incrementReconciliationId(); }}>Reconcilation</button>
        <button onClick={() => openResponseInNewTab()}>Output</button>
      </div>
    </div>
  );
}

export default GraphComponent;
