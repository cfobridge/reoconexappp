import React, { useState, useEffect } from 'react';
import { Handle, Position } from 'react-flow-renderer';
import { AiOutlineDelete, AiOutlineLogin, AiOutlineLogout } from 'react-icons/ai';
import { LiaObjectGroupSolid } from 'react-icons/lia';
import { CiMenuKebab } from 'react-icons/ci';
import { GrFormAdd } from 'react-icons/gr';
import './CustomNode.css';

const icons = {
  AiOutlineLogin: AiOutlineLogin,
  AiOutlineLogout: AiOutlineLogout,
  LiaObjectGroupSolid: LiaObjectGroupSolid,
};

const CustomNodeRetrieval = ({ data, id }) => {
  const [showOptions, setShowOptions] = useState(false);
  const [selectedFileSchemaId, setSelectedFileSchemaId] = useState(data.nodeData?.fileSchemaId || '');
  const [fileName, setFileName] = useState(data.nodeData?.fileName || 'Unknown File');
  const [preprocessingOptions, setPreprocessingOptions] = useState(data.nodeData?.preprocessingOptions || {});
  const [matchingRules, setMatchingRules] = useState(data.nodeData?.matchingRules || []);

  const [preprocessingType, setPreprocessingType] = useState('');

  const toggleOptions = (e) => {
    e.stopPropagation();
    setShowOptions((prev) => !prev);
  };

  const handleDelete = () => {
    if (data.deleteNode) {
      data.deleteNode(id);
    }
  };

  const IconComponent = icons[data.icon];
  const fileSchemaData = data.fileSchemaData?.clientFileSchemas || [];
  

  const handleFileChange = (fileSchemaId) => {
    const selectedFile = fileSchemaData.find((file) => file.fileSchemaId === fileSchemaId);
    setFileName(selectedFile?.fileName || 'Unknown File');
    setSelectedFileSchemaId(fileSchemaId);
    

    if (data.updateNodeData) {
      data.updateNodeData(id, {
        fileSchemaId,
        fileName: selectedFile?.fileName || 'Unknown File',
      });
    }
  };

  const updateMatchingRule = (index, updatedRule) => {
    setMatchingRules((prevRules) =>
      prevRules.map((rule, i) => (i === index ? updatedRule : rule))
    );
  };

  const addMatchingRule = () => {
    setMatchingRules((prevRules) => [
      ...prevRules,
      {
        lhsColumn: { columnName: '', fileName: '' },
        rhsColumn: { columnName: '', fileName: '' },
        matchingMethod: 'EXACT_MATCH',
      },
    ]);
  };
  const handlePreprocessingOptionChange = (optionName, value) => {
    setPreprocessingOptions((prev) => ({
      ...prev,
      [optionName]: value,
    }));
  };
  const removeMatchingRule = (index) => {
    setMatchingRules((prevRules) => prevRules.filter((_, i) => i !== index));
  };

  return (
    <div className="custom-node">
      <div
        className="node-header"
        onClick={toggleOptions}
        role="button"
        tabIndex="0"
        onKeyPress={(e) => {
          if (e.key === 'Enter') toggleOptions(e);
        }}
      >
        {IconComponent && <IconComponent className="node-icon" />}
        <span className="node-label">{data.label}</span>
        <CiMenuKebab className="dropdown-icon" />
      </div>

      {showOptions && (
        <div className="dropdown-options" onClick={(e) => e.stopPropagation()}>
          {data.label === 'Data Ingestion' && (
            <div className="dropdown-section">
              <span>Select File:</span>
              <select
                onChange={(e) => handleFileChange(e.target.value)}
                value={selectedFileSchemaId}
              >
                <option value="" disabled>Select a file</option>
                {fileSchemaData.map((file) => (
                  <option key={file.fileSchemaId} value={file.fileSchemaId}>
                    {file.fileName}
                  </option>
                ))}
              </select>
            </div>
          )}
          {/* Preprocessing Node Options */}
          {data.label === 'Preprocessing' && (
  <>
    {/* Preprocessing Type Dropdown */}
    <div className="dropdown-section">
      <span>Select Preprocessing Type:</span>
      <select
        onChange={(e) => {
          const selectedType = e.target.value;
          setPreprocessingType(selectedType);
          setPreprocessingOptions({}); // Reset options when type changes
        }}
        value={preprocessingType || data.nodeData.preprocessingType} // Default to the provided type
      >
        <option value={data.nodeData.preprocessingType} >
          {data.nodeData.preprocessingType}
        </option><option value="" disabled>Select a file</option>
        <option value="CONCAT_COLUMNS">Concat Columns</option>
        <option value="AGGREGATE">Aggregate</option>
        <option value="CONDITIONAL_FILTERING_BY_CONTAINS">
          Conditional Filtering by Contains
        </option>
      </select>
    </div>

    {/* CONCAT_COLUMNS Type */}
    {preprocessingType === 'CONCAT_COLUMNS' && data.nodeData.concatColumns && (
      <>
        <div className="dropdown-section">
          <span>LHS Column:</span>
          <select
            onChange={(e) => {
              const [fileSchemaId, columnName] = e.target.value.split('|');
              handlePreprocessingOptionChange('lhsColumn', { fileSchemaId, columnName });
            }}
            value={`${data.nodeData.concatColumns.lhsColumn.fileSchemaId}|${data.nodeData.concatColumns.lhsColumn.columnName}`}
          >
            <option
              value={`${data.nodeData.concatColumns.lhsColumn.fileSchemaId}|${data.nodeData.concatColumns.lhsColumn.columnName}`}
            >
              {data.nodeData.concatColumns.lhsColumn.columnName}
            </option>
            {data.inputSchemas[0]?.schema?.map((col) => (
              <option key={`${col.file_schema_id}|${col.column_name}`} value={`${col.file_schema_id}|${col.column_name}`}>
                {col.column_name}
              </option>
            ))}
          </select>
        </div>

        <div className="dropdown-section">
          <span>RHS Column:</span>
          <select
            onChange={(e) => {
              const [fileSchemaId, columnName] = e.target.value.split('|');
              handlePreprocessingOptionChange('rhsColumn', { fileSchemaId, columnName });
            }}
            value={`${data.nodeData.concatColumns.rhsColumn.fileSchemaId}|${data.nodeData.concatColumns.rhsColumn.columnName}`}
          >
            <option
              value={`${data.nodeData.concatColumns.rhsColumn.fileSchemaId}|${data.nodeData.concatColumns.rhsColumn.columnName}`}
            >
              {data.nodeData.concatColumns.rhsColumn.columnName}
            </option>
            {data.inputSchemas[0]?.schema?.map((col) => (
              <option key={`${col.file_schema_id}|${col.column_name}`} value={`${col.file_schema_id}|${col.column_name}`}>
                {col.column_name}
              </option>
            ))}
          </select>
        </div>

        <div className="dropdown-section">
          <span>Alias:</span>
          <input
            type="text"
            value={preprocessingOptions.alias || data.nodeData.concatColumns.alias}
            onChange={(e) => handlePreprocessingOptionChange('alias', e.target.value)}
            placeholder="Enter alias"
          />
        </div>
      </>
    )}

    {/* AGGREGATE Type */}
    {preprocessingType === 'AGGREGATE' && data.nodeData.aggregateFunction && (
      <>
        <div className="dropdown-section">
          <span>Group By Column:</span>
          <select
            onChange={(e) => {
              const [fileSchemaId, columnName] = e.target.value.split('|');
              const isTransformed = e.target.selectedOptions[0]?.getAttribute('data-transformed') === 'true';
              handlePreprocessingOptionChange('groupByColumn', { fileSchemaId, columnName, isTransformed });
            }}
            value={`${data.nodeData.aggregateFunction.groupByColumn.fileSchemaId}|${data.nodeData.aggregateFunction.groupByColumn.columnName}`}
          >
            <option
              value={`${data.nodeData.aggregateFunction.groupByColumn.fileSchemaId}|${data.nodeData.aggregateFunction.groupByColumn.columnName}`}
            >
              {data.nodeData.aggregateFunction.groupByColumn.columnName}
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

        <div className="dropdown-section">
          <span>Target Column:</span>
          <select
            onChange={(e) => {
              const [fileSchemaId, columnName] = e.target.value.split('|');
              handlePreprocessingOptionChange('targetColumn', { fileSchemaId, columnName });
            }}
            value={`${data.nodeData.aggregateFunction.targetColumn.fileSchemaId}|${data.nodeData.aggregateFunction.targetColumn.columnName}`}
          >
            <option
              value={`${data.nodeData.aggregateFunction.targetColumn.fileSchemaId}|${data.nodeData.aggregateFunction.targetColumn.columnName}`}
            >
              {data.nodeData.aggregateFunction.targetColumn.columnName}
            </option>
            {data.inputSchemas[0]?.schema?.map((col) => (
              <option key={`${col.file_schema_id}|${col.column_name}`} value={`${col.file_schema_id}|${col.column_name}`}>
                {col.column_name}
              </option>
            ))}
          </select>
        </div>

        <div className="dropdown-section">
          <span>Alias:</span>
          <input
            type="text"
            value={preprocessingOptions.alias || data.nodeData.aggregateFunction.alias}
            onChange={(e) => handlePreprocessingOptionChange('alias', e.target.value)}
            placeholder="Enter alias"
          />
        </div>
      </>
    )}

    {/* CONDITIONAL_FILTERING_BY_CONTAINS Type */}
    {preprocessingType === 'CONDITIONAL_FILTERING_BY_CONTAINS' && data.nodeData.conditionalFilteringByContains && (
      <>
        <div className="dropdown-section">
          <span>Filter Column:</span>
          <select
            onChange={(e) => {
              const [fileSchemaId, columnName] = e.target.value.split('|');
              handlePreprocessingOptionChange('filterColumn', { fileSchemaId, columnName });
            }}
            value={`${data.nodeData.conditionalFilteringByContains.filterColumn.fileSchemaId}|${data.nodeData.conditionalFilteringByContains.filterColumn.columnName}`}
          >
            <option
              value={`${data.nodeData.conditionalFilteringByContains.filterColumn.fileSchemaId}|${data.nodeData.conditionalFilteringByContains.filterColumn.columnName}`}
            >
              {data.nodeData.conditionalFilteringByContains.filterColumn.columnName}
            </option>
            {data.inputSchemas[0]?.schema?.map((col) => (
              <option key={`${col.file_schema_id}|${col.column_name}`} value={`${col.file_schema_id}|${col.column_name}`}>
                {col.column_name}
              </option>
            ))}
          </select>
        </div>

        <div className="dropdown-section">
          <span>Alias:</span>
          <input
            type="text"
            value={preprocessingOptions.alias || data.nodeData.conditionalFilteringByContains.alias}
            onChange={(e) => handlePreprocessingOptionChange('alias', e.target.value)}
            placeholder="Enter alias"
          />
        </div>
      </>
    )}
  </>
)}


{data.label === 'Reconciliation' && (
            <div className="dropdown-section">
              <p><strong>Matching Rules:</strong></p>
              {matchingRules.map((rule, index) => (
                <div key={index} className="matching-rule">
                  <div className="dropdown-section">
                    <span>LHS Column:</span>
                    <select
                      onChange={(e) => {
                        const [fileSchemaId, columnName] = e.target.value.split('|');
                        updateMatchingRule(index, {
                          ...rule,
                          lhsColumn: { fileSchemaId, columnName },
                        });
                      }}
                      value={
                        rule.lhsColumn.fileSchemaId && rule.lhsColumn.columnName
                          ? `${rule.lhsColumn.fileSchemaId}|${rule.lhsColumn.columnName}`
                          : ''
                      }
                    >
                      <option value={rule.lhsColumn.columnName}  > {rule.lhsColumn.columnName}</option>
                      {data.dependencies?.map((dependency) => {
                        const dependentNode = data.previousNodes?.find(
                          (node) => node.id === dependency
                        );
                        return (
                          <optgroup
                            key={dependentNode?.id}
                            label={`From: ${dependentNode?.data?.label || 'Unknown Node'}`}
                          >
                            {dependentNode?.data?.nodeData?.fileSchema?.map((col) => (
                              <option
                                key={`${col.fileSchemaId}|${col.columnName}`}
                                value={`${col.fileSchemaId}|${col.columnName}`}
                              >
                                {col.columnName}
                              </option>
                            ))}
                          </optgroup>
                        );
                      })}
                    </select>
                  </div>

                  <div className="dropdown-section">
                    <span>RHS Column:</span>
                    <select
                      onChange={(e) => {
                        const [fileSchemaId, columnName] = e.target.value.split('|');
                        updateMatchingRule(index, {
                          ...rule,
                          rhsColumn: { fileSchemaId, columnName },
                        });
                      }}
                      value={
                        rule.rhsColumn.fileSchemaId && rule.rhsColumn.columnName
                          ? `${rule.rhsColumn.fileSchemaId}|${rule.rhsColumn.columnName}`
                          : ''
                      }
                    >
                      <option value={rule.rhsColumn.columnName}>{rule.rhsColumn.columnName}</option>
                      {data.dependencies?.map((dependency) => {
                        const dependentNode = data.previousNodes?.find(
                          (node) => node.id === dependency
                        );
                        return (
                          <optgroup
                            key={dependentNode?.id}
                            label={`From: ${dependentNode?.data?.label || 'Unknown Node'}`}
                          >
                            {dependentNode?.data?.nodeData?.fileSchema?.map((col) => (
                              <option
                                key={`${col.fileSchemaId}|${col.columnName}`}
                                value={`${col.fileSchemaId}|${col.columnName}`}
                              >
                                {col.columnName}
                              </option>
                            ))}
                          </optgroup>
                        );
                      })}
                    </select>
                  </div>

                  <div className="dropdown-section">
                    <span>Matching Method:</span>
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

                  <div
                    className="delete_option node_btn red"
                    onClick={() => removeMatchingRule(index)}
                    role="button"
                    tabIndex="0"
                  >
                    <span>Delete Rule</span>
                    <AiOutlineDelete className="delete-icon" />
                  </div>
                </div>
              ))}

              <div
                className="add_option node_btn green"
                onClick={addMatchingRule}
                role="button"
                tabIndex="0"
              >
                <span>Add Rule</span>
                <GrFormAdd className="add-icon" />
              </div>
            </div>
          )}


          <div
            className="delete_option node_btn red"
            onClick={handleDelete}
            role="button"
            tabIndex="0"
          >
            <span>Delete Node</span>
            <AiOutlineDelete className="delete-icon" />
          </div>
        </div>
      )}



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

export default CustomNodeRetrieval;
