import React from 'react';
import { Handle, Position } from 'reactflow';
import './CustomNode.css';
import { AiOutlineLogin, AiOutlineLogout, } from 'react-icons/ai';

const icons = { AiOutlineLogin, AiOutlineLogout }; // Map icons

const CustomNode = ({ data }) => {
  const IconComponent = icons[data.icon]; // Dynamically select the icon component

  return (
    <div className="custom-node">
      <div className="custom-node-content">
        {IconComponent && <IconComponent className="node-icon" />} {/* Render the selected icon */}
        <div className="node-label">{data.label}</div>
      </div>
      <Handle type="source" position={Position.Right} />
      <Handle type="target" position={Position.Left} />
    </div>
  );
};

export default CustomNode;
