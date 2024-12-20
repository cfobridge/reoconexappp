// CustomEdge.js
import React from 'react';
import { getBezierPath } from 'reactflow';

const CustomEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style = {},
}) => {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition: 'right',
    targetX,
    targetY,
    targetPosition: 'left',
  });

  return (
    <g>
      <defs>
        <marker
          id={`arrow-${id}`}
          markerWidth="16"
          markerHeight="16"
          refX="12"
          refY="8"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="icon icon-tabler icons-tabler-filled icon-tabler-navigation">
  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
  <path d="M11.092 2.581a1 1 0 0 1 1.754 -.116l.062 .116l8.005 17.365c.198 .566 .05 1.196 -.378 1.615a1.53 1.53 0 0 1 -1.459 .393l-7.077 -2.398l-6.899 2.338a1.535 1.535 0 0 1 -1.52 -.231l-.112 -.1c-.398 -.386 -.556 -.954 -.393 -1.556l.047 -.15l7.97 -17.276z" transform="rotate(90 12 12)"/>
</svg>
        </marker>
      </defs>
      <path
        id={id}
        style={style}
        className="react-flow__edge-path"
        d={edgePath}
        stroke="#000" // Customize the stroke color
        strokeWidth={2} // Adjust the stroke width as needed
        fill="none" // Ensure no fill is applied
        markerEnd={`url(#arrow-${id})`} // Add the arrow marker
      />
    </g>
  );
};

export default CustomEdge;
