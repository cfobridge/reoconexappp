import React, { useState, useCallback } from 'react';
import ReactFlow, { Controls, Background, useNodesState, useEdgesState, addEdge } from 'reactflow';
import 'reactflow/dist/style.css';
import Sidebar from './Sidebar';
import CustomNode from './CustomNode';
import CustomEdge from './CustomEdge';

const edgeTypes = {
  default: CustomEdge,
};

const icons = { AiOutlineLogin: require('react-icons/ai').AiOutlineLogin, AiOutlineLogout: require('react-icons/ai').AiOutlineLogout, };

function GraphComponent() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
  }, []);

  const onDrop = useCallback((event) => {
    event.preventDefault();
    const nodeData = JSON.parse(event.dataTransfer.getData('nodeType')); // Get the node type and icon type
    const rect = event.target.getBoundingClientRect();
    const offset = 100;
    const position = {
      x: event.clientX - rect.left - offset,
      y: event.clientY - rect.top - offset,
    };

    const newNode = {
      id: (nodes.length + 1).toString(),
      data: { label: nodeData.type, icon: nodeData.icon }, // Store icon type
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      type: 'custom',
    };

    setNodes((nds) => [...nds, newNode]);
  }, [nodes, setNodes]);

  const onConnect = useCallback((connection) => {
    setEdges((eds) => addEdge({ ...connection, type: 'default' }, eds));
  }, [setEdges]);

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
          <Background />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}

export default GraphComponent;
