// src/GraphEnvironment/GraphEnvironment.js
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
import CustomNodeRetrieval from './CustomNodeRetrieval';
import { useAuth } from '../auth/AuthContext';
import Sidebar from './Sidebar';

const nodeTypes = {
  custom: CustomNode,
  retrieval: CustomNodeRetrieval,
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
  const [reconciliationId, setReconciliationId] = useState(null); // Initialize to null
  const [useCustomNodeRetrieval, setUseCustomNodeRetrieval] = useState(false);

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
              });
            }
          } else if (preprocessingType === 'AGGREGATE') {
            if (options.alias) {
              schema.push({
                column_name: options.alias,
                file_schema_id: options.groupByColumn?.file_schema_id,
              });
            }
          } else if (preprocessingType === 'CONDITIONAL_FILTERING_BY_CONTAINS') {
            if (options.alias) {
              schema.push({
                column_name: options.alias,
                file_schema_id: options.targetColumn?.file_schema_id,
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
  const handleReconciliationSelect = async (selectedReconciliationId) => {
    if (!user || !token) {
      console.warn('User or token not available.');
      return;
    }
  
    try {
      const response = await fetch(
        `http://34.70.96.246:8080/api/reconciliation/reconciliation_requests?reconciliation_id=${selectedReconciliationId}&user_id=${user.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      if (!response.ok) {
        throw new Error('Failed to fetch reconciliation data.');
      }
  
      const data = await response.json();
      console.log('Fetched Data:', data);
  
      if (!data.nodes) {
        throw new Error('Invalid reconciliation data format.');
      }
  
      const { nodes: fetchedNodes } = data;
      const processedNodes = [];
      const edges = [];
  
      const getFileSchema = (fileSchemaId) => {
        const file = fileSchemaData?.clientFileSchemas?.find(
          (f) => f.fileSchemaId === fileSchemaId
        );
        return file ? { fileSchema: file.fileSchema, fileName: file.fileName } : null;
      };
  
      fetchedNodes.forEach((node) => {
        const nodeId = node.nodeId;
        let label = '';
        let icon = '';
        let nodeData = {};
  
        // Process Data Ingestion Nodes
        if (node.dataIngestionNode) {
          label = 'Data Ingestion';
          icon = 'AiOutlineLogin';
  
          const fileDetails = getFileSchema(node.dataIngestionNode.fileSchemaId);
          nodeData = {
            fileSchemaId: node.dataIngestionNode.fileSchemaId,
            fileName: fileDetails?.fileName || 'Unknown File',
            fileSchema: fileDetails?.fileSchema || [],
          };
  
          processedNodes.push({
            id: nodeId,
            type: 'retrieval',
            data: {
              label,
              icon,
              nodeData,
              fileSchemaData,
              deleteNode,
              updateNodeData,
            },
            position: node.position,
          });
        }
  
        // Process Preprocessing Nodes
        if (node.nodeType === 'PRE_PROCESSING') {
          label = 'Preprocessing';
          icon = 'LiaObjectGroupSolid';
  
          const preprocessingNode = node.preprocessingNode;
  
          if (preprocessingNode.concatColumns) {
            nodeData = {
              preprocessingType: 'Concat Columns',
              concatColumns: preprocessingNode.concatColumns,
            };
          } else if (preprocessingNode.aggregateFunction) {
            nodeData = {
              preprocessingType: 'Aggregate',
              aggregateFunction: preprocessingNode.aggregateFunction,
            };
          } else if (preprocessingNode.conditionalFilteringByContains) {
            nodeData = {
              preprocessingType: 'Conditional Filtering by Contains',
              conditionalFilteringByContains: preprocessingNode.conditionalFilteringByContains,
            };
          }
  
          processedNodes.push({
            id: nodeId,
            type: 'retrieval',
            data: {
              label,
              icon,
              nodeData,
              dependencies: node.dependencies,
              deleteNode,
              updateNodeData,
            },
            position: node.position,
          });
        }
  
        // Process Reconciliation Nodes
        if (node.nodeType === 'RECONCILIATION') {
          label = 'Reconciliation';
          icon = 'AiOutlineLogout';
  
          nodeData = {
            matchingRules: node.reconciliationNode?.matchingRules.map((rule) => ({
              lhsColumn: {
                columnName: rule.lhsColumn.columnName,
                fileSchemaId: rule.lhsColumn.fileSchemaId,
                fileName:
                  getFileSchema(rule.lhsColumn.fileSchemaId)?.fileName || 'Unknown File',
              },
              rhsColumn: {
                columnName: rule.rhsColumn.columnName,
                fileSchemaId: rule.rhsColumn.fileSchemaId,
                fileName:
                  getFileSchema(rule.rhsColumn.fileSchemaId)?.fileName || 'Unknown File',
              },
            })),
            dependencies: node.dependencies,
          };
  
          processedNodes.push({
            id: nodeId,
            type: 'retrieval',
            data: {
              label,
              icon,
              nodeData,
              dependencies: node.dependencies,
              deleteNode,
              updateNodeData,
            },
            position: node.position,
          });
        }
  
        // Create edges for dependencies
        if (node.dependencies && Array.isArray(node.dependencies)) {
          node.dependencies.forEach((depId) => {
            edges.push({
              id: `edge-${depId}-${nodeId}`,
              source: depId,
              target: nodeId,
              type: 'default',
              animated: true,
              style: { stroke: '#007bff', strokeWidth: 2 },
            });
          });
        }
      });
  
      setNodes(processedNodes);
      setEdges(edges);
  
      if (reactFlowInstance) {
        reactFlowInstance.fitView();
      }
    } catch (error) {
      console.error('Error processing reconciliation data:', error);
    }
  };
  
  

  

const saveReconciliation = (customReconciliationId) => {
  if (!user || !token) {
    console.error('User or token is not available.');
    alert('Please log in to save the reconciliation.');
    return;
  }

  if (nodes.length > 0) {
    const userId = user.id;
    const nodeIdMapping = {};

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

    const ingestNodes = [];
    const preprocessNodes = [];
    const reconciliationNodes = [];

    nodes.forEach((node) => {
      const nodeId = nodeIdMapping[node.id];

      if (node.data.label === 'Data Ingestion') {
        ingestNodes.push({
          node_id: nodeId,
          node_type: 'DATA_INGESTION',
          dependencies: [],
          position: node.position,
          data_ingestion_node: {
            user_id: userId,
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
          preprocessingNode.concat_columns = {
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
          preprocessingNode.aggregate_function = {
            group_by_column: {
              file_schema_id: options.groupByColumn?.file_schema_id,
              column_name: options.groupByColumn?.column,
              is_transformed: options.groupByColumn?.is_transformed || true,
              
            },
            target_column: {
              file_schema_id: options.targetColumn?.file_schema_id,
              column_name: options.targetColumn?.column,
            },
            alias: options.alias,
            aggregate_type: options.aggregateType,
          };
        } else if (preprocessingType === 'CONDITIONAL_FILTERING_BY_CONTAINS') {
          preprocessingNode.conditional_filtering_by_contains = {
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
          node_id: nodeId,
          node_type: 'PRE_PROCESSING',
          dependencies: dependencies,
          position: node.position,
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
          },
          rhs_column: {
            file_schema_id: rule.rhsSelection.file_schema_id,
            column_name: rule.rhsSelection.column,
          },
          matching_type: rule.matchingMethod,
        }));

        reconciliationNodes.push({
          node_id: nodeId,
          node_type: 'RECONCILIATION',
          dependencies: dependencies,
          position: node.position,
          reconciliation_node: {
            reconciliation_type: 'ONE_TO_ONE',
            matching_rules: matchingRules,
          },
        });
      }
    });

    const jsonPayload = {
      user_id: userId,
      reconciliation_id: customReconciliationId || `reconciliation_${Date.now()}`, // Use custom ID if provided
      nodes: [...ingestNodes, ...preprocessNodes, ...reconciliationNodes],
      save_request: true,
    };

    console.log('Save JSON Payload:', JSON.stringify(jsonPayload, null, 2));

    fetch('http://34.70.96.246:8080/api/reconciliation/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(jsonPayload),
    })
      .then((response) =>
        response.ok ? response.json() : Promise.reject('Failed to save reconciliation.')
      )
      .then((data) => {
        console.log('Reconciliation Save Success:', data);
        alert('Reconciliation saved successfully!');
      })
      .catch((error) => {
        console.error('Error saving reconciliation:', error);
        alert('An error occurred while saving the reconciliation.');
      });
  } else {
    alert('No graph is available to save.');
  }
};

const generateJSONAndRun = () => {
  if (!user || !token) {
    console.error('User or token is not available.');
    alert('Please log in to proceed.');
    return;
  }

  if (nodes.length > 0) {
    const userId = user.id;
    const nodeIdMapping = {};

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

    const ingestNodes = [];
    const preprocessNodes = [];
    const reconciliationNodes = [];

    nodes.forEach((node) => {
      const nodeId = nodeIdMapping[node.id];

      if (node.data.label === 'Data Ingestion') {
        ingestNodes.push({
          node_id: nodeId,
          node_type: 'DATA_INGESTION',
          dependencies: [],
          position: node.position,
          data_ingestion_node: {
            user_id: userId,
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
          preprocessingNode.concat_columns = {
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
          preprocessingNode.aggregate_function = {
            group_by_column: {
              file_schema_id: options.groupByColumn?.file_schema_id,
              column_name: options.groupByColumn?.column,
              is_transformed: options.groupByColumn?.is_transformed || true,
              
            },
            target_column: {
              file_schema_id: options.targetColumn?.file_schema_id,
              column_name: options.targetColumn?.column,
            },
            alias: options.alias,
            aggregate_type: options.aggregateType,
          };
        } else if (preprocessingType === 'CONDITIONAL_FILTERING_BY_CONTAINS') {
          preprocessingNode.conditional_filtering_by_contains = {
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
          node_id: nodeId,
          node_type: 'PRE_PROCESSING',
          dependencies: dependencies,
          position: node.position,
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
            //is_reduced: rule.lhsSelection.is_transformed || true,
          },
          rhs_column: {
            file_schema_id: rule.rhsSelection.file_schema_id,
            column_name: rule.rhsSelection.column,
            //is_reduced: rule.rhsSelection.is_transformed || true,
          },
          matching_type: rule.matchingMethod,
        }));

        reconciliationNodes.push({
          node_id: nodeId,
          node_type: 'RECONCILIATION',
          dependencies: dependencies,
          position: node.position,
          reconciliation_node: {
            reconciliation_type: 'ONE_TO_ONE',
            matching_rules: matchingRules,
          },
        });
      }
    });

    const generateReconciliationId = () => {
      const timestamp = Date.now();
      return `reconciliation_${timestamp}`;
    };

    const reconciliationIdToUse = reconciliationId
      ? reconciliationId.toString()
      : generateReconciliationId();

    const jsonPayload = {
      user_id: userId,
      reconciliation_id: reconciliationIdToUse,
      nodes: [...ingestNodes, ...preprocessNodes, ...reconciliationNodes],
    };

    console.log('Generated JSON Payload:', JSON.stringify(jsonPayload, null, 2));

    fetch('http://34.70.96.246:8080/api/reconciliation/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(jsonPayload),
    })
      .then((response) =>
        response.ok ? response.json() : Promise.reject('Network response was not ok.')
      )
      .then((data) => {
        console.log('Reconciliation Run Success:', data);
        alert('Reconciliation process started successfully.');
        fetchAndDownloadResponses(reconciliationIdToUse); // Pass the reconciliation_id here
      })
      .catch((error) => {
        console.error('Error initiating reconciliation:', error);
        alert('An error occurred while initiating the reconciliation process.');
      });
  } else {
    alert('No graph is available to generate JSON.');
  }
};

const fetchAndDownloadResponses = (reconciliationId) => { // Accept reconciliationId as a parameter
  if (!reconciliationId) {
    console.error('Reconciliation ID is required to fetch responses.');
    alert('Reconciliation ID is missing.');
    return;
  }

  const fileSchemaIds = new Set();

  // Collect unique file schema IDs from nodes
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

  // Helper function to download the response
  const downloadResponse = async (fileSchemaId, urlType) => {
    const url =
      urlType === 'reconciled'
        ? `http://34.70.96.246:8080/api/reconciliation/reconciled_output?user_id=${user?.id}&file_schema_id=${fileSchemaId}&reconciliation_id=${reconciliationId}`
        : `http://34.70.96.246:8080/api/reconciliation/unreconciled_output?user_id=${user?.id}&file_schema_id=${fileSchemaId}&reconciliation_id=${reconciliationId}`;

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch ${urlType} data for file schema ID ${fileSchemaId}`);
      }

      const data = await response.json();

      if (data.download_url) {
        // Open the file in a new tab
        window.open(data.download_url, '_blank');
      } else {
        console.error(`No download URL provided for ${urlType} data of file schema ID ${fileSchemaId}`);
      }
    } catch (error) {
      console.error(`Error fetching ${urlType} data for file schema ID ${fileSchemaId}:`, error);
    }
  };

  // Trigger downloads sequentially
  const downloadAll = async () => {
    for (const fileSchemaId of fileSchemaArray) {
      // Download reconciled output
      await downloadResponse(fileSchemaId, 'reconciled');
      // Download unreconciled output
      await downloadResponse(fileSchemaId, 'unreconciled');
    }
  };

  downloadAll();
};

  return (
    <>
      <Sidebar
        generateJSONAndRun={generateJSONAndRun}  saveReconciliation={saveReconciliation} // Pass the function to Sidebar
        onSelectReconciliation={handleReconciliationSelect} // Pass the handler to Sidebar
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
      </div>
    </>
  );
};

export default GraphEnvironment;
