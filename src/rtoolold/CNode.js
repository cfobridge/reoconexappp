import React from 'react';
import { Handle, Position } from 'reactflow';
import './CNode.css';
import { AiOutlineLogin, AiOutlineLogout } from 'react-icons/ai';import { PiFileCsvLight } from "react-icons/pi";

const icons = { AiOutlineLogin, AiOutlineLogout,PiFileCsvLight }; // Map icons

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
