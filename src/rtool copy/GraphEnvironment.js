// GraphEnvironment.js
import React, { useState, useCallback, useMemo } from 'react';
import ReactFlow, {
  addEdge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
} from 'react-flow-renderer';
import CustomNode from './CustomNode';
import './GraphEnvironment.css';
import { useAuth } from '../auth/AuthContext';
import Sidebar from './Sidebar'; // Import Sidebar

const nodeTypes = {
  custom: CustomNode,
};

const edgeOptions = {
  animated: true,
  style: { stroke: '#007bff', strokeWidth: 2 },
  markerEnd: {
    type: 'arrowclosed',
  },
};

const GraphEnvironment = () => {
  const { fileSchemaData, user, token } = useAuth();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [reconciliationId, setReconciliationId] = useState(1001);

  const nodeOptions = {
    'Data Ingestion': ['Select File', 'Preview Data'],
    Preprocessing: ['Select Preprocessing Type', 'Configure Options'],
    Reconciliation: ['Set LHS', 'Set RHS', 'Set Matching Method'],
  };

  const deleteNode = (id) => {
    setNodes((nds) => nds.filter((node) => node.id !== id));
    setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
  };

  // Function to update node data
  const updateNodeData = (id, newData) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          node.data = {
            ...node.data,
            ...newData,
          };
        }
        return node;
      })
    );
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const nodeData = event.dataTransfer.getData('nodeType');

    if (nodeData && reactFlowInstance) {
      const parsedData = JSON.parse(nodeData);
      const reactFlowBounds = event.target.getBoundingClientRect();

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode = {
        id: `node_${nodes.length + 1}`,
        type: 'custom',
        data: {
          label: parsedData.title,
          icon: parsedData.icon,
          options: nodeOptions[parsedData.type] || [],
          deleteNode,
          fileSchemaData,
          updateNodeData, // Pass the update function to the node
        },
        position: position,
      };

      setNodes((prevNodes) => prevNodes.concat(newNode));
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const onConnect = useCallback(
    (params) => {
      const { source, target } = params;
      const sourceNode = reactFlowInstance.getNode(source);

      let label = '';
      if (
        sourceNode.data.label === 'Preprocessing' &&
        sourceNode.data.preprocessingOptions?.alias
      ) {
        label = sourceNode.data.preprocessingOptions.alias;
      }

      setEdges((eds) =>
        addEdge(
          {
            ...params,
            ...edgeOptions,
            label,
            labelStyle: { fill: '#f6ab6c', fontWeight: 700 },
          },
          eds
        )
      );
    },
    [setEdges, reactFlowInstance]
  );

  const onInit = (instance) => {
    setReactFlowInstance(instance);
  };

  // Compute schemas for nodes
  const computeNodeSchemas = useCallback(() => {
    const newNodeSchemas = {};

    // Map from nodeId to node
    const nodeMap = {};
    nodes.forEach((node) => {
      nodeMap[node.id] = node;
    });

    const getNodeSchema = (nodeId, visited = new Set()) => {
      if (newNodeSchemas[nodeId]) {
        return newNodeSchemas[nodeId];
      }

      if (visited.has(nodeId)) {
        // Circular dependency
        return [];
      }
      visited.add(nodeId);

      const node = nodeMap[nodeId];
      if (!node) {
        return [];
      }

      let schema = [];

      if (node.data.label === 'Data Ingestion') {
        // Get the schema from fileSchemaData
        const fileSchemaId = node.data.fileSchemaId;
        const file = fileSchemaData?.clientFileSchemas?.find(
          (f) => f.fileSchemaId === fileSchemaId
        );
        if (file) {
          schema = file.fileSchema.map((col) => ({
            column_name: col.columnName,
            file_schema_id: fileSchemaId,
            is_transformed: false,
          }));
        }
      } else {
        const dependencyEdges = edges.filter((edge) => edge.target === node.id);
        const dependencySchemas = dependencyEdges.map((edge) =>
          getNodeSchema(edge.source, new Set(visited))
        );

        // For preprocessing nodes, assume single dependency
        if (node.data.label === 'Preprocessing') {
          schema = dependencySchemas[0] || [];

          const preprocessingType = node.data.preprocessingType;
          const options = node.data.preprocessingOptions || {};

          if (preprocessingType === 'CONCAT_COLUMNS') {
            if (options.alias) {
              schema.push({
                column_name: options.alias,
                file_schema_id: options.lhsColumn?.file_schema_id,
                is_transformed: true,
              });
            }
          } else if (preprocessingType === 'AGGREGATE') {
            if (options.alias) {
              schema.push({
                column_name: options.alias,
                file_schema_id: options.groupByColumn?.file_schema_id,
                is_transformed: true,
              });
            }
          } else if (preprocessingType === 'CONDITIONAL_FILTERING_BY_CONTAINS') {
            if (options.alias) {
              schema.push({
                column_name: options.alias,
                file_schema_id: options.targetColumn?.file_schema_id,
                is_transformed: true,
              });
            }
          }
        } else if (node.data.label === 'Reconciliation') {
          // For reconciliation nodes, collect schemas from dependencies
          schema = dependencySchemas.flat();
        }
      }

      newNodeSchemas[nodeId] = schema;
      return schema;
    };

    nodes.forEach((node) => {
      getNodeSchema(node.id);
    });

    return newNodeSchemas;
  }, [nodes, edges, fileSchemaData]);

  const nodeSchemas = useMemo(() => computeNodeSchemas(), [computeNodeSchemas]);

  const nodesWithSchema = nodes.map((node) => {
    const schema = nodeSchemas[node.id] || [];

    let nodeData = {
      ...node.data,
      schema,
    };

    if (node.data.label === 'Reconciliation' || node.data.label === 'Preprocessing') {
      const dependencyEdges = edges.filter((edge) => edge.target === node.id);
      const dependencies = dependencyEdges.map((edge) => {
        const depNode = nodes.find((n) => n.id === edge.source);
        return {
          nodeId: depNode.id,
          label: depNode.data.label,
          schema: nodeSchemas[depNode.id],
          fileSchemaId: depNode.data.fileSchemaId,
          fileName: depNode.data.fileName,
        };
      });

      nodeData.inputSchemas = dependencies;
    }

    return {
      ...node,
      data: nodeData,
    };
  });

  const generateJSONAndRun = () => {
    const user_id = user?.id || '6';
    const nodeIdMapping = {};

    // First, create nodeIdMapping for all nodes
    nodes.forEach((node, index) => {
      const nodeIndex = index + 1;
      let node_id;

      if (node.data.label === 'Data Ingestion') {
        node_id = `ingest_node_${nodeIndex}`;
      } else if (node.data.label === 'Reconciliation') {
        node_id = `reconcile_node_${nodeIndex}`;
      } else if (node.data.label === 'Preprocessing') {
        node_id = `preprocess_node_${nodeIndex}`;
      } else {
        node_id = `node_${nodeIndex}`;
      }

      nodeIdMapping[node.id] = node_id;
    });

    // Now process nodes using nodeIdMapping
    const ingestNodes = [];
    const preprocessNodes = [];
    const reconciliationNodes = [];

    nodes.forEach((node) => {
      const node_id = nodeIdMapping[node.id];

      if (node.data.label === 'Data Ingestion') {
        ingestNodes.push({
          node_id,
          node_type: 'DATA_INGESTION',
          dependencies: [],
          data_ingestion_node: {
            user_id,
            file_schema_id: node.data.fileSchemaId || null,
          },
        });
      } else if (node.data.label === 'Preprocessing') {
        const dependencies = edges
          .filter((edge) => edge.target === node.id)
          .map((edge) => nodeIdMapping[edge.source])
          .filter(Boolean);

        const preprocessingType = node.data.preprocessingType;
        const options = node.data.preprocessingOptions || {};

        let preprocessingNode = { preprocessing_type: preprocessingType };

        if (preprocessingType === 'CONCAT_COLUMNS') {
          preprocessingNode['concat_columns'] = {
            lhs_column: {
              file_schema_id: options.lhsColumn?.file_schema_id,
              column_name: options.lhsColumn?.column,
            },
            rhs_column: {
              file_schema_id: options.rhsColumn?.file_schema_id,
              column_name: options.rhsColumn?.column,
            },
            alias: options.alias,
          };
        } else if (preprocessingType === 'AGGREGATE') {
          preprocessingNode['aggregate_function'] = {
            group_by_column: {
              file_schema_id: options.groupByColumn?.file_schema_id,
              column_name: options.groupByColumn?.column,
              is_transformed: options.groupByColumn?.is_transformed || false,
            },
            target_column: {
              file_schema_id: options.targetColumn?.file_schema_id,
              column_name: options.targetColumn?.column,
            },
            alias: options.alias,
            aggregate_type: options.aggregateType,
          };
        } else if (preprocessingType === 'CONDITIONAL_FILTERING_BY_CONTAINS') {
          preprocessingNode['conditional_filtering_by_contains'] = {
            filter_column: {
              file_schema_id: options.filterColumn?.file_schema_id,
              column_name: options.filterColumn?.column,
            },
            target_column: {
              file_schema_id: options.targetColumn?.file_schema_id,
              column_name: options.targetColumn?.column,
            },
            phrase_contained: options.phraseContained,
            alias: options.alias,
          };
        }

        preprocessNodes.push({
          node_id,
          node_type: 'PRE_PROCESSING',
          dependencies: dependencies,
          preprocessing_node: preprocessingNode,
        });
      } else if (node.data.label === 'Reconciliation') {
        const dependencies = edges
          .filter((edge) => edge.target === node.id)
          .map((edge) => nodeIdMapping[edge.source])
          .filter(Boolean);

        const matchingRules = node.data.matchingRules.map((rule) => ({
          lhs_column: {
            file_schema_id: rule.lhsSelection.file_schema_id,
            column_name: rule.lhsSelection.column,
            is_reduced: rule.lhsSelection.is_transformed || false,
          },
          rhs_column: {
            file_schema_id: rule.rhsSelection.file_schema_id,
            column_name: rule.rhsSelection.column,
            is_reduced: rule.rhsSelection.is_transformed || false,
          },
          matching_type: rule.matchingMethod,
        }));

        reconciliationNodes.push({
          node_id,
          node_type: 'RECONCILIATION',
          dependencies: dependencies,
          reconciliation_node: {
            reconciliation_type: 'ONE_TO_ONE',
            matching_rules: matchingRules,
          },
        });
      }
    });

    const json = {
      user_id,
      reconciliation_id: reconciliationId.toString(),
      nodes: [...ingestNodes, ...preprocessNodes, ...reconciliationNodes],
    };

    console.log('Generated JSON:', JSON.stringify(json, null, 2));

    fetch('http://34.70.96.246:8080/api/reconciliation/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(json),
    })
      .then((response) =>
        response.ok ? response.json() : Promise.reject('Network response was not ok.')
      )
      .then((data) => {
        console.log('Reconciliation Run Success:', data);
        // After successful run, fetch the output files
        openResponseInNewTab();
      })
      .catch((error) => console.error('Error:', error));
  };

  const openResponseInNewTab = () => {
    const fileSchemaIds = new Set();

    nodes.forEach((node) => {
      if (node.data.fileSchemaId) {
        fileSchemaIds.add(node.data.fileSchemaId);
      }

      if (node.data.label === 'Reconciliation' && node.data.matchingRules) {
        node.data.matchingRules.forEach((rule) => {
          if (rule.lhsSelection?.file_schema_id) {
            fileSchemaIds.add(rule.lhsSelection.file_schema_id);
          }
          if (rule.rhsSelection?.file_schema_id) {
            fileSchemaIds.add(rule.rhsSelection.file_schema_id);
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
      const url = `http://34.70.96.246:8080/api/reconciliation/output?user_id=${user?.id}&file_schema_id=${fileSchemaId}&reconciliation_id=${reconciliationId}`;

      fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((response) =>
          response.ok ? response.json() : Promise.reject('Network response was not ok.')
        )
        .then((data) => {
          const downloadUrl = data.download_url;
          if (downloadUrl) {
            window.open(downloadUrl, '_blank');
            setTimeout(() => downloadNext(index + 1), 1000);
          } else {
            console.error('Download URL not found in response.');
            setTimeout(() => downloadNext(index + 1), 1000);
          }
        })
        .catch((error) => {
          console.error('Fetch data error:', error);
          setTimeout(() => downloadNext(index + 1), 1000);
        });
    };

    downloadNext(0);
  };

  return (
    <>
    <Sidebar
        generateJSONAndRun={generateJSONAndRun} // Pass the function to Sidebar
      />
    <div className="graph-environment" onDrop={handleDrop} onDragOver={handleDragOver}>
      
      <ReactFlow
        nodes={nodesWithSchema}
        edges={edges}
        onInit={onInit}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        style={{ width: '100%', height: '100%' }}
      >
        <Controls />
        <Background color="#aaa" gap={16} />
      </ReactFlow>
    </div></>
  );
};

export default GraphEnvironment;
