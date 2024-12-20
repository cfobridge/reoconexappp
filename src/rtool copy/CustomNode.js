// CustomNode.js
import React, { useState, useEffect } from 'react';
import { Handle, Position } from 'react-flow-renderer';
import { GrFormAdd } from "react-icons/gr";
import {
  AiOutlineDelete,
  AiOutlineSetting,
  AiOutlineLogin,
  AiOutlineLogout,
} from 'react-icons/ai';
import { LiaObjectGroupSolid } from 'react-icons/lia';
import { CiMenuKebab } from 'react-icons/ci';
import './CustomNode.css';

const icons = {
  AiOutlineSetting: AiOutlineSetting,
  AiOutlineLogin: AiOutlineLogin,
  AiOutlineLogout: AiOutlineLogout,
  LiaObjectGroupSolid: LiaObjectGroupSolid,
};

const CustomNode = ({ data, id }) => {
  const [showOptions, setShowOptions] = useState(false);
  const [selectedFileSchemaId, setSelectedFileSchemaId] = useState(null);

  const [matchingRules, setMatchingRules] = useState([
    {
      lhsSelection: { file_schema_id: null, column: null, is_transformed: false },
      rhsSelection: { file_schema_id: null, column: null, is_transformed: false },
      matchingMethod: 'EXACT_MATCH',
    },
  ]);

  const [preprocessingType, setPreprocessingType] = useState('');
  const [preprocessingOptions, setPreprocessingOptions] = useState({});

  const handleDelete = () => {
    if (data.deleteNode) {
      data.deleteNode(id);
    }
  };

  const toggleOptions = (e) => {
    e.stopPropagation(); // Prevent event bubbling
    setShowOptions((prev) => !prev);
  };

  const IconComponent = icons[data.icon];
  const fileSchemaData = data.fileSchemaData?.clientFileSchemas || [];

  // Update node data when selections change
  useEffect(() => {
    if (data.label === 'Reconciliation' && data.updateNodeData) {
      data.updateNodeData(id, {
        matchingRules,
      });
    }
  }, [matchingRules]);

  useEffect(() => {
    if (data.label === 'Data Ingestion' && data.updateNodeData) {
      data.updateNodeData(id, {
        fileSchemaId: selectedFileSchemaId,
      });
    }
  }, [selectedFileSchemaId]);

  useEffect(() => {
    if (data.label === 'Preprocessing' && data.updateNodeData) {
      data.updateNodeData(id, {
        preprocessingType,
        preprocessingOptions,
        alias: preprocessingOptions.alias || '', // Add alias to node data
      });
    }
  }, [preprocessingType, preprocessingOptions]);

  // Functions to handle matching rules
  const addMatchingRule = () => {
    setMatchingRules([
      ...matchingRules,
      {
        lhsSelection: { file_schema_id: null, column: null, is_transformed: false },
        rhsSelection: { file_schema_id: null, column: null, is_transformed: false },
        matchingMethod: 'EXACT_MATCH',
      },
    ]);
  };

  const removeMatchingRule = (index) => {
    setMatchingRules(matchingRules.filter((_, i) => i !== index));
  };

  const updateMatchingRule = (index, updatedRule) => {
    setMatchingRules(
      matchingRules.map((rule, i) => (i === index ? updatedRule : rule))
    );
  };

  // Functions to handle preprocessing options
  const handlePreprocessingOptionChange = (optionName, value) => {
    setPreprocessingOptions((prev) => ({
      ...prev,
      [optionName]: value,
    }));
  };

  return (
    <div className="custom-node">
      <div className="node-header" onClick={toggleOptions}>
        {IconComponent && <IconComponent className="node-icon" />}
        <span className="node-label">
          {data.label}
          {data.label === 'Preprocessing' && preprocessingOptions.alias
            ? ` (${preprocessingOptions.alias})`
            : ''}
        </span>
        <CiMenuKebab className="dropdown-icon" />
      </div>

      {showOptions && (
        <div
          className="dropdown-options"
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
        >
          {/* Data Ingestion: Select File */}
          {data.label === 'Data Ingestion' && (
            <div className="dropdown-section">
              <span>Select File:</span>
              <select
                onChange={(e) => {
                  const selectedFileSchemaId = e.target.value;
                  setSelectedFileSchemaId(selectedFileSchemaId);
                }}
                value={selectedFileSchemaId || ''}
              >
                <option value="" disabled>
                  Select a file
                </option>
                {fileSchemaData.map((file) => (
                  <option key={file.fileSchemaId} value={file.fileSchemaId}>
                    {file.fileName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Reconciliation: Matching Rules */}
          {data.label === 'Reconciliation' && (
            <>
              {matchingRules.map((rule, index) => (
                <div key={index} className="matching-rule">
                  <div className="dropdown-section">
                    <span>LHS Column:</span>
                    <select
                      onChange={(e) => {
                        const [file_schema_id, column] = e.target.value.split('|');
                        const is_transformed =
                          e.target.selectedOptions[0].getAttribute('data-transformed') ===
                          'true';
                        updateMatchingRule(index, {
                          ...rule,
                          lhsSelection: { file_schema_id, column, is_transformed },
                        });
                      }}
                      value={
                        rule.lhsSelection.file_schema_id && rule.lhsSelection.column
                          ? `${rule.lhsSelection.file_schema_id}|${rule.lhsSelection.column}`
                          : ''
                      }
                    >
                      <option value="" disabled>
                        Select LHS Column
                      </option>
                      {data.inputSchemas?.map((input) => (
                        <optgroup key={input.nodeId} label={input.label}>
                          {input.schema?.map((col) => (
                            <option
                              key={`${col.file_schema_id}|${col.column_name}`}
                              value={`${col.file_schema_id}|${col.column_name}`}
                              data-transformed={col.is_transformed}
                            >
                              {col.column_name}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  <div className="dropdown-section">
                    <span>RHS Column:</span>
                    <select
                      onChange={(e) => {
                        const [file_schema_id, column] = e.target.value.split('|');
                        const is_transformed =
                          e.target.selectedOptions[0].getAttribute('data-transformed') ===
                          'true';
                        updateMatchingRule(index, {
                          ...rule,
                          rhsSelection: { file_schema_id, column, is_transformed },
                        });
                      }}
                      value={
                        rule.rhsSelection.file_schema_id && rule.rhsSelection.column
                          ? `${rule.rhsSelection.file_schema_id}|${rule.rhsSelection.column}`
                          : ''
                      }
                    >
                      <option value="" disabled>
                        Select RHS Column
                      </option>
                      {data.inputSchemas?.map((input) => (
                        <optgroup key={input.nodeId} label={input.label}>
                          {input.schema?.map((col) => (
                            <option
                              key={`${col.file_schema_id}|${col.column_name}`}
                              value={`${col.file_schema_id}|${col.column_name}`}
                              data-transformed={col.is_transformed}
                            >
                              {col.column_name}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  <div className="dropdown-section">
                    <span>Matching:</span>
                    <select
                      onChange={(e) =>
                        updateMatchingRule(index, {
                          ...rule,
                          matchingMethod: e.target.value,
                        })
                      }
                      value={rule.matchingMethod}
                    >
                      <option value="EXACT_MATCH">Exact Match</option>
                    </select>
                  </div>
                  <div  className="delete_option node_btn violet" onClick={() => removeMatchingRule(index)}> 
                  <span>Delete Column</span>
                  <AiOutlineDelete className="delete-icon" />
                  </div>
                </div>
              ))}
              <div  className="delete_option node_btn green" onClick={addMatchingRule}> 
                  <span>Add Node</span>
                  <GrFormAdd className="delete-icon" />
                  </div>
            </>
          )}

          {/* Preprocessing Node Options */}
          {data.label === 'Preprocessing' && (
            <>
              <div className="dropdown-section">
                <span>Select Preprocessing Type:</span>
                <select
                  onChange={(e) => {
                    const selectedType = e.target.value;
                    setPreprocessingType(selectedType);
                    setPreprocessingOptions({}); // Reset options when type changes
                  }}
                  value={preprocessingType}
                >
                  <option value="" disabled>
                    Select a type
                  </option>
                  <option value="CONCAT_COLUMNS">Concat Columns</option>
                  <option value="AGGREGATE">Aggregate</option>
                  <option value="CONDITIONAL_FILTERING_BY_CONTAINS">
                    Conditional Filtering by Contains
                  </option>
                </select>
              </div>

              {/* Preprocessing Options based on Type */}
              {preprocessingType === 'CONCAT_COLUMNS' && (
                <>
                  {/* LHS Column */}
                  <div className="dropdown-section">
                    <span>LHS Column:</span>
                    <select
                      onChange={(e) => {
                        const [file_schema_id, column] = e.target.value.split('|');
                        handlePreprocessingOptionChange('lhsColumn', {
                          file_schema_id,
                          column,
                        });
                      }}
                      value={
                        preprocessingOptions.lhsColumn?.file_schema_id &&
                        preprocessingOptions.lhsColumn?.column
                          ? `${preprocessingOptions.lhsColumn.file_schema_id}|${preprocessingOptions.lhsColumn.column}`
                          : ''
                      }
                    >
                      <option value="" disabled>
                        Select Column
                      </option>
                      {data.inputSchemas[0]?.schema?.map((col) => (
                        <option
                          key={`${col.file_schema_id}|${col.column_name}`}
                          value={`${col.file_schema_id}|${col.column_name}`}
                        >
                          {col.column_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* RHS Column */}
                  <div className="dropdown-section">
                    <span>RHS Column:</span>
                    <select
                      onChange={(e) => {
                        const [file_schema_id, column] = e.target.value.split('|');
                        handlePreprocessingOptionChange('rhsColumn', {
                          file_schema_id,
                          column,
                        });
                      }}
                      value={
                        preprocessingOptions.rhsColumn?.file_schema_id &&
                        preprocessingOptions.rhsColumn?.column
                          ? `${preprocessingOptions.rhsColumn.file_schema_id}|${preprocessingOptions.rhsColumn.column}`
                          : ''
                      }
                    >
                      <option value="" disabled>
                        Select Column
                      </option>
                      {data.inputSchemas[0]?.schema?.map((col) => (
                        <option
                          key={`${col.file_schema_id}|${col.column_name}`}
                          value={`${col.file_schema_id}|${col.column_name}`}
                        >
                          {col.column_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Alias */}
                  <div className="dropdown-section">
                    <span>Alias:</span>
                    <input
                      type="text"
                      value={preprocessingOptions.alias || ''}
                      onChange={(e) =>
                        handlePreprocessingOptionChange('alias', e.target.value)
                      }
                    />
                  </div>
                </>
              )}

              {preprocessingType === 'AGGREGATE' && (
                <>
                  {/* Group By Column */}
                  <div className="dropdown-section">
                    <span>Group By Column:</span>
                    <select
                      onChange={(e) => {
                        const [file_schema_id, column] = e.target.value.split('|');
                        const is_transformed =
                          e.target.selectedOptions[0].getAttribute('data-transformed') ===
                          'true';
                        handlePreprocessingOptionChange('groupByColumn', {
                          file_schema_id,
                          column,
                          is_transformed,
                        });
                      }}
                      value={
                        preprocessingOptions.groupByColumn?.file_schema_id &&
                        preprocessingOptions.groupByColumn?.column
                          ? `${preprocessingOptions.groupByColumn.file_schema_id}|${preprocessingOptions.groupByColumn.column}`
                          : ''
                      }
                    >
                      <option value="" disabled>
                        Select Column
                      </option>
                      {data.inputSchemas[0]?.schema?.map((col) => (
                        <option
                          key={`${col.file_schema_id}|${col.column_name}`}
                          value={`${col.file_schema_id}|${col.column_name}`}
                          data-transformed={col.is_transformed}
                        >
                          {col.column_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Target Column */}
                  <div className="dropdown-section">
                    <span>Target Column:</span>
                    <select
                      onChange={(e) => {
                        const [file_schema_id, column] = e.target.value.split('|');
                        handlePreprocessingOptionChange('targetColumn', {
                          file_schema_id,
                          column,
                        });
                      }}
                      value={
                        preprocessingOptions.targetColumn?.file_schema_id &&
                        preprocessingOptions.targetColumn?.column
                          ? `${preprocessingOptions.targetColumn.file_schema_id}|${preprocessingOptions.targetColumn.column}`
                          : ''
                      }
                    >
                      <option value="" disabled>
                        Select Column
                      </option>
                      {data.inputSchemas[0]?.schema?.map((col) => (
                        <option
                          key={`${col.file_schema_id}|${col.column_name}`}
                          value={`${col.file_schema_id}|${col.column_name}`}
                        >
                          {col.column_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Aggregate Type */}
                  <div className="dropdown-section">
                    <span>Aggregate Type:</span>
                    <select
                      onChange={(e) =>
                        handlePreprocessingOptionChange('aggregateType', e.target.value)
                      }
                      value={preprocessingOptions.aggregateType || ''}
                    >
                      <option value="" disabled>
                        Select Type
                      </option>
                      <option value="SUM">SUM</option>
                      <option value="COUNT">COUNT</option>
                      <option value="AVG">AVG</option>
                      <option value="MIN">MIN</option>
                      <option value="MAX">MAX</option>
                    </select>
                  </div>

                  {/* Alias */}
                  <div className="dropdown-section">
                    <span>Alias:</span>
                    <input
                      type="text"
                      value={preprocessingOptions.alias || ''}
                      onChange={(e) =>
                        handlePreprocessingOptionChange('alias', e.target.value)
                      }
                    />
                  </div>
                </>
              )}

              {preprocessingType === 'CONDITIONAL_FILTERING_BY_CONTAINS' && (
                <>
                  {/* Filter Column */}
                  <div className="dropdown-section">
                    <span>Filter Column:</span>
                    <select
                      onChange={(e) => {
                        const [file_schema_id, column] = e.target.value.split('|');
                        handlePreprocessingOptionChange('filterColumn', {
                          file_schema_id,
                          column,
                        });
                      }}
                      value={
                        preprocessingOptions.filterColumn?.file_schema_id &&
                        preprocessingOptions.filterColumn?.column
                          ? `${preprocessingOptions.filterColumn.file_schema_id}|${preprocessingOptions.filterColumn.column}`
                          : ''
                      }
                    >
                      <option value="" disabled>
                        Select Column
                      </option>
                      {data.inputSchemas[0]?.schema?.map((col) => (
                        <option
                          key={`${col.file_schema_id}|${col.column_name}`}
                          value={`${col.file_schema_id}|${col.column_name}`}
                        >
                          {col.column_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Target Column */}
                  <div className="dropdown-section">
                    <span>Target Column:</span>
                    <select
                      onChange={(e) => {
                        const [file_schema_id, column] = e.target.value.split('|');
                        handlePreprocessingOptionChange('targetColumn', {
                          file_schema_id,
                          column,
                        });
                      }}
                      value={
                        preprocessingOptions.targetColumn?.file_schema_id &&
                        preprocessingOptions.targetColumn?.column
                          ? `${preprocessingOptions.targetColumn.file_schema_id}|${preprocessingOptions.targetColumn.column}`
                          : ''
                      }
                    >
                      <option value="" disabled>
                        Select Column
                      </option>
                      {data.inputSchemas[0]?.schema?.map((col) => (
                        <option
                          key={`${col.file_schema_id}|${col.column_name}`}
                          value={`${col.file_schema_id}|${col.column_name}`}
                        >
                          {col.column_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Phrase Contained */}
                  <div className="dropdown-section">
                    <span>Phrase Contained:</span>
                    <input
                      type="text"
                      value={preprocessingOptions.phraseContained || ''}
                      onChange={(e) =>
                        handlePreprocessingOptionChange('phraseContained', e.target.value)
                      }
                    />
                  </div>

                  {/* Alias */}
                  <div className="dropdown-section">
                    <span>Alias:</span>
                    <input
                      type="text"
                      value={preprocessingOptions.alias || ''}
                      onChange={(e) =>
                        handlePreprocessingOptionChange('alias', e.target.value)
                      }
                    />
                  </div>
                </>
              )}
            </>
          )}

          {/* Delete Option */}
          <div className="delete_option node_btn red" onClick={handleDelete}>
            <span>Delete Node</span>
            <AiOutlineDelete className="delete-icon" />
          </div>
        </div>
      )}

      {/* Left and Right Handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        style={{ background: '#555' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{ background: '#555' }}
      />
    </div>
  );
};

export default CustomNode;
